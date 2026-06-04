import { collection, doc, getDocs, updateDoc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { getFirebaseDB, handleFirestoreError, OperationType } from '@/lib/firebase';
import { UserData } from '../types';

export const fetchAllUsers = async (): Promise<UserData[]> => {
  const db = getFirebaseDB();
  if (!db) throw new Error("Firebase DB not initialized");
  try {
    const usersRef = collection(db, 'users');
    const adminsRef = collection(db, 'admins');
    const [usersSnapshot, adminsSnapshot] = await Promise.all([
      getDocs(usersRef),
      getDocs(adminsRef)
    ]);
    const usersMap = new Map<string, UserData>();
    usersSnapshot.docs.forEach(doc => usersMap.set(doc.id, { id: doc.id, ...doc.data() } as UserData));
    adminsSnapshot.docs.forEach(doc => {
      const user = usersMap.get(doc.id);
      if (user) {
        usersMap.set(doc.id, { ...user, role: doc.data().role });
      }
    });
    return Array.from(usersMap.values());
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
    const adminRef = doc(db, 'admins', userId);

    await updateDoc(userRef, { role });

    if (role === 'admin' || role === 'superadmin') {
      await setDoc(adminRef, { role });
    } else {
      await deleteDoc(adminRef);
    }
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
