import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export const updateArticleStatus = async (
  articleId: string,
  updates: { isDeleted?: boolean; isBlockedByAdmin?: boolean }
) => {
  try {
    const articleRef = doc(db, 'articles', articleId);
    await updateDoc(articleRef, updates);
  } catch (error) {
    console.error("Error updating article status:", error);
    throw error;
  }
};
