import SignInForm from './SignInForm';
import SignUpForm from './SignUpForm';
import type { AuthCredentials, SignUpPayload } from '../../types/auth';

type AuthMode = 'signin' | 'signup' | null;

type AuthModalProps = {
  mode: AuthMode;
  onClose: () => void;
  onSignIn: (payload: AuthCredentials) => Promise<void> | void;
  onSignUp: (payload: SignUpPayload) => Promise<void> | void;
  errorMessage?: string;
};

export default function AuthModal({ mode, onClose, onSignIn, onSignUp, errorMessage }: AuthModalProps) {
  if (!mode) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/30" onClick={onClose}>
      <div className="w-full max-w-md border-2 border-textBlack bg-white shadow-[10px_10px_0px_#111] p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-4xl uppercase leading-none">{mode === 'signin' ? 'Log In' : 'Sign Up'}</h2>
          <button onClick={onClose} className="w-8 h-8 border border-textBlack text-xs font-bold hover:bg-accentCoral">X</button>
        </div>
        {errorMessage ? (
          <div className="mb-3 border border-accentCoral bg-accentCoral/10 px-3 py-2 text-xs font-bold tracking-wide uppercase">
            {errorMessage}
          </div>
        ) : null}
        {mode === 'signin' ? <SignInForm onSubmit={onSignIn} /> : <SignUpForm onSubmit={onSignUp} />}
      </div>
    </div>
  );
}
