import {
  fetchUserAttributes,
  getCurrentUser,
  signIn as amplifySignIn,
  signOut as amplifySignOut,
  signUp as amplifySignUp
} from 'aws-amplify/auth';
import type { AuthCredentials, AuthUser, SignUpPayload } from '../types/auth';

export async function getAuthenticatedUser(): Promise<AuthUser | null> {
  try {
    const currentUser = await getCurrentUser();
    const attributes = await fetchUserAttributes();
    const email = attributes.email ?? '';
    const nickname = attributes.nickname ?? attributes.preferred_username ?? currentUser.username;
    return { nickname, email };
  } catch {
    return null;
  }
}

export async function logInWithCognito(payload: AuthCredentials): Promise<void> {
  await amplifySignIn({
    username: payload.email.trim().toLowerCase(),
    password: payload.password
  });
}

export async function signUpWithCognito(payload: SignUpPayload): Promise<void> {
  const result = await amplifySignUp({
    username: payload.email.trim().toLowerCase(),
    password: payload.password,
    options: {
      userAttributes: {
        email: payload.email.trim().toLowerCase(),
        nickname: payload.nickname.trim()
      }
    }
  });

  if (result.nextStep.signUpStep !== 'DONE') {
    throw new Error('Account created. Please verify your email before logging in.');
  }
}

export async function logOutFromCognito(): Promise<void> {
  await amplifySignOut();
}
