import { groqService } from './services/groq';
import { cerebrasService } from './services/cerebras';
import { mistralService } from './services/mistral';
import { openrouterService } from './services/openrouter';
import { sambanovaService } from './services/sambanova';
import { geminiService } from './services/gemini';
import { cloudflareService } from './services/cloudflare';
import type { AIService, ChatMessage } from './types';

const services: AIService[] = [
    process.env.GROQ_API_KEY && groqService,
    process.env.CEREBRAS_API_KEY && cerebrasService,
    process.env.MISTRAL_API_KEY && mistralService,
    process.env.OPENROUTER_API_KEY && openrouterService,
    process.env.SAMBANOVA_API_KEY && sambanovaService,
    process.env.GEMINI_API_KEY && geminiService,
    (process.env.CF_ACCOUNT_ID && process.env.CF_API_TOKEN) && cloudflareService,
].filter(Boolean) as AIService[];

console.log(`Servicios activos: ${services.map(s => s.name).join(', ')}`);
let currentServiceIndex = 0;

function getNextService() {
    const service = services[currentServiceIndex];
    currentServiceIndex = (currentServiceIndex + 1) % services.length;
    return service;
}

const server = Bun.serve({
  port: process.env.PORT || 3000,
  async fetch(req) {
    const { pathname } = new URL(req.url);

    if (req.method === 'POST' && pathname === '/chat') {
        const { messages, stream = true } = await req.json() as { messages: ChatMessage[], stream?: boolean };
        const service = getNextService();

        console.log(`Using service: ${service?.name}`);
        const responseStream = await service?.chat(messages);

        if (stream) {
            return new Response(responseStream, {
                headers: {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive',
                },
            });
        }

        // Non-streaming: accumulate all chunks and return JSON
        let content = '';
        for await (const chunk of responseStream!) {
            content += chunk;
        }

        return new Response(JSON.stringify({ content }), {
            headers: {
                'Content-Type': 'application/json',
            },
        });
      }
    return new Response("Not found", { status: 404 });
  },
});

console.log(`Server is running on ${server.url}`);