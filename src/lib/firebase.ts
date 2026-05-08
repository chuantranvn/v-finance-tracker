"use client";

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore, doc, getDocFromServer } from 'firebase/firestore';

// Standard import for Next.js JSON support
import firebaseConfig from '../../firebase-applet-config.json';

// Get the actual config object
const config = (firebaseConfig as any).default || firebaseConfig;

let appInstance: any;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;

const getAppInstance = () => {
  if (typeof window === 'undefined') return null;
  if (!appInstance) {
    appInstance = getApps().length > 0 ? getApp() : initializeApp(config);
  }
  return appInstance;
};

export const getFirebaseAuth = () => {
  if (typeof window === 'undefined') return null;
  if (!authInstance) {
    const app = getAppInstance();
    if (app) {
      authInstance = getAuth(app);
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

// Compatibility exports
export const auth = (typeof window !== 'undefined' ? getFirebaseAuth() : null) as unknown as Auth;
export const db = (typeof window !== 'undefined' ? getFirebaseDB() : null) as unknown as Firestore;

// Connectivity check - only on client
if (typeof window !== 'undefined') {
  const checkConnection = async () => {
    const database = getFirebaseDB();
    if (!database) return;
    try {
      await getDocFromServer(doc(database, 'test', 'connection'));
    } catch (error) {
      // Ignore common errors, just a silent check
    }
  };
  checkConnection();
}

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
