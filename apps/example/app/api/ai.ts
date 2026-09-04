import { ai } from '@movejs/ai';

export async function POST(req: any) {
  try {
    const body = await req.json();
    const prompt = body.prompt;

    if (!prompt) {
      return Response.json({
        success: false,
        error: 'Prompt is required'
      }, { status: 400 });
    }

    // Use AI to generate content
    const result = await ai.generate({
      prompt,
      system: 'You are a helpful AI assistant.'
    });

    return Response.json({
      success: true,
      data: {
        response: result.text,
        model: result.model,
        usage: result.usage,
        latency: result.latency
      }
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: 'AI generation failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
