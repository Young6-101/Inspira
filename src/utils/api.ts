export async function callApi(endpoint: string, body: any) {
    console.log(`Mocking API Call to: ${endpoint}`, body);

    // Return a dummy successful fetch response
    return {
        ok: true,
        json: async () => ({ success: true, dummy: "data" })
    } as any;
}
