import { auth } from './firebaseClient';
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';

const ALLOWED_DOMAIN = (import.meta as any).env.VITE_ALLOWED_DOMAIN || 'example.com';

export const signInWithGoogle = async (): Promise<User> => {
  const provider = new GoogleAuthProvider();
  const cred = await signInWithPopup(auth, provider);
  const email = cred.user.email || '';
  if (!email.endsWith(`@${ALLOWED_DOMAIN}`)) {
    await signOut(auth);
    throw new Error('許可されていないドメインです');
  }
  return cred.user;
};

export const signOutApp = () => signOut(auth);

export const observeAuth = (cb: (user: User | null) => void) => onAuthStateChanged(auth, cb);

export const isAllowedEmail = (email?: string | null): boolean => {
  if (!email) return false;
  return email.endsWith(`@${ALLOWED_DOMAIN}`);
};


