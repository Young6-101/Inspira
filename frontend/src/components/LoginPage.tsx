import { Authenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";

type LoginPageRenderProps = {
    userEmail?: string;
    signOut?: () => void;
};

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

export function LoginPage({ children }: { children: (props: LoginPageRenderProps) => React.ReactNode }) {

    return (
        <div className="min-h-screen bg-[#f3eced] flex items-center justify-center p-4">
            <Authenticator formFields={formFields}>
                {({ signOut, user }) => (
                    <div className="w-full h-full relative">
                        {children({
                            userEmail: user?.signInDetails?.loginId ?? user?.username,
                            signOut,
                        })}
                    </div>
                )}
            </Authenticator>
        </div>
    );
}
