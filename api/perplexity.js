export default async function handler(req, res) {
  // Add CORS headers for local development
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get API key from environment (server-side only)
    const apiKey = process.env.PERPLEXITY_API_KEY;
    console.log('API Key check:', apiKey ? 'Present' : 'Missing');
    
    if (!apiKey) {
      console.error('PERPLEXITY_API_KEY environment variable not set');
      return res.status(500).json({ 
        error: 'API key not configured',
        debug: 'Environment variable PERPLEXITY_API_KEY is missing'
      });
    }

    // Validate request body
    const { messages, max_tokens = 4000 } = req.body || {};
    console.log('Request body check:', { 
      hasMessages: !!messages, 
      isArray: Array.isArray(messages),
      messageCount: messages?.length || 0,
      maxTokens: max_tokens
    });

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ 
        error: 'Invalid request body',
        debug: 'messages must be an array'
      });
    }

    if (messages.length === 0) {
      return res.status(400).json({ 
        error: 'Empty messages array',
        debug: 'At least one message is required'
      });
    }

    // Log the request we're about to make (without API key)
    console.log('Making Perplexity API request:', {
      url: 'https://api.perplexity.ai/chat/completions',
      model: 'llama-3.1-sonar-large-128k-online',
      messageCount: messages.length,
      maxTokens: max_tokens
    });

    // Make request to Perplexity API
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-large-128k-online',
        messages,
        max_tokens,
        temperature: 0.7,
        top_p: 0.9,
        stream: false
      }),
    });

    console.log('Perplexity API response status:', response.status);

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Perplexity API error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorData
      });
      
      return res.status(500).json({ 
        error: 'Perplexity API request failed',
        debug: {
          status: response.status,
          statusText: response.statusText,
          body: errorData
        }
      });
    }

    const data = await response.json();
    console.log('Successfully processed request');
    
    res.status(200).json(data);

  } catch (error) {
    console.error('Handler error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    res.status(500).json({ 
      error: 'Failed to process request',
      debug: {
        message: error.message,
        type: error.name
      }
    });
  }
} 