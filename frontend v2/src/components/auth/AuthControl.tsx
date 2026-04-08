import { useEffect, useRef, useState } from 'react';
import type { AuthCredentials, AuthUser, SignUpPayload } from '../../types/auth';
import UserAvatarButton from './UserAvatarButton';
import AuthMenu from './AuthMenu';
import AuthModal from './AuthModal';

type AuthMode = 'signin' | 'signup' | null;

type AuthControlProps = {
  user: AuthUser | null;
  avatarLabel: string;
  onSignIn: (payload: AuthCredentials) => Promise<void> | void;
  onSignUp: (payload: SignUpPayload) => Promise<void> | void;
  onProfile: () => void;
  onSignOut: () => Promise<void> | void;
};

export default function AuthControl({ user, avatarLabel, onSignIn, onSignUp, onProfile, onSignOut }: AuthControlProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mode, setMode] = useState<AuthMode>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDocClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!rootRef.current?.contains(target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  return (
    <div className="relative" ref={rootRef}>
      <UserAvatarButton label={avatarLabel} onClick={() => setMenuOpen((v) => !v)} />

      <AuthMenu
        user={user}
        isOpen={menuOpen}
        onSignInClick={() => {
          setErrorMessage('');
          setMode('signin');
          setMenuOpen(false);
        }}
        onSignUpClick={() => {
          setErrorMessage('');
          setMode('signup');
          setMenuOpen(false);
        }}
        onProfileClick={() => {
          setMenuOpen(false);
          onProfile();
        }}
        onSignOutClick={async () => {
          await onSignOut();
          setMenuOpen(false);
        }}
      />

      <AuthModal
        mode={mode}
        onClose={() => {
          setMode(null);
          setErrorMessage('');
        }}
        onSignIn={async (payload) => {
          try {
            setErrorMessage('');
            await onSignIn(payload);
            setMode(null);
          } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Failed to log in');
          }
        }}
        onSignUp={async (payload) => {
          try {
            setErrorMessage('');
            await onSignUp(payload);
            setMode(null);
          } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Failed to sign up');
          }
        }}
        errorMessage={errorMessage}
      />
    </div>
  );
}
