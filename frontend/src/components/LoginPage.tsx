import { Authenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";

export function LoginPage({ children }: { children: React.ReactNode }) {
    return (
        <Authenticator>
            {({ signOut, user }) => (
                <div>
                    <header>
                        <span>Welcome, {user?.signInDetails?.loginId}</span>
                        <button onClick={signOut}>Sign Out</button>
                    </header>
                    {children}
                </div>
            )}
        </Authenticator>
    );
}
