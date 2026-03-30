export const awsConfig = {
    Auth: {
        Cognito: {
            userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || "ap-southeast-1_0dPRVoFPH",
            userPoolClientId: import.meta.env.VITE_COGNITO_CLIENT_ID || "2e1tso1aef5oh47js88tf038ad",
            loginWith: {
                email: true,
            },
        },
    },
};
