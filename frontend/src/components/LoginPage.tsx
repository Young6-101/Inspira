import { Authenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";

const formFields = {
    signUp: {
        nickname: {
            order: 1,
            placeholder: 'Enter your Nickname',
            label: 'Nickname',
            isRequired: true,
        },
        email: { order: 2 },
        password: { order: 3 },
        confirm_password: { order: 4 },
    },
};

export function LoginPage({ children }: { children: React.ReactNode }) {

    return (
        <div className="min-h-screen bg-[#f3eced] flex items-center justify-center p-4">
            <Authenticator formFields={formFields}>
                {({ signOut, user }) => (
                    <div className="w-full h-full relative">
                        <header className="fixed top-4 right-6 z-50 flex items-center gap-4 bg-white/80 backdrop-blur-md px-4 py-2 rounded-full shadow-sm border border-white/20">
                            <span className="text-sm font-medium text-gray-600">
                                Hi, <span className="text-[#0a86ce]">{user?.signInDetails?.loginId}</span>
                            </span>
                            <button
                                onClick={signOut}
                                className="text-xs bg-gray-900 text-white px-3 py-1.5 rounded-full hover:bg-gray-800 transition-colors"
                            >
                                Sign Out
                            </button>
                        </header>
                        {children}
                    </div>
                )}
            </Authenticator>
        </div>
    );
}
