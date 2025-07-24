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
  await setDoc(doc(db, "progress", uid), {
    ...progress,
    updatedAt: new Date().toISOString(),
  });
}

export async function loadUserProgress(uid: string): Promise<ProfileProgress | null> {
  const docSnap = await getDoc(doc(db, "progress", uid));
  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      answers: data.answers || {},
      lastStep: typeof data.lastStep === 'number' ? data.lastStep : 0,
      currentModule: typeof data.currentModule === 'number' ? data.currentModule : 0,
      updatedAt: data.updatedAt || '',
    };
  }
  return null;
} 