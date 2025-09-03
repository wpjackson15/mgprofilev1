import { useState, useEffect, useCallback } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { UserProgress } from "@/services/mongodb";

const LOCAL_KEY = "mgp_profile_progress";

export function useProfileProgress() {
  const [user, setUser] = useState<User | null>(null);
  const [progress, setProgress] = useState<UserProgress | null>(null);
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
          // Logged in: try MongoDB API first, fallback to localStorage
          try {
            const response = await fetch(`/api/user-progress?userId=${user.uid}&moduleId=default`);
            if (response.ok) {
              const data = await response.json();
              if (data) {
                setProgress(data);
              } else {
                setProgress(null);
              }
            } else {
              throw new Error('Failed to load from API');
            }
          } catch (apiErr) {
            console.warn("MongoDB API not available, falling back to localStorage:", apiErr);
            // Fallback to localStorage for now
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
  const save = useCallback(async (data: UserProgress) => {
    setProgress(data);
    if (user && user.email) {
      try {
        const response = await fetch('/api/user-progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...data, userId: user.uid, moduleId: "default" })
        });
        if (!response.ok) {
          throw new Error('Failed to save to API');
        }
      } catch (apiErr) {
        console.warn("MongoDB API not available, falling back to localStorage:", apiErr);
        // Fallback to localStorage for now
        try {
          localStorage.setItem(LOCAL_KEY, JSON.stringify(data));
        } catch {
          // Ignore localStorage errors
        }
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
      try {
        const response = await fetch('/api/user-progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            answers: {}, 
            lastStep: 0, 
            updatedAt: new Date().toISOString() 
          })
        });
        if (!response.ok) {
          throw new Error('Failed to reset via API');
        }
      } catch (apiErr) {
        console.warn("MongoDB API not available, falling back to localStorage:", apiErr);
        // Fallback to localStorage for now
        try {
          localStorage.removeItem(LOCAL_KEY);
        } catch {
          // Ignore localStorage errors
        }
      }
    } else {
      localStorage.removeItem(LOCAL_KEY);
    }
  }, [user]);

  return { progress, setProgress, loading, error, save, reset, user };
} 