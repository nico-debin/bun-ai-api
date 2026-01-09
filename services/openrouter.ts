import OpenAI from 'openai';
import type { AIService, ChatMessage } from '../types';

let client: OpenAI | null = null;

function getClient() {
    if (!client) {
        client = new OpenAI({
            baseURL: 'https://openrouter.ai/api/v1',
            apiKey: process.env.OPENROUTER_API_KEY,
        });
    }
    return client;
}

export const openrouterService: AIService = {
    name: 'OpenRouter',
    async chat(messages: ChatMessage[]) {
        const stream = await getClient().chat.completions.create({
            model: 'meta-llama/llama-3.3-70b-instruct:free',
            messages,
            stream: true,
        });

        return (async function* () {
            for await (const chunk of stream) {
                yield chunk.choices[0]?.delta?.content || '';
            }
        })();
    }
};
