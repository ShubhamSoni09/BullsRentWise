# 🤖 AI/ML Features Setup Guide

## Overview

BullsRentWise now includes powerful AI/ML features:
1. **AI Complaint Analysis** - NLP-powered analysis of complaint descriptions
2. **ML Risk Prediction** - Predicts future risk based on patterns
3. **AI Chatbot** - Answers questions about properties and risks

## Setup Instructions

### 1. Get OpenAI API Key (Optional but Recommended)

1. **Sign up for OpenAI:**
   - Go to https://platform.openai.com/signup
   - Create an account

2. **Get API Key:**
   - Go to https://platform.openai.com/api-keys
   - Click "Create new secret key"
   - Copy the key (starts with `sk-`)

3. **Add to `.env.local`:**
   ```env
   OPENAI_API_KEY=sk-your-key-here
   ```

### 2. Cost Considerations

- **GPT-3.5-turbo**: ~$0.002 per 1K tokens (very affordable)
- **Estimated cost**: $5-10/month for moderate usage
- **Free tier**: OpenAI offers $5 free credit for new accounts
- **Alternative**: Use Hugging Face (free) for some features

### 3. Features Work Without API Key

All AI features have **graceful fallbacks**:
- If no API key: Features show helpful messages
- Basic analysis still works
- App remains fully functional

## Features Breakdown

### 1. AI Complaint Analysis (`/api/ai/analyze-complaint`)

**What it does:**
- Analyzes complaint text using NLP
- Extracts severity, urgency, sentiment
- Identifies key issues
- Provides summary

**Usage:**
- Click "🤖 Analyze" button on any complaint
- See AI-powered insights

**Tech:**
- OpenAI GPT-3.5-turbo
- JSON mode for structured output

### 2. ML Risk Prediction (`/api/ai/predict-risk`)

**What it does:**
- Predicts risk in next 30/90 days
- Seasonal risk analysis
- Trend prediction (improving/worsening)
- Identifies key risk factors

**Usage:**
- Automatically shown in results
- No API key needed (uses statistical models)

**Tech:**
- Statistical ML models
- Pattern recognition
- Time series analysis

### 3. AI Chatbot (`/api/ai/chat`)

**What it does:**
- Answers questions about properties
- Explains risk scores
- Provides rental advice
- Context-aware responses

**Usage:**
- Type questions in chatbot
- Get instant AI-powered answers

**Tech:**
- OpenAI GPT-3.5-turbo
- Context-aware prompts
- Property-specific responses

## Component Structure

```
components/
├── AIChatbot.tsx              # Chat interface
├── AIRiskPrediction.tsx       # ML predictions display
└── AIComplaintAnalysis.tsx    # Complaint analysis UI

app/api/ai/
├── analyze-complaint/route.ts # NLP analysis API
├── chat/route.ts              # Chatbot API
└── predict-risk/route.ts   # ML prediction API
```

## Testing Without API Key

1. **Run the app:**
   ```bash
   npm run dev
   ```

2. **Test features:**
   - AI Chatbot: Shows helpful fallback message
   - Complaint Analysis: Shows basic analysis
   - Risk Prediction: Works fully (no API needed)

3. **With API Key:**
   - All features work with full AI capabilities
   - Better analysis and responses

## Alternative: Hugging Face (Free)

If you want free AI features:

1. **Install:**
   ```bash
   npm install @huggingface/inference
   ```

2. **Use free models:**
   - Text classification
   - Sentiment analysis
   - Question answering

3. **Update API routes:**
   - Replace OpenAI calls with Hugging Face
   - No API key needed
   - Free tier available

## Demo Tips for Hackathon

1. **Show AI in Action:**
   - Click "Analyze" on a complaint
   - Ask chatbot a question
   - Show predictions

2. **Highlight Technical Depth:**
   - Explain NLP analysis
   - Show ML predictions
   - Demonstrate context awareness

3. **Fallback Strategy:**
   - If API key fails, show graceful degradation
   - Explain that features work without key
   - Show basic vs. AI-enhanced versions

## Cost Optimization

1. **Use GPT-3.5-turbo** (cheaper than GPT-4)
2. **Cache responses** (same complaints = cached)
3. **Limit token usage** (set max_tokens)
4. **Batch requests** when possible

## Troubleshooting

**"API key not found":**
- Check `.env.local` file exists
- Restart dev server after adding key
- Verify key starts with `sk-`

**"Rate limit exceeded":**
- OpenAI has rate limits on free tier
- Wait a few minutes
- Consider upgrading plan

**"Model not available":**
- GPT-3.5-turbo should always work
- Check OpenAI status page
- Try again later

## Next Steps

1. **Add API key** to `.env.local`
2. **Test all features**
3. **Customize prompts** for better responses
4. **Add more AI features** (image analysis, etc.)

## For Hackathon Judges

**Key Points to Highlight:**
- ✅ Real AI/ML integration (not just mockups)
- ✅ Graceful fallbacks (works without API key)
- ✅ Multiple AI features (NLP, ML, Chatbot)
- ✅ Context-aware responses
- ✅ Production-ready error handling

