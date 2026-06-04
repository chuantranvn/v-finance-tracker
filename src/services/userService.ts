import { collection, doc, getDocs, updateDoc, getDoc } from 'firebase/firestore';
import { getFirebaseDB, handleFirestoreError, OperationType } from '@/lib/firebase';
import { UserData } from '../types';

export const fetchAllUsers = async (): Promise<UserData[]> => {
  const db = getFirebaseDB();
  if (!db) throw new Error("Firebase DB not initialized");
  try {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserData));
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'users');
    throw error;
  }
};

export const updateUserRole = async (userId: string, role: string) => {
  const db = getFirebaseDB();
  if (!db) throw new Error("Firebase DB not initialized");
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { role });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    throw error;
  }
};

export const checkIsAdmin = async (userId: string): Promise<boolean> => {
  const db = getFirebaseDB();
  if (!db) return false;
  try {
    const adminDoc = await getDoc(doc(db, 'admins', userId));
    return adminDoc.exists();
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
};
