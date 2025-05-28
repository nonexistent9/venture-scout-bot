import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import csv from 'csv-parser';
import dotenv from 'dotenv';

// Load environment variables from .env.local file
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CHUNK_SIZE = 800; // Optimal chunk size for embeddings
const OVERLAP = 100; // Overlap between chunks to preserve context
const EMBEDDING_MODEL = 'embed-english-v3.0'; // Cohere's embedding model

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

// Extract topics from content (simple keyword-based approach)
function extractTopics(content, title = '') {
  const topics = new Set();
  const text = (content + ' ' + title).toLowerCase();
  
  // Business/startup related keywords
  const keywords = [
    'startup', 'business', 'entrepreneur', 'founder', 'company', 'revenue',
    'product', 'market', 'customer', 'user', 'growth', 'scale', 'funding',
    'investment', 'investor', 'venture', 'innovation', 'technology', 'idea',
    'strategy', 'competition', 'success', 'failure', 'team', 'hiring',
    'leadership', 'management', 'decision', 'risk', 'opportunity'
  ];
  
  keywords.forEach(keyword => {
    if (text.includes(keyword)) {
      topics.add(keyword);
    }
  });
  
  // Add compound topics
  if (text.includes('startup idea') || text.includes('business idea')) {
    topics.add('startup-ideas');
  }
  if (text.includes('y combinator') || text.includes('yc')) {
    topics.add('y-combinator');
  }
  if (text.includes('silicon valley')) {
    topics.add('silicon-valley');
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

// Generate embeddings using Cohere
async function generateEmbeddings(knowledgeItems) {
  console.log(`🔄 Generating Cohere embeddings for ${knowledgeItems.length} knowledge items...`);
  
  const embeddedItems = [];
  const batchSize = 96; // Cohere's max batch size
  
  for (let i = 0; i < knowledgeItems.length; i += batchSize) {
    const batch = knowledgeItems.slice(i, i + batchSize);
    console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(knowledgeItems.length / batchSize)}`);
    
    try {
      // Prepare texts for embedding
      const texts = batch.map(item => item.content);
      
      // Call Cohere API
      const response = await fetch('https://api.cohere.ai/v1/embed', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.COHERE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          texts: texts,
          model: EMBEDDING_MODEL,
          input_type: 'search_document' // For storing documents
        })
      });

      if (!response.ok) {
        throw new Error(`Cohere API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Combine items with their embeddings
      for (let j = 0; j < batch.length; j++) {
        embeddedItems.push({
          ...batch[j],
          embedding: data.embeddings[j]
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
    console.log('🚀 Starting knowledge base embedding generation with Cohere...\n');
    
    // Check for Cohere API key
    if (!process.env.COHERE_API_KEY) {
      console.error('❌ COHERE_API_KEY environment variable not set');
      console.log('Please add your Cohere API key to .env.local file:');
      console.log('COHERE_API_KEY=your_cohere_api_key_here');
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
        overlap: OVERLAP,
        provider: 'cohere'
      },
      items: embeddedItems
    };
    
    fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
    
    console.log(`\n✅ Successfully generated Cohere embeddings!`);
    console.log(`📁 Saved to: ${outputPath}`);
    console.log(`📊 Total items: ${embeddedItems.length}`);
    console.log(`💾 File size: ${(fs.statSync(outputPath).size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`🔧 Provider: Cohere (${EMBEDDING_MODEL})`);
    
    // Generate summary statistics
    const authorStats = {};
    const typeStats = {};
    const topicStats = {};
    
    embeddedItems.forEach(item => {
      // Count by author
      authorStats[item.author] = (authorStats[item.author] || 0) + 1;
      
      // Count by type
      typeStats[item.type] = (typeStats[item.type] || 0) + 1;
      
      // Count topics
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
      .reduce((obj, [key, val]) => ({ ...obj, [key]: val }), {})
    );
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the script
main(); 