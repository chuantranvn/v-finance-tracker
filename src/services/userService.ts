import { collection, doc, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { UserData } from '../types';

export const fetchAllUsers = async (): Promise<UserData[]> => {
  const usersRef = collection(db, 'users');
  const snapshot = await getDocs(usersRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserData));
};

export const updateUserRole = async (userId: string, role: string) => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, { role });
};
