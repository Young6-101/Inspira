import { fetchAuthSession } from "aws-amplify/auth";

export async function callApi(endpoint: string, body: any) {
    const session = await fetchAuthSession();
    const token = session.tokens?.idToken?.toString();

    return fetch(`${import.meta.env.VITE_API_URL}${endpoint}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
    });
}
