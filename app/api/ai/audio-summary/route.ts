import { NextRequest, NextResponse } from 'next/server';

const DEFAULT_VOICE = process.env.OPENAI_TTS_VOICE || 'alloy';

export async function POST(request: NextRequest) {
  try {
    const { text }: { text?: string } = await request.json();

    if (!text || !text.trim()) {
      return NextResponse.json({ error: 'Summary text is required' }, { status: 400 });
    }

    if (text.length > 600) {
      return NextResponse.json({ error: 'Summary text is too long. Please keep it under 600 characters.' }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.warn('OPENAI_API_KEY is not configured');
      return NextResponse.json({ error: 'OpenAI API key is not configured on the server.' }, { status: 500 });
    }

    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini-tts',
        voice: DEFAULT_VOICE,
        input: text,
        format: 'mp3',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.error('OpenAI TTS error', response.status, errorText);
      return NextResponse.json({ error: 'Failed to generate audio summary.' }, { status: 500 });
    }

    const audioBuffer = await response.arrayBuffer();

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Audio summary route error:', error);
    return NextResponse.json({ error: 'Unexpected error while generating audio summary.' }, { status: 500 });
  }
}
