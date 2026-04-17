import type { AuthCredentials, AuthUser, SignUpPayload } from '../types/auth';

export async function getAuthenticatedUser(): Promise<AuthUser | null> {
  // Mock constant logged in state
  return { nickname: 'DemoUser', email: 'demo@example.com' };
}

export async function logInWithCognito(payload: AuthCredentials): Promise<void> {
  // Mock login delay
  await new Promise(res => setTimeout(res, 500));
}

export async function signUpWithCognito(payload: SignUpPayload): Promise<void> {
  // Mock signup delay
  await new Promise(res => setTimeout(res, 500));
}

export async function logOutFromCognito(): Promise<void> {
  // Mock logout
  return;
}
