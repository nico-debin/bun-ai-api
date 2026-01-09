import OpenAI from 'openai';
import type { AIService, ChatMessage } from '../types';

let client: OpenAI | null = null;

function getClient() {
    if (!client) {
        client = new OpenAI({
            baseURL: 'https://api.sambanova.ai/v1',
            apiKey: process.env.SAMBANOVA_API_KEY,
        });
    }
    return client;
}

export const sambanovaService: AIService = {
    name: 'SambaNova',
    async chat(messages: ChatMessage[]) {
        const stream = await getClient().chat.completions.create({
            model: 'Meta-Llama-3.1-70B-Instruct',
            messages,
            stream: true,
            temperature: 0.6,
        });

        return (async function* () {
            for await (const chunk of stream) {
                yield chunk.choices[0]?.delta?.content || '';
            }
        })();
    }
};
