import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  collection,
  getDocFromServer,
  onSnapshot
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase SDK
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId); /* CRITICAL: The app will break without this line */
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

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
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test initial connection to Firestore
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client offline status.');
    }
    return false;
  }
}

// Sign in with Google Popup
export async function signInWithGoogle(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    if (result.user) {
      // Save or update user profile
      const userRef = doc(db, 'users', result.user.uid);
      await setDoc(
        userRef,
        {
          uid: result.user.uid,
          displayName: result.user.displayName || 'Flight Director',
          email: result.user.email || '',
          photoURL: result.user.photoURL || '',
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      );
    }
    return result.user;
  } catch (error) {
    console.error('Google Sign-In failed:', error);
    throw error;
  }
}

export async function logOut(): Promise<void> {
  await signOut(auth);
}

// Save Mission to User's Firestore
export async function saveMissionToCloud(userId: string, mission: any): Promise<void> {
  const path = `users/${userId}/savedMissions/${mission.id}`;
  try {
    await setDoc(doc(db, 'users', userId, 'savedMissions', mission.id), {
      ...mission,
      userId,
      savedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Fetch all missions saved by the user
export async function fetchUserMissions(userId: string): Promise<any[]> {
  const path = `users/${userId}/savedMissions`;
  try {
    const snapshot = await getDocs(collection(db, 'users', userId, 'savedMissions'));
    return snapshot.docs.map((d) => d.data());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

// Delete mission from Cloud
export async function deleteMissionFromCloud(userId: string, missionId: string): Promise<void> {
  const path = `users/${userId}/savedMissions/${missionId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'savedMissions', missionId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
