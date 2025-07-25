import { db } from "@/lib/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";

export interface ProfileProgress {
  answers: Record<string, string[]>;
  lastStep: number;
  currentModule?: number;
  updatedAt: string;
}

export async function saveUserProgress(uid: string, progress: ProfileProgress) {
  const docRef = doc(db, "progress", uid);
  await setDoc(docRef, progress, { merge: true });
}

export async function loadUserProgress(uid: string): Promise<ProfileProgress | null> {
  const docRef = doc(db, "progress", uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data() as ProfileProgress;
  }
  return null;
} 