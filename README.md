# 🚀 Venture Scout Bot

> **An AI-powered startup validation platform that helps entrepreneurs validate ideas, research markets, and build business models using the wisdom of Paul Graham and Naval Ravikant.**

[![React](https://img.shields.io/badge/React-18.3.1-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5.3-blue)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4.1-purple)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.11-cyan)](https://tailwindcss.com/)

## 📋 Overview

Venture Scout Bot is a comprehensive startup validation platform that combines AI-powered chat interface, market research capabilities, and business model generation. It features a curated knowledge base from startup experts Paul Graham (229 essays) and Naval Ravikant (412 pieces), plus access to Y Combinator's startup directory.

**✨ Now OpenAI-Free!** The knowledge base uses intelligent keyword-based search, making it completely independent of external AI services while maintaining excellent search accuracy.

## ✨ Key Features

### 🤖 **AI Chat Interface**
- Interactive chat powered by Paul Graham essays and Naval Ravikant content
- **Smart keyword search** through 229 startup essays and 412 Naval pieces
- Real-time startup advice and validation
- Context-aware responses based on expert knowledge

### 📊 **Market Validation Dashboard**
- **Real-time market intelligence** with validation scores (0-100)
- **Interactive visualizations** including market trends and competitor analysis
- **AI-powered insights** with opportunities, challenges, and next steps
- **Sentiment analysis** from news and social media sources
- Market size (TAM) calculations and growth rate analysis

### 🏢 **Y Combinator Startup Directory**
- Browse and search through **all Y Combinator companies**
- Filter by industry, batch, and company size
- View company details, websites, and funding information
- Discover top companies and trending startups

### 📝 **Business Model Canvas Generator**
- **AI-generated business model canvases** based on your startup idea
- Complete 9-block canvas with executive summary
- **PDF export functionality** for presentations and planning
- Research-backed recommendations with source citations

### 🔍 **Intelligent Knowledge Base**
- **229 Paul Graham essays** on startups and entrepreneurship
- **412 Naval Ravikant passages and clips** on business philosophy
- **Advanced keyword search** with fuzzy matching and relevance scoring
- Context-aware suggestions after idea validation
- **No external API dependencies** for knowledge base functionality

## 🛠 Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: TanStack React Query
- **Routing**: React Router DOM
- **Knowledge Search**: Advanced keyword matching with topic analysis
- **Data Visualization**: Recharts
- **PDF Generation**: jsPDF

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm (install with [nvm](https://github.com/nvm-sh/nvm))
- Perplexity API key (for market validation only)

### Installation

```bash
# Clone the repository
git clone <your-git-url>
cd venture-scout-bot

# Install dependencies
npm install

# Generate knowledge base (no API key needed!)
npm run generate-embeddings-no-openai

# Start development server
npm run dev
```

### Environment Setup

Create a `.env.local` file with the following API key:

```bash
# Required for market validation and AI analysis
VITE_PERPLEXITY_API_KEY=your_perplexity_api_key_here
```

#### Getting API Keys

1. **Perplexity API** (for market validation):
   - Visit [Perplexity API Settings](https://www.perplexity.ai/settings/api)
   - Create account and generate API key (starts with `pplx-`)

**Note**: OpenAI API is no longer required! The knowledge base now uses intelligent keyword search.

## 📁 Project Structure

```
src/
├── components/           # Reusable UI components
├── pages/               # Main application pages
│   ├── Index.tsx        # Landing page with animated intro
│   ├── Chat.tsx         # AI chat interface
│   ├── Startups.tsx     # YC startup directory
│   ├── MarketResearch.tsx    # Market validation dashboard
│   └── BusinessModelCanvas.tsx    # Business model generator
├── lib/                 # Utilities and API services
├── hooks/               # Custom React hooks
└── knowledge/           # Paul Graham essays and Naval content
```

## 🎯 Usage Guide

### 1. **Startup Idea Validation**
1. Enter your startup idea in the chat interface
2. Get instant AI-powered feedback based on expert knowledge
3. Access market validation dashboard for comprehensive analysis
4. Generate business model canvas for strategic planning

### 2. **Market Research**
1. Navigate to Market Research from chat results
2. View validation scores, market size, and growth rates
3. Analyze competitor landscape and market sentiment
4. Review AI-generated opportunities and challenges

### 3. **Startup Discovery**
1. Browse Y Combinator startup directory
2. Filter by industry, batch year, or company characteristics
3. Research successful companies in your space
4. Identify market trends and validation patterns

### 4. **Knowledge Base Search**
1. Ask specific questions about startups and entrepreneurship
2. Get contextual advice from Paul Graham and Naval Ravikant
3. Explore essays and insights relevant to your situation
4. Build on proven startup methodologies

## 🔧 Available Scripts

```bash
npm run dev                        # Start development server
npm run build                      # Build for production
npm run preview                    # Preview production build
npm run lint                       # Run ESLint
npm run generate-embeddings-no-openai  # Generate knowledge base (no API key needed)
npm run generate-embeddings-cohere     # Alternative: Generate with Cohere embeddings
```

## 🌟 Key Features Deep Dive

### Market Validation Dashboard
- **Validation Score**: 0-100 score based on market analysis
- **Market Metrics**: TAM, growth rate, risk assessment
- **Visual Charts**: Trends, segments, competitive landscape
- **AI Insights**: Opportunities, challenges, next steps

### Knowledge Base Features
- **Advanced Keyword Search**: Multi-factor relevance scoring
- **Topic Analysis**: Automatic categorization and matching
- **Contextual Suggestions**: Relevant advice after validation
- **Expert Content**: Curated from 229 essays and 412 passages
- **No API Dependencies**: Works completely offline for knowledge search

### Business Model Canvas
- **AI Generation**: Complete 9-block canvas creation
- **Research-Backed**: Citations and source references
- **PDF Export**: Professional presentation format
- **Executive Summary**: Comprehensive business overview

## 🔄 Fallback Behavior

- **Missing API Keys**: Knowledge base still works, market validation shows mock data
- **API Failures**: Graceful fallbacks with error handling
- **Offline Mode**: Full knowledge base functionality available
- **Rate Limits**: Smart request management and retries

## 🚀 Deployment

The application is configured for deployment on various platforms:

```bash
# Build for production
npm run build

# Deploy to your preferred platform
# (Vercel, Netlify, AWS, etc.)
```

## 📊 Knowledge Base Statistics

- **Paul Graham**: 229 essays, 957 searchable chunks
- **Naval Ravikant**: 412 pieces (196 passages + 216 clips)
- **Total Content**: 1,369 searchable items
- **Search Method**: Advanced keyword matching with topic analysis
- **File Size**: 4.45 MB (optimized for fast loading)

## 🙏 Acknowledgments

- **Paul Graham** - Essays and startup wisdom
- **Naval Ravikant** - Business philosophy and insights  
- **Y Combinator** - Startup data and inspiration
- **Perplexity** - Real-time market intelligence

---

**Built with ❤️ for entrepreneurs and startup enthusiasts**

*No OpenAI API required - completely self-contained knowledge base!*
