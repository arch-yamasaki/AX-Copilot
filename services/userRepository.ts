import { db } from './firebaseClient';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import type { UserProfile } from '../types';

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data() as UserProfile;
};

export const setUserProfile = async (uid: string, profile: Omit<UserProfile, 'createdAt' | 'updatedAt'>): Promise<void> => {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  const existing = snap.exists() ? (snap.data() as Partial<UserProfile>) : undefined;
  await setDoc(
    ref,
    {
      ...profile,
      createdAt: existing?.createdAt || serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
};


