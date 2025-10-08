import { db } from './firebaseClient';
import { doc, getDoc } from 'firebase/firestore';

export const isEmailAllowed = async (email?: string | null): Promise<boolean> => {
  if (!email) return false;
  const id = email.toLowerCase();
  const ref = doc(db, 'allowlist', id);
  const snap = await getDoc(ref);
  return snap.exists();
};


