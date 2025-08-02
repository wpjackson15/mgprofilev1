import { db } from "@/lib/firebase";
import { doc, setDoc, getDoc, collection, query, where, orderBy, getDocs, deleteDoc, updateDoc } from "firebase/firestore";

export interface ProfileProgress {
  answers: Record<string, string[]>;
  lastStep: number;
  currentModule?: number;
  updatedAt: string;
}

export interface StudentProfile {
  id: string;
  name: string;
  grade: string;
  subject: string;
  profile: string;
  createdAt: string;
}

export interface LessonPlan {
  id: string;
  title: string;
  subject: string;
  grade: string;
  objectives: string[];
  activities: string[];
  assessment: string;
  materials: string[];
  duration: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  studentProfiles: StudentProfile[];
  lessonSettings: {
    grade: string;
    subject: string;
    state: string;
  };
  outputFormat?: 'pdf' | 'google-doc';
  googleDocUrl?: string;
  calesCriteria?: {
    canDoAttitude: boolean;
    interestAwareness: boolean;
    multiculturalNavigation: boolean;
    racialPride: boolean;
    selectiveTrust: boolean;
    socialJustice: boolean;
    holisticWellBeing: boolean;
    clarity: boolean;
    accessibility: boolean;
    credibility: boolean;
    outcomes: boolean;
  };
  ragContext?: string[];
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

// Lesson Plan Services
export async function saveLessonPlan(lessonPlan: Omit<LessonPlan, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const lessonPlanRef = doc(collection(db, "lessonPlans"));
  
  // Filter out undefined values to avoid Firebase errors
  const cleanLessonPlan = Object.fromEntries(
    Object.entries(lessonPlan).filter(([, value]) => value !== undefined)
  );
  
  const lessonPlanData = {
    ...cleanLessonPlan,
    id: lessonPlanRef.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  await setDoc(lessonPlanRef, lessonPlanData);
  return lessonPlanRef.id;
}

export async function loadLessonPlan(lessonPlanId: string): Promise<LessonPlan | null> {
  const docRef = doc(db, "lessonPlans", lessonPlanId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data() as LessonPlan;
  }
  return null;
}

export async function getUserLessonPlans(userId: string): Promise<LessonPlan[]> {
  const q = query(
    collection(db, "lessonPlans"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );
  
  const querySnapshot = await getDocs(q);
  const lessonPlans: LessonPlan[] = [];
  
  querySnapshot.forEach((doc) => {
    lessonPlans.push(doc.data() as LessonPlan);
  });
  
  return lessonPlans;
}

export async function updateLessonPlan(lessonPlanId: string, updates: Partial<LessonPlan>): Promise<void> {
  const docRef = doc(db, "lessonPlans", lessonPlanId);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteLessonPlan(lessonPlanId: string): Promise<void> {
  const docRef = doc(db, "lessonPlans", lessonPlanId);
  await deleteDoc(docRef);
}

// Student Profile Services
export async function saveStudentProfiles(userId: string, profiles: StudentProfile[]): Promise<void> {
  const profilesRef = doc(db, "studentProfiles", userId);
  await setDoc(profilesRef, {
    userId,
    profiles,
    updatedAt: new Date().toISOString(),
  }, { merge: true });
}

export async function loadStudentProfiles(userId: string): Promise<StudentProfile[]> {
  const docRef = doc(db, "studentProfiles", userId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    return data.profiles || [];
  }
  return [];
} 