# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/f90ebc5a-aff3-4118-b95e-79bf883b7f24

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/f90ebc5a-aff3-4118-b95e-79bf883b7f24) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## RAG Knowledge Base Setup

This project includes a RAG (Retrieval-Augmented Generation) system that provides semantic search over startup knowledge from Paul Graham essays and Naval Ravikant content.

### Prerequisites

1. **OpenAI API Key**: Required for generating embeddings
2. **Perplexity API Key**: Required for startup idea validation

### Setup Steps

1. **Set Environment Variables**:
   Create a `.env` file in the root directory:
   ```
   VITE_PERPLEXITY_API_KEY=your_perplexity_api_key_here
   OPENAI_API_KEY=your_openai_api_key_here
   ```

2. **Generate Embeddings**:
   ```sh
   npm run generate-embeddings
   ```
   This will:
   - Process all knowledge files in the `/knowledge` directory
   - Generate OpenAI embeddings for semantic search
   - Create a `knowledge-embeddings.json` file
   - Take a few minutes to complete

3. **Start the Application**:
   ```sh
   npm run dev
   ```

### Knowledge Base Features

- **Semantic Search**: Ask questions like "What does Paul Graham say about startups?"
- **Contextual Suggestions**: Get relevant advice after validating startup ideas
- **Multiple Content Types**: Essays, passages, and clips from startup experts
- **Topic-based Organization**: Content categorized by startup themes

### Knowledge Sources

- **Paul Graham Essays**: 150+ essays on startups, entrepreneurship, and technology
- **Naval Ravikant Content**: Curated passages and clips on business and life philosophy

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/f90ebc5a-aff3-4118-b95e-79bf883b7f24) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
