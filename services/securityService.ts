import { db } from './firebaseClient';
import { doc, getDoc } from 'firebase/firestore';

export const isEmailAllowed = async (email?: string | null): Promise<boolean> => {
  if (!email) return false;
  // 暫定案B: トークンの email と完全一致する ID を使用（lower-case しない）
  const ref = doc(db, 'allowlist', email);
  const snap = await getDoc(ref);
  return snap.exists();
};


