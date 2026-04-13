/**
 * Service to handle streaming chat from the backend /chat/stream endpoint.
 * Implements typewriter effect by yielding tokens.
 */

export type ChatStreamPayload = {
    question: string;
    stack_id: string;
    mode?: string;
    model?: string;
    user_id?: string;
    session_id?: string;
};

function getApiBaseUrl(): string {
    const envApiUrl = (import.meta as any).env.VITE_API_URL;
    return envApiUrl || ((import.meta as any).env.DEV ? '/api' : 'http://127.0.0.1:8000');
}

export async function* streamChat(payload: ChatStreamPayload): AsyncGenerator<string> {
    const apiUrl = getApiBaseUrl();

    const response = await fetch(`${apiUrl}/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw new Error('Streaming failed');
    }

    const reader = response.body?.getReader();
    if (!reader) return;

    const decoder = new TextDecoder();

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value || new Uint8Array());

        // SSE format: data: {"token": "..."}
        const lines = chunk.split('\n');
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('{"token":')) {
                try {
                    // Backend sends raw JSON in our current main.py implementation
                    const data = JSON.parse(trimmed);
                    if (data.token) yield data.token;
                } catch (e) { }
            } else if (trimmed.startsWith('data: ')) {
                try {
                    const data = JSON.parse(trimmed.slice(6));
                    if (data.token) yield data.token;
                } catch (e) { }
            }
        }
    }
}

export async function chatOnce(payload: ChatStreamPayload): Promise<string> {
    const apiUrl = getApiBaseUrl();

    const response = await fetch(`${apiUrl}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw new Error(`Chat failed: ${response.status}`);
    }

    const data = await response.json();
    return (data?.answer || '').toString();
}
