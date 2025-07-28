export default async function handler(req, res) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const apiKey = process.env.PERPLEXITY_API_KEY;
    
    const diagnostics = {
      timestamp: new Date().toISOString(),
      environment: {
        hasApiKey: !!apiKey,
        apiKeyLength: apiKey ? apiKey.length : 0,
        apiKeyPrefix: apiKey ? apiKey.substring(0, 8) + '...' : 'Not set',
        nodeVersion: process.version,
        environment: process.env.NODE_ENV || 'unknown'
      },
      availableEnvVars: Object.keys(process.env).filter(key => 
        key.includes('API') || key.includes('KEY') || key.includes('PERPLEXITY')
      )
    };

    res.status(200).json({
      status: 'API endpoint is working',
      diagnostics
    });

  } catch (error) {
    res.status(500).json({
      status: 'Error in test endpoint',
      error: error.message
    });
  }
} 