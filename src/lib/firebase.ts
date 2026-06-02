"use client";

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore, doc, getDocFromServer, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

// Safely handle the config import
import config from '../../firebase-applet-config.json';

let appInstance: any = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;
let storageInstance: FirebaseStorage | null = null;

const getAppInstance = () => {
  if (typeof window === 'undefined') return null;
  if (!appInstance) {
    try {
      appInstance = getApps().length > 0 ? getApp() : initializeApp(config);
    } catch (e) {
      console.error("Firebase init error:", e);
    }
  }
  return appInstance;
};

export const getFirebaseAuth = () => {
  if (typeof window === 'undefined') return null;
  if (!authInstance) {
    const app = getAppInstance();
    if (app) {
      authInstance = getAuth(app);
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        authInstance.settings.appVerificationDisabledForTesting = true;
      }
    }
  }
  return authInstance;
};

export const getFirebaseDB = () => {
  if (typeof window === 'undefined') return null;
  if (!dbInstance) {
    const app = getAppInstance();
    if (app) {
      dbInstance = getFirestore(app, config.firestoreDatabaseId);
    }
  }
  return dbInstance;
};

export const getFirebaseStorage = () => {
  if (typeof window === 'undefined') return null;
  if (!storageInstance) {
    const app = getAppInstance();
    if (app) {
      storageInstance = getStorage(app, config.storageBucket);
    }
  }
  return storageInstance;
};

// Aliases for legacy code - safely handles server-side execution
// We cast these to satisfy TypeScript, but they will be null on server
export const auth = (typeof window !== 'undefined' ? getFirebaseAuth() : null) as unknown as Auth;
export const db = (typeof window !== 'undefined' ? getFirebaseDB() : null) as unknown as Firestore;
export const storage = (typeof window !== 'undefined' ? getFirebaseStorage() : null) as unknown as FirebaseStorage;

// Connectivity check - only on client
// Removed from top level to prevent build-time execution issues

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export type NotificationType = 'like' | 'comment' | 'share';

export interface NotificationData {
  id?: string;
  type: NotificationType;
  articleId: string;
  actorId: string;
  targetId: string;
  createdAt: any;
  read: boolean;
  commentId?: string;
}

export async function addNotification(
  db: Firestore,
  type: NotificationType,
  articleId: string,
  actorId: string,
  targetId: string,
  commentId?: string 
) {
  console.log("addNotification called:", { type, articleId, actorId, targetId, commentId });
  if (actorId === targetId) return; // Don't notify self
  if (!targetId) {
    console.warn("Notification not created: targetId is missing", { type, articleId, actorId, targetId, commentId });
    return;
  }

  try {
    const notificationsRef = collection(db, 'notifications');
    await addDoc(notificationsRef, {
      type,
      articleId,
      actorId,
      targetId,
      createdAt: serverTimestamp(),
      read: false,
      ...(commentId && { commentId })
    });
  } catch (error) {
    console.error("Error creating notification:", error);
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const currentAuth = typeof window !== 'undefined' ? getFirebaseAuth() : null;
  const user = currentAuth?.currentUser;

  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: user?.uid,
      email: user?.email,
      emailVerified: user?.emailVerified,
      isAnonymous: user?.isAnonymous,
      tenantId: user?.tenantId,
      providerInfo: user?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
