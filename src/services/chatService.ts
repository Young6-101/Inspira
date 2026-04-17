/**
 * Service to handle streaming chat locally.
 * Implements typewriter effect by yielding tokens without calling backend.
 */

export type ChatStreamPayload = {
    question: string;
    stack_id: string;
    mode?: string;
    model?: string;
    user_id?: string;
    session_id?: string;
};

export async function* streamChat(payload: ChatStreamPayload): AsyncGenerator<string> {
    const mockAnswer = "This is a purely frontend showcase mode without backend API calls. If you want actual reasoning, you need to connect the real backend architecture.";
    const chars = mockAnswer.split('');

    for (const char of chars) {
        // Mock typewriter delay
        await new Promise(res => setTimeout(res, 50));
        yield char;
    }
}

export async function chatOnce(payload: ChatStreamPayload): Promise<string> {
    return "This is a mock response. Not connected to real backend.";
}
