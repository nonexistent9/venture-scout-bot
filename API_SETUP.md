# API Setup Instructions

## Real-Time Market Validation Dashboard Setup

To use the Market Validation Dashboard with real data, you only need to configure your Perplexity API key.

### Step 1: Get your API Key

#### Perplexity API (for all real-time data and AI analysis)
1. Go to [Perplexity API Settings](https://www.perplexity.ai/settings/api)
2. Create an account if you don't have one
3. Generate a new API key (starts with `pplx-`)

### Step 2: Create Environment File
1. In your project root directory (same level as `package.json`), create a file named `.env.local`
2. Add your API key to the file:
   ```
   VITE_PERPLEXITY_API_KEY=your_perplexity_api_key_here
   ```
3. Replace the placeholder value with your actual API key

### Step 3: Restart Development Server
After creating the `.env.local` file, restart your development server:
```bash
npm run dev
```



### What Perplexity API Provides:

#### Comprehensive Market Intelligence:
- **Google Trends Analysis**: AI-powered search interest trends over time
- **Competitor Research**: Real-time competitor discovery and analysis
- **Market Segments**: Industry-specific market segmentation
- **Sentiment Analysis**: Current market sentiment from news and social media
- **Market Metrics**: AI-powered market size and growth analysis
- **Strategic Insights**: AI-generated opportunities, challenges, and next steps

### Fallback Behavior:
- If API keys are missing, the dashboard will use intelligent mock data
- Each API call has error handling and graceful fallbacks
- The system will log warnings when using mock data instead of real APIs

### Important Notes:
- The `.env.local` file should NOT be committed to version control
- The environment variable must be prefixed with `VITE_` to be accessible in the browser
- Restart the dev server after making changes to environment variables
- Perplexity has usage limits - check your dashboard for current usage

### Cost Considerations:
- **Perplexity**: Pay-per-request model, very affordable for development
- Typically costs less than $0.01 per market validation request
- Free tier available for testing and development

That's it! Your real-time market validation dashboard is now configured with live data sources. 
