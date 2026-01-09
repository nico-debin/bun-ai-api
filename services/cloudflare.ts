import type { AIService, ChatMessage } from '../types';

export const cloudflareService: AIService = {
    name: 'Cloudflare',
    async chat(messages: ChatMessage[]) {
        const response = await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/ai/run/@cf/meta/llama-3.1-8b-instruct`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.CF_API_TOKEN}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ messages, stream: true }),
            }
        );

        return (async function* () {
            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            while (reader) {
                const { done, value } = await reader.read();
                if (done) break;
                const text = decoder.decode(value);
                const lines = text.split('\n').filter(l => l.startsWith('data: '));
                for (const line of lines) {
                    try {
                        const data = JSON.parse(line.slice(6));
                        yield data.response || '';
                    } catch {
                        // Skip malformed JSON
                    }
                }
            }
        })();
    }
};
