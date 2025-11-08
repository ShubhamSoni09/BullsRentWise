import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export async function POST(request: NextRequest) {
  try {
    const { complaintText, complaintType } = await request.json();

    if (!complaintText) {
      return NextResponse.json({ error: 'Complaint text is required' }, { status: 400 });
    }

    // If no API key, return basic analysis
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        severity: 'medium',
        urgency: 'medium',
        keyIssues: [],
        sentiment: 'neutral',
        summary: 'AI analysis requires OpenAI API key',
      });
    }

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are an expert at analyzing rental property complaints. Analyze the complaint and return a JSON object with:
- severity: "low", "medium", "high", or "critical"
- urgency: "low", "medium", "high", or "urgent"
- keyIssues: array of main issues mentioned
- sentiment: "positive", "neutral", "negative", or "frustrated"
- summary: brief summary of the complaint
- estimatedImpact: "minor", "moderate", "significant", or "severe"`,
          },
          {
            role: 'user',
            content: `Analyze this rental complaint: "${complaintText}"\n\nType: ${complaintType || 'Unknown'}\n\nReturn only valid JSON.`,
          },
        ],
        temperature: 0.3,
        max_tokens: 200,
      });

      const responseText = completion.choices[0]?.message?.content || '{}';
      const analysis = JSON.parse(responseText);

      return NextResponse.json({
        severity: analysis.severity || 'medium',
        urgency: analysis.urgency || 'medium',
        keyIssues: analysis.keyIssues || [],
        sentiment: analysis.sentiment || 'neutral',
        summary: analysis.summary || complaintText.substring(0, 100),
        estimatedImpact: analysis.estimatedImpact || 'moderate',
      });
    } catch (aiError: any) {
      console.error('OpenAI API error:', aiError);
      // Fallback to basic analysis
      return NextResponse.json({
        severity: 'medium',
        urgency: 'medium',
        keyIssues: [],
        sentiment: 'neutral',
        summary: complaintText.substring(0, 100),
        estimatedImpact: 'moderate',
      });
    }
  } catch (error: any) {
    console.error('Analysis error:', error);
    return NextResponse.json({ error: 'Failed to analyze complaint' }, { status: 500 });
  }
}

