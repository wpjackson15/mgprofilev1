"use client";
import React, { useState, useEffect } from "react";
import { Plus, Users, BookOpen, History, Download } from "lucide-react";
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { useLessonPlans } from '@/hooks/useLessonPlans';
import { useAnalytics } from '@/hooks/useAnalytics';
import { UsageTracker } from '@/components/UsageTracker';
import { AnalyticsDashboard } from '@/components/AnalyticsDashboard';
import { ProfilePreview } from '@/components/ProfilePreview';
import { UploadModal } from '@/components/UploadModal';
import { ManualEntryModal } from '@/components/ManualEntryModal';
import { StudentProfileList } from '@/components/StudentProfileList';
import { LessonPlanGenerator } from '@/components/LessonPlanGenerator';
import { StudentProfile, LessonPlan } from '@/services/mongodb';

export default function LessonPlansPage() {
  const [user, loading, authError] = useAuthState(auth);
  const [currentLessonPlan, setCurrentLessonPlan] = useState<LessonPlan | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showManualEntryModal, setShowManualEntryModal] = useState(false);
  const [selectedProfiles, setSelectedProfiles] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'profiles' | 'generator' | 'history'>('profiles');

  const { 
    lessonPlans, 
    studentProfiles, 
    isLoading, 
    error,
    loadUserLessonPlans,
    loadStudentProfiles,
    createLessonPlan,
    updateLessonPlan,
    deleteLessonPlan,
    saveStudentProfiles,
    updateStudentProfile,
    deleteStudentProfile
  } = useLessonPlans();

  const { trackPDFUpload, trackLessonPlanCreation, trackProfileCreation } = useAnalytics();

  // Load data when user changes
  useEffect(() => {
    if (user) {
      loadUserLessonPlans();
      loadStudentProfiles();
    }
  }, [user, loadUserLessonPlans, loadStudentProfiles]);

  const handleProfileUpload = async (profiles: StudentProfile[]) => {
    if (!user) return;
    
    try {
      // Add userId to profiles
      const profilesWithUserId = profiles.map(profile => ({
        ...profile,
        userId: user.uid
      }));
      
      await saveStudentProfiles(profilesWithUserId);
      await loadStudentProfiles();
      
      trackPDFUpload(profiles.length);
      trackProfileCreation(profiles.length);
    } catch (error) {
      console.error('Error saving profiles:', error);
    }
  };

  const handleManualProfileAdd = async (profile: StudentProfile) => {
    if (!user) return;
    
    try {
      const profileWithUserId = { ...profile, userId: user.uid };
      await saveStudentProfiles([profileWithUserId]);
      await loadStudentProfiles();
      
      trackProfileCreation(1);
    } catch (error) {
      console.error('Error adding profile:', error);
    }
  };

  const handleToggleProfile = (profileId: string) => {
    const newSelected = new Set(selectedProfiles);
    if (newSelected.has(profileId)) {
      newSelected.delete(profileId);
    } else {
      newSelected.add(profileId);
    }
    setSelectedProfiles(newSelected);
  };

  const handleGenerateLessonPlan = async (lessonPlanData: Omit<LessonPlan, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      const lessonPlanId = await createLessonPlan({
        ...lessonPlanData,
        userId: user.uid
      });
      
      trackLessonPlanCreation({ 
        profileCount: lessonPlanData.studentProfiles.length, 
        grade: lessonPlanData.grade, 
        subject: lessonPlanData.subject,
        state: 'N/A',
        outputFormat: 'pdf'
      });
      await loadUserLessonPlans();
      
      return lessonPlanId;
    } catch (error) {
      console.error('Error creating lesson plan:', error);
      throw error;
    }
  };

  const handleDownloadLessonPlan = async (lessonPlan: LessonPlan) => {
    try {
      const { downloadLessonPlanPDF } = await import('@/lib/pdfGenerator');
      await downloadLessonPlanPDF(lessonPlan);
    } catch (error) {
      console.error('Error downloading lesson plan:', error);
    }
  };

  const getSelectedProfiles = () => {
    return studentProfiles.filter(p => selectedProfiles.has(p.id));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (authError || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">Please sign in to access the lesson plan generator.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Lesson Plan Generator</h1>
          <p className="text-gray-600">
            Create personalized lesson plans based on student profiles and CALES criteria
          </p>
        </div>

        {/* Usage Tracking */}
        <div className="mb-6">
          <UsageTracker />
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <nav className="flex space-x-8 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('profiles')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'profiles'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Student Profiles ({studentProfiles.length})
            </button>
            <button
              onClick={() => setActiveTab('generator')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'generator'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BookOpen className="w-4 h-4 inline mr-2" />
              Generate Lesson Plan
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'history'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <History className="w-4 h-4 inline mr-2" />
              History ({lessonPlans.length})
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {/* Student Profiles Tab */}
          {activeTab === 'profiles' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Student Profiles</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowUploadModal(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Upload Profiles
                  </button>
                  <button
                    onClick={() => setShowManualEntryModal(true)}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Manually
                  </button>
                </div>
              </div>

              <StudentProfileList
                profiles={studentProfiles}
                selectedProfiles={selectedProfiles}
                onToggleProfile={handleToggleProfile}
                onEditProfile={(profile) => {
                  // Handle edit - could open a modal or navigate to edit page
                  console.log('Edit profile:', profile);
                }}
                onDeleteProfile={async (profileId) => {
                  try {
                    await deleteStudentProfile(profileId);
                    await loadStudentProfiles();
                  } catch (error) {
                    console.error('Error deleting profile:', error);
                  }
                }}
              />
            </div>
          )}

          {/* Lesson Plan Generator Tab */}
          {activeTab === 'generator' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Generate Lesson Plan</h2>
              
              {studentProfiles.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                  <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Student Profiles</h3>
                  <p className="text-gray-600 mb-4">
                    You need to add student profiles before generating lesson plans.
                  </p>
                  <button
                    onClick={() => setActiveTab('profiles')}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                  >
                    Add Student Profiles
                  </button>
                </div>
              ) : (
                <LessonPlanGenerator
                  studentProfiles={getSelectedProfiles()}
                  onGenerate={handleGenerateLessonPlan}
                  onDownload={handleDownloadLessonPlan}
                />
              )}
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Lesson Plan History</h2>
              
              {lessonPlans.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                  <History className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Lesson Plans Yet</h3>
                  <p className="text-gray-600">
                    Generate your first lesson plan to see it here.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {lessonPlans.map((plan) => (
                    <div key={plan.id} className="bg-white rounded-lg border border-gray-200 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">{plan.title}</h3>
                          <p className="text-sm text-gray-500">
                            {plan.grade} • {plan.subject} • {new Date(plan.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDownloadLessonPlan(plan)}
                          className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 flex items-center gap-2"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Analytics Dashboard */}
        <div className="mt-8">
          <AnalyticsDashboard />
        </div>

        {/* Modals */}
        <UploadModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onUpload={handleProfileUpload}
        />
        
        <ManualEntryModal
          isOpen={showManualEntryModal}
          onClose={() => setShowManualEntryModal(false)}
          onAdd={handleManualProfileAdd}
        />
      </div>
    </div>
  );
}
