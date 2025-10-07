import { auth } from './firebaseClient';
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';

const RAW_ALLOWED = (import.meta as any).env.VITE_ALLOWED_EMAIL_DOMAINS || (import.meta as any).env.VITE_ALLOWED_DOMAIN || 'example.com';
const ALLOWED_DOMAINS: string[] = String(RAW_ALLOWED)
  .split(',')
  .map((d: string) => d.trim().toLowerCase())
  .filter((d: string) => d.length > 0);

export const signInWithGoogle = async (): Promise<User> => {
  const provider = new GoogleAuthProvider();
  const cred = await signInWithPopup(auth, provider);
  const email = cred.user.email || '';
  if (!isAllowedEmail(email)) {
    await signOut(auth);
    throw new Error('許可されていないドメインです');
  }
  return cred.user;
};

export const signOutApp = () => signOut(auth);

export const observeAuth = (cb: (user: User | null) => void) => onAuthStateChanged(auth, cb);

export const isAllowedEmail = (email?: string | null): boolean => {
  if (!email) return false;
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;
  return ALLOWED_DOMAINS.includes(domain);
};


