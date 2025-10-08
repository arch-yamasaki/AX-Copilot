import { auth } from './firebaseClient';
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink, setPersistence, browserLocalPersistence } from 'firebase/auth';

// ドメイン許可のクライアント側検査は撤廃（allowlist に一本化）

export const signInWithGoogle = async (): Promise<User> => {
  const provider = new GoogleAuthProvider();
  const cred = await signInWithPopup(auth, provider);
  return cred.user;
};

export const signOutApp = () => signOut(auth);

export const observeAuth = (cb: (user: User | null) => void) => onAuthStateChanged(auth, cb);

// init: 認証の永続化を localStorage 相当に設定
export const initAuthPersistence = async (): Promise<void> => {
  await setPersistence(auth, browserLocalPersistence);
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


