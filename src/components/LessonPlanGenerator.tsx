"use client";
import React, { useState } from "react";
import { BookOpen, Loader2, FileText } from "lucide-react";
import { LessonPlanDisplay } from './LessonPlanDisplay';
import { GRADE_OPTIONS, SUBJECT_OPTIONS, STATE_OPTIONS, OUTPUT_FORMAT_OPTIONS, type LessonSettings, type LessonPlanFormData } from '@/lib/lessonPlanConstants';
import { StudentProfile, LessonPlan } from '@/services/mongodb';

interface LessonPlanGeneratorProps {
  studentProfiles: StudentProfile[];
  selectedProfiles: Set<string>;
  onGenerate: (lessonPlan: Omit<LessonPlan, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => Promise<string>;
  onDownload: (lessonPlan: LessonPlan) => Promise<void>;
  onToggleProfile: (profileId: string) => void;
  onDeleteProfile?: (profileId: string) => void;
}

export function LessonPlanGenerator({ 
  studentProfiles, 
  selectedProfiles,
  onGenerate, 
  onDownload,
  onToggleProfile,
  onDeleteProfile
}: LessonPlanGeneratorProps) {
  const [formData, setFormData] = useState<LessonPlanFormData>({
    lessonSettings: {
      grade: '',
      subject: '',
      state: ''
    },
    calesCriteria: {
      canDoAttitude: true,
      interestAwareness: true,
      multiculturalNavigation: true,
      racialPride: true,
      selectiveTrust: true,
      socialJustice: true,
      holisticWellBeing: true,
      clarity: true,
      accessibility: true,
      credibility: true,
      outcomes: true
    },
    useRAG: false,
    outputFormat: 'pdf'
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [currentLessonPlan, setCurrentLessonPlan] = useState<LessonPlan | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [canRetry, setCanRetry] = useState(false);

  const getSelectedProfiles = () => {
    return studentProfiles.filter(p => selectedProfiles.has(p.id));
  };

  const generateLessonPlan = async (selectedProfilesList: StudentProfile[]) => {
    setIsGenerating(true);
    setGenerationError(null);

    try {
      // Create a comprehensive prompt for Claude
      const profilesText = selectedProfilesList.map(profile => 
        `Student: ${profile.name} (Grade ${profile.grade})\nStrengths: ${profile.strengths.join(', ')}\nInterests: ${profile.interests.join(', ')}`
      ).join('\n\n');

      const prompt = `Create a culturally responsive, differentiated lesson plan that aligns with ${formData.lessonSettings.state} state standards for ${formData.lessonSettings.grade} grade ${formData.lessonSettings.subject}.

Lesson Settings:
- Grade Level: ${formData.lessonSettings.grade}
- Subject: ${formData.lessonSettings.subject}
- State: ${formData.lessonSettings.state}

Student Profiles:
${profilesText}

Please provide a comprehensive, standards-aligned lesson plan with:
1. Title and subject
2. Grade level
3. Learning objectives that align with ${formData.lessonSettings.state} state standards for ${formData.lessonSettings.grade} grade ${formData.lessonSettings.subject}
4. Engaging activities that accommodate different learning styles and Black Genius Framework components
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
  "materials": ["Material 1", "Material 2"],
  "duration": "Estimated Duration",
  "assessment": "Assessment Method"
}`;

      // Convert Date objects to strings for JSON serialization
      const serializedProfiles = selectedProfilesList.map(profile => ({
        ...profile,
        createdAt: profile.createdAt.toISOString(),
        updatedAt: profile.updatedAt.toISOString()
      }));
      
      const requestBody = {
        prompt,
        studentProfiles: serializedProfiles,
        outputFormat: formData.outputFormat,
        lessonSettings: formData.lessonSettings
      };
      
      // Safe logging - avoid circular references
      console.log('Sending request to Netlify function:', {
        prompt: requestBody.prompt.substring(0, 200) + '...',
        studentProfilesCount: requestBody.studentProfiles.length,
        outputFormat: requestBody.outputFormat,
        lessonSettings: requestBody.lessonSettings
      });
      
      const response = await fetch('/.netlify/functions/generate-lesson-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Netlify function error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', parseError);
        throw new Error('Invalid response format from server');
      }
      
      if (result.error) {
        throw new Error(result.error);
      }

      // Validate and sanitize the result
      console.log('Received lesson plan result:', {
        title: result.title,
        subject: result.subject,
        grade: result.grade,
        objectivesCount: Array.isArray(result.objectives) ? result.objectives.length : 0,
        activitiesCount: Array.isArray(result.activities) ? result.activities.length : 0,
        materialsCount: Array.isArray(result.materials) ? result.materials.length : 0
      });

      const lessonPlan: LessonPlan = {
        id: '',
        userId: '',
        title: result.title || 'Generated Lesson Plan',
        subject: result.subject || formData.lessonSettings.subject,
        grade: result.grade || formData.lessonSettings.grade,
        duration: result.duration || '45 minutes',
        objectives: Array.isArray(result.objectives) ? result.objectives : [],
        standards: [],
        materials: Array.isArray(result.materials) ? result.materials : [],
        procedures: Array.isArray(result.activities) ? result.activities : [],
        assessment: result.assessment || 'Formative assessment through observation and student work',
        differentiation: [],
        culturalResponsiveness: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const lessonPlanId = await onGenerate(lessonPlan);
      lessonPlan.id = lessonPlanId;
      setCurrentLessonPlan(lessonPlan);
      
    } catch (error) {
      console.error('Error generating lesson plan:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate lesson plan';
      setGenerationError(errorMessage);
      setCanRetry(true);
      setRetryCount(prev => prev + 1);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const selectedProfilesList = getSelectedProfiles();
    
    if (selectedProfilesList.length === 0) {
      setGenerationError('Please select at least one student profile.');
      return;
    }
    
    if (!formData.lessonSettings.grade || !formData.lessonSettings.subject || !formData.lessonSettings.state) {
      setGenerationError('Please select grade level, subject, and state before generating a lesson plan.');
      return;
    }

    await generateLessonPlan(selectedProfilesList);
  };

  const handleRetry = () => {
    setGenerationError(null);
    setCanRetry(false);
    // Retry the generation without needing to recreate the form event
    const selectedProfilesList = getSelectedProfiles();
    if (selectedProfilesList.length > 0 && formData.lessonSettings.grade && formData.lessonSettings.subject && formData.lessonSettings.state) {
      generateLessonPlan(selectedProfilesList);
    }
  };



  const updateLessonSettings = (field: keyof LessonSettings, value: string) => {
    setFormData(prev => ({
      ...prev,
      lessonSettings: {
        ...prev.lessonSettings,
        [field]: value
      }
    }));
  };

  const updateCalesCriteria = (key: string, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      calesCriteria: {
        ...prev.calesCriteria,
        [key]: value
      }
    }));
  };

  const toggleAllCalesCriteria = (value: boolean) => {
    setFormData(prev => ({
      ...prev,
      calesCriteria: Object.keys(prev.calesCriteria).reduce((acc, key) => ({
        ...acc,
        [key]: value
      }), {} as Record<string, boolean>)
    }));
  };

  return (
    <div className="space-y-6">
      {/* Student Profiles */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Student Profiles</h3>
            <p className="text-sm text-gray-700">
              Select the student profiles you want to include in the lesson plan.
            </p>
          </div>
          <div className="text-sm text-gray-500">
            {selectedProfiles.size} of {studentProfiles.length} selected
          </div>
        </div>
        
        {studentProfiles.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No student profiles added yet.</p>
            <p className="text-sm">Use the "Add Student Profile" button above to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {studentProfiles.map(profile => (
              <div key={profile.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    <input
                      type="checkbox"
                      checked={selectedProfiles.has(profile.id)}
                      onChange={() => onToggleProfile(profile.id)}
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium text-gray-900">{profile.name}</h4>
                        <span className="text-sm text-gray-500">Grade {profile.grade}</span>
                        <span className="text-sm text-gray-500">Age {profile.age}</span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                        {profile.learningStyle && (
                          <div><span className="font-medium">Learning Style:</span> {profile.learningStyle}</div>
                        )}
                        {profile.strengths.length > 0 && (
                          <div><span className="font-medium">Black Genius Framework:</span> {profile.strengths.join(', ')}</div>
                        )}
                      </div>
                    </div>
                  </div>
                  {onDeleteProfile && (
                    <button
                      onClick={() => onDeleteProfile(profile.id)}
                      className="ml-2 p-1 text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete profile"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RAG Toggle */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-700">Enhanced AI Generation (Coming Soon)</h3>
            <p className="text-xs text-gray-600 mt-1">
              Use RAG (Retrieval-Augmented Generation) to enhance lesson plans with relevant educational context and best practices
            </p>
          </div>
          <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-300 cursor-not-allowed">
            <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-1" />
          </div>
        </div>
      </div>

      {/* Lesson Settings */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Lesson Settings</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Grade Level *
            </label>
            <select
              value={formData.lessonSettings.grade}
              onChange={(e) => updateLessonSettings('grade', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select Grade</option>
              {GRADE_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject *
            </label>
            <select
              value={formData.lessonSettings.subject}
              onChange={(e) => updateLessonSettings('subject', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select Subject</option>
              {SUBJECT_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              State *
            </label>
            <select
              value={formData.lessonSettings.state}
              onChange={(e) => updateLessonSettings('state', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select State</option>
              {STATE_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Output Format */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Output Format
          </label>
          <select
            value={formData.outputFormat}
            onChange={(e) => setFormData(prev => ({ ...prev, outputFormat: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {OUTPUT_FORMAT_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Generate Button */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {generationError && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-red-800">{generationError}</p>
                  {retryCount > 0 && (
                    <p className="mt-1 text-xs text-red-600">
                      Attempt {retryCount} of 3
                    </p>
                  )}
                </div>
                {canRetry && retryCount < 3 && (
                  <button
                    onClick={handleRetry}
                    className="bg-red-100 text-red-800 px-3 py-1 rounded-md text-sm hover:bg-red-200 transition-colors ml-4"
                  >
                    Retry
                  </button>
                )}
              </div>
            </div>
          )}
          
          <button
            type="submit"
            disabled={isGenerating}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating Lesson Plan...
              </>
            ) : (
              <>
                <BookOpen className="w-5 h-5" />
                Generate Lesson Plan
              </>
            )}
          </button>
        </form>
      </div>

      {/* Generated Lesson Plan Display */}
      {currentLessonPlan && (
        <LessonPlanDisplay 
          lessonPlan={currentLessonPlan} 
          onDownload={onDownload} 
        />
      )}
    </div>
  );
}
