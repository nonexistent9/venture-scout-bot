import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';
import csv from 'csv-parser';
import dotenv from 'dotenv';

// Load environment variables from .env.local file
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Configuration
const CHUNK_SIZE = 800; // Optimal chunk size for embeddings
const OVERLAP = 100; // Overlap between chunks to preserve context
const EMBEDDING_MODEL = 'text-embedding-ada-002';

// Helper function to chunk text
function chunkText(text, chunkSize = CHUNK_SIZE, overlap = OVERLAP) {
  const words = text.split(' ');
  const chunks = [];
  
  for (let i = 0; i < words.length; i += chunkSize - overlap) {
    const chunk = words.slice(i, i + chunkSize).join(' ');
    if (chunk.trim().length > 50) { // Only include meaningful chunks
      chunks.push(chunk.trim());
    }
  }
  
  return chunks;
}

// Helper function to extract topics from content
function extractTopics(content, title = '') {
  const topics = new Set();
  const topicKeywords = {
    'startup-ideas': ['idea', 'startup idea', 'business idea', 'concept', 'opportunity'],
    'fundraising': ['funding', 'investment', 'investor', 'venture capital', 'seed', 'series a', 'money', 'capital'],
    'growth': ['growth', 'scale', 'scaling', 'user growth', 'revenue growth', 'expansion'],
    'product': ['product', 'mvp', 'minimum viable product', 'feature', 'development', 'build'],
    'marketing': ['marketing', 'customer acquisition', 'sales', 'promotion', 'advertising'],
    'team': ['team', 'hiring', 'founder', 'co-founder', 'employee', 'culture'],
    'strategy': ['strategy', 'business model', 'plan', 'execution', 'pivot'],
    'competition': ['competitor', 'competition', 'market', 'differentiation'],
    'advice': ['advice', 'tip', 'lesson', 'mistake', 'experience'],
    'mindset': ['mindset', 'psychology', 'mental', 'thinking', 'philosophy']
  };

  const lowerContent = (content + ' ' + title).toLowerCase();
  
  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    if (keywords.some(keyword => lowerContent.includes(keyword))) {
      topics.add(topic);
    }
  }

  return Array.from(topics);
}

// Process Paul Graham essays
async function processPaulGrahamEssays() {
  console.log('📚 Processing Paul Graham essays...');
  const essaysDir = path.join(__dirname, '../knowledge');
  const knowledgeItems = [];

  if (!fs.existsSync(essaysDir)) {
    console.log('❌ Knowledge directory not found');
    return knowledgeItems;
  }

  const files = fs.readdirSync(essaysDir).filter(file => file.endsWith('.md'));
  console.log(`Found ${files.length} Paul Graham essays`);

  for (const file of files) {
    try {
      const filePath = path.join(essaysDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      
      // Extract title from filename or content
      const title = file.replace('.md', '').replace(/-/g, ' ');
      
      // Clean content (remove markdown formatting)
      const cleanContent = content
        .replace(/^#.*$/gm, '') // Remove headers
        .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
        .replace(/\*(.*?)\*/g, '$1') // Remove italic
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links
        .replace(/\n\s*\n/g, '\n') // Remove extra newlines
        .trim();

      if (cleanContent.length < 100) continue; // Skip very short content

      // Chunk the content
      const chunks = chunkText(cleanContent);
      
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const topics = extractTopics(chunk, title);
        
        knowledgeItems.push({
          id: `pg_${file}_${i}`,
          title: title,
          author: 'Paul Graham',
          type: 'essay',
          content: chunk,
          topics: topics,
          source: file,
          chunkIndex: i,
          totalChunks: chunks.length
        });
      }
      
      console.log(`✅ Processed: ${title} (${chunks.length} chunks)`);
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error.message);
    }
  }

  return knowledgeItems;
}

