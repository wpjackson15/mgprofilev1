"use client";
import React, { useState, useRef } from "react";
import { Upload, Plus, Users, BookOpen, X, User, Download, FileText, File, ExternalLink, History } from "lucide-react";
import { UsageTracker } from '@/components/UsageTracker';
import { useAnalytics } from '@/hooks/useAnalytics';
import { updateUsageStats } from '@/components/UsageTracker';
import { AnalyticsDashboard } from '@/components/AnalyticsDashboard';
import { useLessonPlans } from '@/hooks/useLessonPlans';
import { useProfileUpload } from '@/hooks/useProfileUpload';
import { StudentProfile, LessonPlan } from '@/services/firestore';
import { ProfilePreview } from '@/components/ProfilePreview';




interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (profiles: StudentProfile[]) => void;
}

interface ManualEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (profile: StudentProfile) => void;
}

function UploadModal({ isOpen, onClose, onUpload }: UploadModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadProfiles, isUploading, uploadProgress, error, clearError, generateTemplate } = useProfileUpload();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const result = await uploadProfiles(files);
    
    if (result.success && result.profiles.length > 0) {
      onUpload(result.profiles);
      onClose();
    }
  };

  const handleDownloadTemplate = () => {
    const template = generateTemplate();
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student-profiles-template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Upload Student Profiles</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Upload PDF files to automatically extract student profiles using AI! Also supports CSV and TXT files with columns: Name, Grade, Subject, Profile.
          </p>
          
          {/* Progress Display */}
          {uploadProgress && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-900">Processing Files</span>
                <span className="text-sm text-blue-700">{uploadProgress.current}/{uploadProgress.total}</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                ></div>
              </div>
              <p className="text-sm text-blue-700 mt-2">{uploadProgress.message}</p>
            </div>
          )}
          
          <div className="flex gap-2 justify-center">
            <button
              onClick={handleDownloadTemplate}
              className="text-blue-600 hover:text-blue-800 text-sm underline"
            >
              Download CSV Template
            </button>
            <span className="text-gray-400">|</span>
            <a
              href="/sample-student-profiles.csv"
              download
              className="text-blue-600 hover:text-blue-800 text-sm underline"
            >
              Download Sample File
            </a>
          </div>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".csv,.txt,.pdf"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600 mb-2">
              {isUploading ? 'AI is analyzing your files...' : 'Click to select files or drag and drop'}
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isUploading ? 'Analyzing...' : 'Select Files'}
            </button>
          </div>

          {/* Supported Formats */}
          <div className="text-xs text-gray-500 text-center">
            <p className="font-medium mb-1">Supported Formats:</p>
            <div className="flex justify-center gap-4">
              <span>📄 PDF (AI extraction)</span>
              <span>📊 CSV (comma-separated)</span>
              <span>📝 TXT (tab/comma-separated)</span>
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded">
              <div className="flex justify-between items-start">
                <span>{error}</span>
                <button onClick={clearError} className="text-red-400 hover:text-red-600 ml-2">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ManualEntryModal({ isOpen, onClose, onAdd }: ManualEntryModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    grade: '',
    subject: '',
    profile: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.grade || !formData.subject || !formData.profile) {
      return;
    }

    const newProfile: StudentProfile = {
      id: `manual-${Date.now()}`,
      ...formData,
      createdAt: new Date().toISOString()
    };

    onAdd(newProfile);
    setFormData({ name: '', grade: '', subject: '', profile: '' });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Add Student Profile</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Student Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Grade Level *
            </label>
            <select
              value={formData.grade}
              onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select Grade</option>
              <option value="K">Kindergarten</option>
              <option value="1">1st Grade</option>
              <option value="2">2nd Grade</option>
              <option value="3">3rd Grade</option>
              <option value="4">4th Grade</option>
              <option value="5">5th Grade</option>
              <option value="6">6th Grade</option>
              <option value="7">7th Grade</option>
              <option value="8">8th Grade</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject *
            </label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Math, Science, ELA"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Student Profile *
            </label>
            <textarea
              value={formData.profile}
              onChange={(e) => setFormData({ ...formData, profile: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe the student's learning style, strengths, challenges, cultural background, interests..."
              required
            />
          </div>
          
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              Add Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function LessonPlansPage() {
  const [currentLessonPlan, setCurrentLessonPlan] = useState<LessonPlan | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [outputFormat, setOutputFormat] = useState<'pdf' | 'google-doc'>('pdf');
  const [showSavedPlans, setShowSavedPlans] = useState(false);
  
  // Lesson plan settings
  const [lessonSettings, setLessonSettings] = useState({
    grade: '',
    subject: '',
    state: ''
  });

  // Firebase integration
  const { 
    lessonPlans, 
    studentProfiles, 
    isLoading, 
    error, 
    user,
    createLessonPlan, 
    saveStudentProfiles,
    deleteLessonPlan,
    clearError 
  } = useLessonPlans();

  const { exportProfiles } = useProfileUpload();

  // Analytics integration
  const { trackPDFUpload, trackLessonPlanCreation, trackProfileCreation } = useAnalytics();

  const handleUploadFiles = () => {
    setIsUploadModalOpen(true);
  };

  const handleManualEntry = () => {
    setIsManualModalOpen(true);
  };

  const handleAddProfile = (profile: StudentProfile) => {
    const newProfiles = [...studentProfiles, profile];
    saveStudentProfiles(newProfiles);
    trackProfileCreation({ method: 'manual', profileCount: newProfiles.length });
    updateUsageStats.profileCreated();
  };

  const handleUploadProfiles = (profiles: StudentProfile[]) => {
    const newProfiles = [...studentProfiles, ...profiles];
    saveStudentProfiles(newProfiles);
    trackPDFUpload({ profileCount: profiles.length, totalProfiles: newProfiles.length });
    updateUsageStats.pdfUploaded();
  };

  const handleRemoveProfile = (id: string) => {
    const newProfiles = studentProfiles.filter(p => p.id !== id);
    saveStudentProfiles(newProfiles);
  };

  const handleExportProfiles = () => {
    if (studentProfiles.length === 0) return;
    
    const csvContent = exportProfiles(studentProfiles);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `student-profiles-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleGenerateLessonPlan = async () => {
    if (studentProfiles.length === 0) {
      setGenerationError('Please add at least one student profile.');
      return;
    }
    
    if (!lessonSettings.grade || !lessonSettings.subject || !lessonSettings.state) {
      setGenerationError('Please select grade level, subject, and state before generating a lesson plan.');
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);

    try {
      // Create a prompt for the AI based on student profiles and lesson settings
      const profilesText = studentProfiles.map(p => 
        `Student: ${p.name} (Grade ${p.grade}, ${p.subject})\nProfile: ${p.profile}`
      ).join('\n\n');

      const prompt = `Create a culturally responsive, differentiated lesson plan that aligns with ${lessonSettings.state} state standards for ${lessonSettings.grade} grade ${lessonSettings.subject}.

Lesson Settings:
- Grade Level: ${lessonSettings.grade}
- Subject: ${lessonSettings.subject}
- State: ${lessonSettings.state}

Student Profiles:
${profilesText}

Please provide a comprehensive, standards-aligned lesson plan with:
1. Title and subject
2. Grade level
3. Learning objectives that align with ${lessonSettings.state} state standards for ${lessonSettings.grade} grade ${lessonSettings.subject}
4. Engaging activities that accommodate different learning styles and cultural backgrounds
5. Assessment methods that measure standards mastery
6. Required materials
7. Estimated duration

Format the response as JSON with the following structure:
{
  "title": "Lesson Title",
  "subject": "Subject",
  "grade": "Grade Level",
  "objectives": ["Objective 1", "Objective 2"],
  "activities": ["Activity 1", "Activity 2"],
  "assessment": "Assessment description",
  "materials": ["Material 1", "Material 2"],
  "duration": "45 minutes"
}`;

      // Call the lesson plan generation service
      const response = await fetch('/.netlify/functions/generate-lesson-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt, 
          studentProfiles, 
          outputFormat,
          lessonSettings 
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate lesson plan');
      }

      const data = await response.json();
      
      const newLessonPlan: Omit<LessonPlan, 'id' | 'createdAt' | 'updatedAt' | 'userId'> = {
        title: data.title,
        subject: data.subject,
        grade: data.grade,
        objectives: data.objectives,
        activities: data.activities,
        assessment: data.assessment,
        materials: data.materials,
        duration: data.duration,
        studentProfiles,
        lessonSettings,
        outputFormat,
        googleDocUrl: data.googleDocUrl
      };

      const lessonPlanId = await createLessonPlan(newLessonPlan);
      
      if (lessonPlanId) {
        const savedLessonPlan: LessonPlan = {
          id: lessonPlanId,
          ...newLessonPlan,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          userId: user?.uid || ''
        };
        setCurrentLessonPlan(savedLessonPlan);
      }
      
      trackLessonPlanCreation({ 
        profileCount: studentProfiles.length, 
        grade: lessonSettings.grade, 
        subject: lessonSettings.subject,
        state: lessonSettings.state,
        outputFormat 
      });
      updateUsageStats.lessonPlanCreated();
    } catch (error) {
      setGenerationError('Failed to generate lesson plan. Please try again.');
      console.error('Lesson plan generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadLessonPlan = async () => {
    if (!currentLessonPlan) return;
    
    if (currentLessonPlan.outputFormat === 'google-doc' && currentLessonPlan.googleDocUrl) {
      // Open Google Doc in new tab
      window.open(currentLessonPlan.googleDocUrl, '_blank');
      return;
    }
    
    // Dynamically import PDF generator to avoid SSR issues
    try {
      const { downloadLessonPlanPDF } = await import('@/lib/pdfGenerator');
      
      const lessonPlanData = {
        title: currentLessonPlan.title,
        subject: currentLessonPlan.subject,
        grade: currentLessonPlan.grade,
        objectives: currentLessonPlan.objectives,
        activities: currentLessonPlan.activities,
        assessment: currentLessonPlan.assessment,
        materials: currentLessonPlan.materials,
        duration: currentLessonPlan.duration,
        studentProfiles: studentProfiles
      };

      downloadLessonPlanPDF(lessonPlanData, `lesson-plan-${currentLessonPlan.title.toLowerCase().replace(/\s+/g, '-')}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8">
        <div className="max-w-6xl mx-auto text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </main>
    );
  }

  // Show authentication required message
  if (!user) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8">
        <div className="max-w-6xl mx-auto text-center py-12">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">My Genius Lesson Plans</h1>
          <p className="text-gray-600 mb-8">Please sign in to access your lesson plans</p>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 max-w-md mx-auto">
            <p className="text-gray-700 mb-4">You need to be signed in to create and manage lesson plans.</p>
            <button
              onClick={() => window.location.href = '/chatbot'}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Sign In
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">My Genius Lesson Plans</h1>
          <p className="text-gray-600">Create culturally responsive, differentiated lessons based on student profiles</p>
          <p className="text-sm text-gray-500 mt-2">Signed in as: {user.email}</p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-red-800 font-medium">Error</h3>
                <p className="text-red-600 text-sm mt-1">{typeof error === 'string' ? error : error?.message || 'An error occurred'}</p>
              </div>
              <button
                onClick={clearError}
                className="text-red-400 hover:text-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Usage Tracker */}
        <UsageTracker />

        {/* Analytics Dashboard (Development Only) */}
        {process.env.NODE_ENV === 'development' && <AnalyticsDashboard />}

        {/* Lesson Settings Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Lesson Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Grade Level *
              </label>
              <select
                value={lessonSettings.grade}
                onChange={(e) => setLessonSettings({ ...lessonSettings, grade: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Grade</option>
                <option value="K">Kindergarten</option>
                <option value="1">1st Grade</option>
                <option value="2">2nd Grade</option>
                <option value="3">3rd Grade</option>
                <option value="4">4th Grade</option>
                <option value="5">5th Grade</option>
                <option value="6">6th Grade</option>
                <option value="7">7th Grade</option>
                <option value="8">8th Grade</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject *
              </label>
              <select
                value={lessonSettings.subject}
                onChange={(e) => setLessonSettings({ ...lessonSettings, subject: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Subject</option>
                <option value="Math">Mathematics</option>
                <option value="Science">Science</option>
                <option value="ELA">English Language Arts</option>
                <option value="Social Studies">Social Studies</option>
                <option value="History">History</option>
                <option value="Geography">Geography</option>
                <option value="Art">Art</option>
                <option value="Music">Music</option>
                <option value="Physical Education">Physical Education</option>
                <option value="Technology">Technology</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                State *
              </label>
              <select
                value={lessonSettings.state}
                onChange={(e) => setLessonSettings({ ...lessonSettings, state: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select State</option>
                <option value="AL">Alabama</option>
                <option value="AK">Alaska</option>
                <option value="AZ">Arizona</option>
                <option value="AR">Arkansas</option>
                <option value="CA">California</option>
                <option value="CO">Colorado</option>
                <option value="CT">Connecticut</option>
                <option value="DE">Delaware</option>
                <option value="FL">Florida</option>
                <option value="GA">Georgia</option>
                <option value="HI">Hawaii</option>
                <option value="ID">Idaho</option>
                <option value="IL">Illinois</option>
                <option value="IN">Indiana</option>
                <option value="IA">Iowa</option>
                <option value="KS">Kansas</option>
                <option value="KY">Kentucky</option>
                <option value="LA">Louisiana</option>
                <option value="ME">Maine</option>
                <option value="MD">Maryland</option>
                <option value="MA">Massachusetts</option>
                <option value="MI">Michigan</option>
                <option value="MN">Minnesota</option>
                <option value="MS">Mississippi</option>
                <option value="MO">Missouri</option>
                <option value="MT">Montana</option>
                <option value="NE">Nebraska</option>
                <option value="NV">Nevada</option>
                <option value="NH">New Hampshire</option>
                <option value="NJ">New Jersey</option>
                <option value="NM">New Mexico</option>
                <option value="NY">New York</option>
                <option value="NC">North Carolina</option>
                <option value="ND">North Dakota</option>
                <option value="OH">Ohio</option>
                <option value="OK">Oklahoma</option>
                <option value="OR">Oregon</option>
                <option value="PA">Pennsylvania</option>
                <option value="RI">Rhode Island</option>
                <option value="SC">South Carolina</option>
                <option value="SD">South Dakota</option>
                <option value="TN">Tennessee</option>
                <option value="TX">Texas</option>
                <option value="UT">Utah</option>
                <option value="VT">Vermont</option>
                <option value="VA">Virginia</option>
                <option value="WA">Washington</option>
                <option value="WV">West Virginia</option>
                <option value="WI">Wisconsin</option>
                <option value="WY">Wyoming</option>
              </select>
            </div>
          </div>
        </div>

        {/* Student Profiles Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Student Profiles ({studentProfiles.length})</h2>
            <div className="flex gap-3">
              {studentProfiles.length > 0 && (
                <button
                  onClick={handleExportProfiles}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </button>
              )}
              <button
                onClick={handleUploadFiles}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Upload className="w-4 h-4" />
                Upload Files
              </button>
              <button
                onClick={handleManualEntry}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Manual Entry
              </button>
            </div>
          </div>

          {/* Empty State */}
          {studentProfiles.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-2">No student profiles added yet.</p>
              <p className="text-gray-400">Add profiles to generate personalized lesson plans.</p>
            </div>
          )}

          {/* Student Profiles List */}
          {studentProfiles.length > 0 && (
            <ProfilePreview
              profiles={studentProfiles}
              onDelete={handleRemoveProfile}
              showValidation={true}
            />
          )}
        </div>

        {/* Generated Lesson Plan Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Generated Lesson Plan</h2>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSavedPlans(!showSavedPlans)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <History className="w-4 h-4" />
                Saved Plans ({lessonPlans.length})
              </button>
              {currentLessonPlan && (
                <button
                  onClick={handleDownloadLessonPlan}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  {currentLessonPlan.outputFormat === 'google-doc' ? (
                    <ExternalLink className="w-4 h-4" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  {currentLessonPlan.outputFormat === 'google-doc' ? 'Open Doc' : 'Download'}
                </button>
              )}
              {studentProfiles.length > 0 && (
                <button
                  onClick={handleGenerateLessonPlan}
                  disabled={isGenerating || !lessonSettings.grade || !lessonSettings.subject || !lessonSettings.state}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {isGenerating ? 'Generating...' : 'Generate Lesson Plan'}
                </button>
              )}
            </div>
          </div>

          {/* Output Format Selection */}
          {studentProfiles.length > 0 && !currentLessonPlan && !isGenerating && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-3">Output Format</h4>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="outputFormat"
                    value="pdf"
                    checked={outputFormat === 'pdf'}
                    onChange={(e) => setOutputFormat(e.target.value as 'pdf' | 'google-doc')}
                    className="text-blue-600"
                  />
                  <File className="w-4 h-4 text-blue-600" />
                  <span className="text-blue-900">PDF Document</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="outputFormat"
                    value="google-doc"
                    checked={outputFormat === 'google-doc'}
                    onChange={(e) => setOutputFormat(e.target.value as 'pdf' | 'google-doc')}
                    className="text-blue-600"
                  />
                  <FileText className="w-4 h-4 text-green-600" />
                  <span className="text-blue-900">Google Doc</span>
                </label>
              </div>
            </div>
          )}

          {/* Error State */}
          {generationError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">{generationError}</p>
            </div>
          )}

          {/* Saved Plans Display */}
          {showSavedPlans && lessonPlans.length > 0 && (
            <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3">Saved Lesson Plans</h4>
              <div className="space-y-3">
                {lessonPlans.map((plan) => (
                  <div key={plan.id} className="flex justify-between items-center p-3 bg-white rounded border">
                    <div>
                      <h5 className="font-medium">{plan.title}</h5>
                      <p className="text-sm text-gray-600">
                        {plan.subject} • Grade {plan.grade} • {new Date(plan.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCurrentLessonPlan(plan)}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                      >
                        View
                      </button>
                      <button
                        onClick={() => deleteLessonPlan(plan.id)}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!currentLessonPlan && !isGenerating && (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-2">Ready to Generate</p>
              <p className="text-gray-400">
                {studentProfiles.length === 0 
                  ? "Add student profiles and click 'Generate Lesson Plan' to create culturally responsive, differentiated lessons as PDFs or Google Docs."
                  : "Click 'Generate Lesson Plan' to create culturally responsive, differentiated lessons as PDFs or Google Docs."
                }
              </p>
            </div>
          )}

          {/* Loading State */}
          {isGenerating && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Generating your personalized lesson plan...</p>
            </div>
          )}

          {/* Lesson Plan Display */}
          {currentLessonPlan && !isGenerating && (
            <div className="space-y-6">
              <div className="border-b border-gray-200 pb-4">
                <h3 className="text-2xl font-bold text-gray-800 mb-2">{currentLessonPlan.title}</h3>
                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  <span>Subject: {currentLessonPlan.subject}</span>
                  <span>Grade: {currentLessonPlan.grade}</span>
                  <span>State: {currentLessonPlan.lessonSettings.state}</span>
                  <span>Duration: {currentLessonPlan.duration}</span>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Learning Objectives</h4>
                <ul className="space-y-2">
                  {currentLessonPlan.objectives.map((objective: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span className="text-gray-700">{objective}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Activities</h4>
                <ul className="space-y-2">
                  {currentLessonPlan.activities.map((activity: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-green-600 mt-1">•</span>
                      <span className="text-gray-700">{activity}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Assessment</h4>
                <p className="text-gray-700">{currentLessonPlan.assessment}</p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Materials Needed</h4>
                <ul className="space-y-1">
                  {currentLessonPlan.materials.map((material: string, index: number) => (
                    <li key={index} className="flex items-center gap-2">
                      <span className="text-purple-600">•</span>
                      <span className="text-gray-700">{material}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUpload={handleUploadProfiles}
      />
      
      <ManualEntryModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        onAdd={handleAddProfile}
      />
    </main>
  );
} 