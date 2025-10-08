import { auth } from './firebaseClient';
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';

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

// Email/Password authentication (simple wrappers)
export const signUpWithEmail = async (email: string, password: string): Promise<User> => {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  return cred.user;
};

export const signInWithEmail = async (email: string, password: string): Promise<User> => {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
};

export const sendPasswordReset = async (email: string): Promise<void> => {
  await sendPasswordResetEmail(auth, email);
};

// Email link (passwordless) authentication
export const sendEmailLink = async (email: string): Promise<void> => {
  const actionCodeSettings = {
    url: window.location.origin + '/',
    handleCodeInApp: true,
  };
  await sendSignInLinkToEmail(auth, email, actionCodeSettings);
  window.localStorage.setItem('emailForSignIn', email);
};

export const isEmailLink = (url?: string): boolean => {
  return isSignInWithEmailLink(auth, url || window.location.href);
};

export const completeEmailLinkSignIn = async (emailArg?: string, url?: string): Promise<User> => {
  const email = emailArg || window.localStorage.getItem('emailForSignIn') || undefined;
  if (!email) throw new Error('emailForSignIn not found');
  const cred = await signInWithEmailLink(auth, email, url || window.location.href);
  window.localStorage.removeItem('emailForSignIn');
  return cred.user;
};


