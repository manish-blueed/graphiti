import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { ollama } from 'ollama-ai-provider';
import { mcpTools } from '@/lib/tools';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  console.log('POST /api/chat hit');
  try {
    const body = await req.json();
    const messages = body.messages || body;
    const groupId = body.groupId || 'default';

    // Model configuration from backend environment
    const provider = process.env.AI_PROVIDER || 'openai';
    const modelName = process.env.AI_MODEL || 'gpt-4o';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let model: any;
    if (provider === 'anthropic') {
      model = anthropic(modelName);
    } else if (provider === 'ollama') {
      model = ollama(modelName);
    } else {
      // Default: OpenAI-compatible API (OpenAI, vLLM, etc.)
      const openai = createOpenAI({
        baseURL: process.env.OPENAI_BASE_URL,
        apiKey: process.env.OPENAI_API_KEY,
      });
      model = openai(modelName);
    }

    const result = streamText({
      model,
      messages,
      tools: mcpTools,
      system: `You are a helpful AI assistant with access to a Graphiti-powered knowledge graph.
Current Group ID (partition): ${groupId}

Your goal is to help users manage and retrieve information from their knowledge base.
- When asked a question, use 'searchNodes' or 'searchFacts' to find relevant context.
- When the user provides new important information, use 'addMemory' to store it.
- If the user asks for history or snippets, use 'getEpisodes'.
- Synthesize the information found in the graph to provide comprehensive and accurate answers.
- If you can't find information in the graph, inform the user and suggest they might want to add it.`,
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('Chat API Error:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
