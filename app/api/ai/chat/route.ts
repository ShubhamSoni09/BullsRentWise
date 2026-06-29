import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export async function POST(request: NextRequest) {
  try {
    const { message, context } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // If no API key, return helpful fallback
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        response: 'I can help answer questions about rental properties, but AI features require an OpenAI API key. Please check the risk score, complaints, and crime data for this address.',
        requiresApiKey: true,
      });
    }

    try {
      const systemPrompt = `You are a helpful assistant for renters evaluating properties in the United States. 
You help them understand:
- Risk scores and what they mean
- 311 complaints and their implications
- Crime data and safety concerns
- Weather-related risks (mold, water damage)
- What to look for when viewing properties
- Red flags to watch out for

Be friendly, helpful, and specific. If you don't know something, say so.

Current context: ${context ? JSON.stringify(context) : 'No specific property context'}`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message },
        ],
        temperature: 0.7,
        max_tokens: 300,
      });

      const response = completion.choices[0]?.message?.content || 'I apologize, but I could not generate a response.';

      return NextResponse.json({
        response,
        requiresApiKey: false,
      });
    } catch (aiError: any) {
      console.error('OpenAI API error:', aiError);
      return NextResponse.json({
        response: 'I encountered an error. Please try again or check the property details manually.',
        requiresApiKey: false,
        error: true,
      });
    }
  } catch (error: any) {
    console.error('Chat error:', error);
    return NextResponse.json({ error: 'Failed to process chat message' }, { status: 500 });
  }
}

