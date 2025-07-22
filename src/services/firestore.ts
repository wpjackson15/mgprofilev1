import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import { app } from "@/lib/firebase";

const db = getFirestore(app);

export interface ProfileProgress {
  answers: Record<string, string[]>;
  lastStep: number;
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
    return docSnap.data() as ProfileProgress;
  }
  return null;
} 