import Mistral from '@mistralai/mistralai';
import type { AIService, ChatMessage } from '../types';

const mistral = new Mistral();

export const mistralService: AIService = {
    name: 'Mistral',
    async chat(messages: ChatMessage[]) {
        const stream = await mistral.chat.stream({
            model: 'mistral-small-latest',
            messages,
        });

        return (async function* () {
            for await (const event of stream) {
                yield event.data.choices[0]?.delta?.content || '';
            }
        })();
    }
};
