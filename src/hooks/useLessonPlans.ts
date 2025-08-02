import { useState, useEffect, useCallback } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { 
  LessonPlan, 
  StudentProfile, 
  saveLessonPlan, 
  getUserLessonPlans, 
  updateLessonPlan, 
  deleteLessonPlan,
  saveStudentProfiles,
  loadStudentProfiles
} from '@/services/firestore';

export function useLessonPlans() {
  const [user, loading, authError] = useAuthState(auth);
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([]);
  const [studentProfiles, setStudentProfiles] = useState<StudentProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load user's lesson plans
  const loadUserLessonPlans = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const plans = await getUserLessonPlans(user.uid);
      setLessonPlans(plans);
    } catch (err) {
      setError('Failed to load lesson plans');
      console.error('Error loading lesson plans:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Load user's student profiles
  const loadUserStudentProfiles = useCallback(async () => {
    if (!user) return;
    
    try {
      const profiles = await loadStudentProfiles(user.uid);
      setStudentProfiles(profiles);
    } catch (err) {
      console.error('Error loading student profiles:', err);
    }
  }, [user]);

  // Save a new lesson plan
  const createLessonPlan = useCallback(async (lessonPlanData: Omit<LessonPlan, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
    if (!user) {
      setError('User not authenticated');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const lessonPlanWithUser = {
        ...lessonPlanData,
        userId: user.uid,
      };
      
      const lessonPlanId = await saveLessonPlan(lessonPlanWithUser);
      
      // Reload lesson plans to get the updated list
      await loadUserLessonPlans();
      
      return lessonPlanId;
    } catch (err) {
      setError('Failed to save lesson plan');
      console.error('Error saving lesson plan:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user, loadUserLessonPlans]);

  // Update an existing lesson plan
  const updateExistingLessonPlan = useCallback(async (lessonPlanId: string, updates: Partial<LessonPlan>) => {
    setIsLoading(true);
    setError(null);

    try {
      await updateLessonPlan(lessonPlanId, updates);
      
      // Update local state
      setLessonPlans(prev => prev.map(plan => 
        plan.id === lessonPlanId 
          ? { ...plan, ...updates, updatedAt: new Date().toISOString() }
          : plan
      ));
    } catch (err) {
      setError('Failed to update lesson plan');
      console.error('Error updating lesson plan:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Delete a lesson plan
  const removeLessonPlan = useCallback(async (lessonPlanId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      await deleteLessonPlan(lessonPlanId);
      
      // Update local state
      setLessonPlans(prev => prev.filter(plan => plan.id !== lessonPlanId));
    } catch (err) {
      setError('Failed to delete lesson plan');
      console.error('Error deleting lesson plan:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save student profiles
  const saveProfiles = useCallback(async (profiles: StudentProfile[]) => {
    if (!user) {
      setError('User not authenticated');
      return;
    }

    try {
      await saveStudentProfiles(user.uid, profiles);
      setStudentProfiles(profiles);
    } catch (err) {
      setError('Failed to save student profiles');
      console.error('Error saving student profiles:', err);
    }
  }, [user]);

  // Load data when user changes
  useEffect(() => {
    if (user) {
      loadUserLessonPlans();
      loadUserStudentProfiles();
    } else {
      setLessonPlans([]);
      setStudentProfiles([]);
    }
  }, [user, loadUserLessonPlans, loadUserStudentProfiles]);

  return {
    // State
    lessonPlans,
    studentProfiles,
    isLoading: isLoading || loading,
    error: error || (authError ? String(authError) : null),
    user,
    
    // Actions
    createLessonPlan,
    updateLessonPlan: updateExistingLessonPlan,
    deleteLessonPlan: removeLessonPlan,
    saveStudentProfiles: saveProfiles,
    loadUserLessonPlans,
    loadUserStudentProfiles,
    
    // Utility
    clearError: () => setError(null),
  };
} 