import { useEffect, useMemo, useState } from 'react';
import type { AuthCredentials, AuthUser, SignUpPayload } from '../types/auth';
import {
  getAuthenticatedUser,
  logInWithCognito,
  logOutFromCognito,
  signUpWithCognito
} from '../services/authService';

export default function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void refreshCurrentUser();
  }, []);

  const refreshCurrentUser = async () => {
    const nextUser = await getAuthenticatedUser();
    setUser(nextUser);
  };

  const signUp = async (payload: SignUpPayload) => {
    setLoading(true);
    try {
      await signUpWithCognito(payload);
      await logInWithCognito({ email: payload.email, password: payload.password });
      await refreshCurrentUser();
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (payload: AuthCredentials) => {
    setLoading(true);
    try {
      await logInWithCognito(payload);
      await refreshCurrentUser();
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await logOutFromCognito();
    } finally {
      setLoading(false);
    }
    setUser(null);
  };

  const userInitial = useMemo(() => (user?.nickname?.charAt(0) || 'S').toUpperCase(), [user]);

  return {
    user,
    loading,
    userInitial,
    isSignedIn: Boolean(user),
    refreshCurrentUser,
    signIn,
    signUp,
    signOut
  };
}
