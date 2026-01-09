import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AIService, ChatMessage } from '../types';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const geminiService: AIService = {
    name: 'Gemini',
    async chat(messages: ChatMessage[]) {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const history = messages.slice(0, -1).map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user' as const,
            parts: [{ text: m.content }],
        }));

        const chat = model.startChat({ history });
        const lastMessage = messages[messages.length - 1].content;
        const result = await chat.sendMessageStream(lastMessage);

        return (async function* () {
            for await (const chunk of result.stream) {
                yield chunk.text();
            }
        })();
    }
};
