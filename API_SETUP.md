# API Setup Instructions

## Setting up your Perplexity API Key

To use the Startup Idea Validator, you need to configure your Perplexity API key locally.

### Step 1: Get your API Key
1. Go to [Perplexity API Settings](https://www.perplexity.ai/settings/api)
2. Create an account if you don't have one
3. Generate a new API key

### Step 2: Create Environment File
1. In your project root directory (same level as `package.json`), create a file named `.env.local`
2. Add the following line to the file:
   ```
   VITE_PERPLEXITY_API_KEY=your_actual_api_key_here
   ```
3. Replace `your_actual_api_key_here` with your actual Perplexity API key

### Step 3: Restart Development Server
After creating the `.env.local` file, restart your development server:
```bash
npm run dev
```

### Example `.env.local` file:
```
VITE_PERPLEXITY_API_KEY=pplx-1234567890abcdef1234567890abcdef
```

### Important Notes:
- The `.env.local` file should NOT be committed to version control
- Make sure your API key starts with `pplx-`
- The environment variable must be prefixed with `VITE_` to be accessible in the browser
- Restart the dev server after making changes to environment variables

That's it! Your API key is now configured and the ugly input field has been removed from the UI. 