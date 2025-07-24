import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import { app } from "@/lib/firebase";

const db = getFirestore(app);

export interface ProfileProgress {
  answers: Record<string, string[]>;
  lastStep: number;
  currentModule?: number;
  updatedAt: string;
}

export async function saveUserProgress(uid: string, progress: ProfileProgress) {
  console.log('[Firestore] Saving progress for', uid, progress);
  await setDoc(doc(db, "progress", uid), {
    ...progress,
    updatedAt: new Date().toISOString(),
  });
  console.log('[Firestore] Save complete for', uid);
}

export async function loadUserProgress(uid: string): Promise<ProfileProgress | null> {
  console.log('[Firestore] Loading progress for', uid);
  const docSnap = await getDoc(doc(db, "progress", uid));
  if (docSnap.exists()) {
    const data = docSnap.data();
    console.log('[Firestore] Loaded data:', data);
    return {
      answers: data.answers || {},
      lastStep: typeof data.lastStep === 'number' ? data.lastStep : 0,
      currentModule: typeof data.currentModule === 'number' ? data.currentModule : 0,
      updatedAt: data.updatedAt || '',
    };
  }
  console.log('[Firestore] No progress found for', uid);
  return null;
} 