import { fetchAuthSession } from "aws-amplify/auth";

const DEFAULT_API_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "");
const SHOULD_SKIP_AUTH = import.meta.env.VITE_SKIP_AUTH === "true";

function buildApiUrl(endpoint: string) {
    const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    return `${DEFAULT_API_URL}${normalizedEndpoint}`;
}

async function buildAuthHeaders(): Promise<Record<string, string>> {
    if (SHOULD_SKIP_AUTH) {
        return {};
    }

    const session = await fetchAuthSession();
    const token = session.tokens?.idToken?.toString() ?? session.tokens?.accessToken?.toString();
    return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function callApi(endpoint: string, body: unknown) {
    const authHeaders = await buildAuthHeaders();

    return fetch(buildApiUrl(endpoint), {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...authHeaders,
        },
        body: JSON.stringify(body),
    });
}

export async function uploadApi(endpoint: string, body: FormData) {
    const authHeaders = await buildAuthHeaders();

    return fetch(buildApiUrl(endpoint), {
        method: "POST",
        headers: authHeaders,
        body,
    });
}
