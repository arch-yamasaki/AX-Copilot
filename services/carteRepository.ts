import { db } from './firebaseClient';
import { collection, addDoc, getDocs, query, where, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { Carte } from '../types';

export const listCartes = async (uid: string): Promise<Carte[]> => {
  const ref = collection(db, 'users', uid, 'cartes');
  const snap = await getDocs(ref);
  return snap.docs.map(d => d.data() as Carte);
};

export const addCarte = async (uid: string, carte: Carte): Promise<void> => {
  const ref = collection(db, 'users', uid, 'cartes');
  await addDoc(ref, { ...carte, ownerId: uid, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
};

export const deleteAllCartes = async (uid: string): Promise<void> => {
  const ref = collection(db, 'users', uid, 'cartes');
  const snap = await getDocs(ref);
  const deletions = snap.docs.map(d => deleteDoc(doc(db, 'users', uid, 'cartes', d.id)));
  await Promise.all(deletions);
};