// Process Naval content
async function processNavalContent() {
  console.log('🧭 Processing Naval Ravikant content...');
  const knowledgeItems = [];

  // Process Naval passages
  const passagesPath = path.join(__dirname, '../knowledge/naval_passages.csv');
  if (fs.existsSync(passagesPath)) {
    const passages = [];
    
    await new Promise((resolve, reject) => {
      fs.createReadStream(passagesPath)
        .pipe(csv())
        .on('data', (row) => passages.push(row))
        .on('end', resolve)
        .on('error', reject);
    });

    for (let i = 0; i < passages.length; i++) {
      const passage = passages[i];
      if (passage.content && passage.content.length > 50) {
        const topics = extractTopics(passage.content);
        
        knowledgeItems.push({
          id: `naval_passage_${i}`,
          title: passage.title || `Naval Passage ${i + 1}`,
          author: 'Naval Ravikant',
          type: 'passage',
          content: passage.content,
          topics: topics,
          source: 'naval_passages.csv',
          chunkIndex: 0,
          totalChunks: 1
        });
      }
    }
    
    console.log(`✅ Processed ${passages.length} Naval passages`);
  }

  // Process Naval clips
  const clipsPath = path.join(__dirname, '../knowledge/naval_clips.csv');
  if (fs.existsSync(clipsPath)) {
    const clips = [];
    
    await new Promise((resolve, reject) => {
      fs.createReadStream(clipsPath)
        .pipe(csv())
        .on('data', (row) => clips.push(row))
        .on('end', resolve)
        .on('error', reject);
    });

    for (let i = 0; i < clips.length; i++) {
      const clip = clips[i];
      if (clip.content && clip.content.length > 50) {
        const topics = extractTopics(clip.content);
        
        knowledgeItems.push({
          id: `naval_clip_${i}`,
          title: clip.file || `Naval Clip ${i + 1}`,
          author: 'Naval Ravikant',
          type: 'clip',
          content: clip.content,
          topics: topics,
          source: 'naval_clips.csv',
          chunkIndex: 0,
          totalChunks: 1
        });
      }
    }
    
    console.log(`✅ Processed ${clips.length} Naval clips`);
  }

  return knowledgeItems;
}

// Generate embeddings for knowledge items
async function generateEmbeddings(knowledgeItems) {
  console.log(`🔄 Generating embeddings for ${knowledgeItems.length} knowledge items...`);
  
  const embeddedItems = [];
  const batchSize = 100; // Process in batches to avoid rate limits
  
  for (let i = 0; i < knowledgeItems.length; i += batchSize) {
    const batch = knowledgeItems.slice(i, i + batchSize);
    console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(knowledgeItems.length / batchSize)}`);
    
    try {
      // Prepare texts for embedding
      const texts = batch.map(item => item.content);
      
      // Generate embeddings
      const response = await openai.embeddings.create({
        model: EMBEDDING_MODEL,
        input: texts,
      });
      
      // Combine items with their embeddings
      for (let j = 0; j < batch.length; j++) {
        embeddedItems.push({
          ...batch[j],
          embedding: response.data[j].embedding
        });
      }
      
      // Rate limiting - wait between batches
      if (i + batchSize < knowledgeItems.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
    } catch (error) {
      console.error(`❌ Error generating embeddings for batch:`, error.message);
      // Add items without embeddings as fallback
      batch.forEach(item => embeddedItems.push({ ...item, embedding: null }));
    }
  }
  
  return embeddedItems;
}

// Main processing function
async function main() {
  try {
    console.log('🚀 Starting knowledge base embedding generation...\n');
    
    // Check for OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ OPENAI_API_KEY environment variable not set');
      process.exit(1);
    }
    
    // Process all knowledge sources
    const paulGrahamItems = await processPaulGrahamEssays();
    const navalItems = await processNavalContent();
    
    const allKnowledgeItems = [...paulGrahamItems, ...navalItems];
    console.log(`\n📊 Total knowledge items: ${allKnowledgeItems.length}`);
    
    if (allKnowledgeItems.length === 0) {
      console.log('❌ No knowledge items found to process');
      return;
    }
    
    // Generate embeddings
    const embeddedItems = await generateEmbeddings(allKnowledgeItems);
    
    // Create output directory
    const outputDir = path.join(__dirname, '../public');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Save embeddings to file
    const outputPath = path.join(outputDir, 'knowledge-embeddings.json');
    const outputData = {
      metadata: {
        generatedAt: new Date().toISOString(),
        totalItems: embeddedItems.length,
        embeddingModel: EMBEDDING_MODEL,
        chunkSize: CHUNK_SIZE,
        overlap: OVERLAP
      },
      items: embeddedItems
    };
    
    fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
    
    console.log(`\n✅ Successfully generated embeddings!`);
    console.log(`📁 Saved to: ${outputPath}`);
    console.log(`📊 Total items: ${embeddedItems.length}`);
    console.log(`💾 File size: ${(fs.statSync(outputPath).size / 1024 / 1024).toFixed(2)} MB`);
    
    // Generate summary statistics
    const authorStats = {};
    const typeStats = {};
    const topicStats = {};
    
    embeddedItems.forEach(item => {
      authorStats[item.author] = (authorStats[item.author] || 0) + 1;
      typeStats[item.type] = (typeStats[item.type] || 0) + 1;
      item.topics.forEach(topic => {
        topicStats[topic] = (topicStats[topic] || 0) + 1;
      });
    });
    
    console.log('\n📈 Statistics:');
    console.log('Authors:', authorStats);
    console.log('Types:', typeStats);
    console.log('Top Topics:', Object.entries(topicStats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .reduce((obj, [key, val]) => ({ ...obj, [key]: val }), {}));
    
  } catch (error) {
    console.error('❌ Error in main process:', error);
    process.exit(1);
  }
}

// Run the script
main(); 