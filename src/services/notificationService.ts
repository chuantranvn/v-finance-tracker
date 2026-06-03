import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface NotificationData {
  type: string;
  actorId: string;
  targetId: string;
  articleId?: string;
  message: string;
  read: boolean;
  createdAt: any;
}

export const sendNotification = async (
  type: string,
  actorId: string,
  targetId: string,
  message: string,
  articleId?: string
) => {
  try {
    await addDoc(collection(db, 'notifications'), {
      type,
      actorId,
      targetId,
      articleId,
      message,
      read: false,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error sending notification:", error);
    throw error;
  }
};
