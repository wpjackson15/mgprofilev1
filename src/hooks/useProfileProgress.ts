import { useState, useEffect, useCallback } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { saveUserProgress, loadUserProgress, ProfileProgress } from "@/services/firestore";

const LOCAL_KEY = "mgp_profile_progress";

export function useProfileProgress() {
  const [user, setUser] = useState<User | null>(null);
  const [progress, setProgress] = useState<ProfileProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load user on mount
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });
    return () => unsubscribe();
  }, []);

  // Load progress on user change
  useEffect(() => {
    setLoading(true);
    setError(null);
    async function load() {
      try {
        if (user && user.email) {
          // Logged in: load from Firestore
          const data = await loadUserProgress(user.uid).catch(err => { console.warn("Failed to load user progress:", err); return null; });
          if (data) {
            setProgress(data);
          } else {
            setProgress(null);
          }
        } else {
          // Anonymous: load from localStorage
          try {
            const raw = localStorage.getItem(LOCAL_KEY);
            if (raw) {
              setProgress(JSON.parse(raw));
            } else {
              setProgress(null);
            }
          } catch {
            setProgress(null);
          }
        }
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  // Save progress
  const save = useCallback(async (data: ProfileProgress) => {
    setProgress(data);
    if (user && user.email) {
      try {
        await saveUserProgress(user.uid, data).catch(err => { console.warn("Failed to save user progress:", err); });
      } catch (err) {
        setError((err as Error).message);
      }
    } else {
      try {
        localStorage.setItem(LOCAL_KEY, JSON.stringify(data));
      } catch {
        // Ignore localStorage errors
      }
    }
  }, [user]);

  // Reset progress
  const reset = useCallback(async () => {
    setProgress(null);
    if (user && user.email) {
      await saveUserProgress(user.uid, { answers: {}, lastStep: 0, updatedAt: new Date().toISOString() }).catch(err => { console.warn("Failed to reset user progress:", err); });
    } else {
      localStorage.removeItem(LOCAL_KEY);
    }
  }, [user]);

  return { progress, setProgress, loading, error, save, reset, user };
} 