"use client";
import React, { useState } from "react";
import { BookOpen, Loader2, Download, FileText } from "lucide-react";
import { GRADE_OPTIONS, SUBJECT_OPTIONS, STATE_OPTIONS, OUTPUT_FORMAT_OPTIONS, type LessonSettings, type LessonPlanFormData } from '@/lib/lessonPlanConstants';
import { StudentProfile, LessonPlan } from '@/services/mongodb';

interface LessonPlanGeneratorProps {
  studentProfiles: StudentProfile[];
  selectedProfiles: Set<string>;
  onGenerate: (lessonPlan: Omit<LessonPlan, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => Promise<string>;
  onDownload: (lessonPlan: LessonPlan) => Promise<void>;
  onToggleProfile: (profileId: string) => void;
}

export function LessonPlanGenerator({ 
  studentProfiles, 
  selectedProfiles,
  onGenerate, 
  onDownload,
  onToggleProfile
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
    useRAG: true,
    outputFormat: 'pdf'
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [currentLessonPlan, setCurrentLessonPlan] = useState<LessonPlan | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const getSelectedProfiles = () => {
    return studentProfiles.filter(p => selectedProfiles.has(p.id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setGenerationError(null);

    try {
      const selectedProfilesList = getSelectedProfiles();
      
      if (selectedProfilesList.length === 0) {
        setGenerationError('Please select at least one student profile.');
        return;
      }
      
      if (!formData.lessonSettings.grade || !formData.lessonSettings.subject || !formData.lessonSettings.state) {
        setGenerationError('Please select grade level, subject, and state before generating a lesson plan.');
        return;
      }

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
  "materials": ["Material 1", "Material 2"],
  "duration": "Estimated Duration",
  "assessment": "Assessment Method"
}`;

      const response = await fetch('/.netlify/functions/generate-lesson-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          useRAG: formData.useRAG,
          outputFormat: formData.outputFormat
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }

      const lessonPlan: LessonPlan = {
        id: '',
        userId: '',
        title: result.title || 'Generated Lesson Plan',
        subject: result.subject || formData.lessonSettings.subject,
        grade: result.grade || formData.lessonSettings.grade,
        duration: result.duration || '45 minutes',
        objectives: result.objectives || [],
        standards: [],
        materials: result.materials || [],
        procedures: result.activities || [],
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
      setGenerationError(error instanceof Error ? error.message : 'Failed to generate lesson plan');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (currentLessonPlan) {
      await onDownload(currentLessonPlan);
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
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Student Profiles</h3>
        <p className="text-sm text-gray-700 mb-4">
          Select the student profiles you want to include in the lesson plan.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {studentProfiles.map(profile => (
            <div key={profile.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
              <div className="flex items-center">
                                  <input
                    type="checkbox"
                    checked={selectedProfiles.has(profile.id)}
                    onChange={() => onToggleProfile(profile.id)}
                    className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                <span className="text-sm font-medium text-gray-900">{profile.name}</span>
              </div>
              <span className="text-sm text-gray-600">Grade {profile.grade}</span>
            </div>
          ))}
        </div>
      </div>

      {/* RAG Toggle */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-blue-900">Enhanced AI Generation</h3>
            <p className="text-xs text-blue-700 mt-1">
              Use RAG (Retrieval-Augmented Generation) to enhance lesson plans with relevant educational context and best practices
            </p>
          </div>
          <button
            onClick={() => setFormData(prev => ({ ...prev, useRAG: !prev.useRAG }))}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              formData.useRAG ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                formData.useRAG ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
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
              <p className="text-sm text-red-800">{generationError}</p>
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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Generated Lesson Plan</h3>
            <button
              onClick={handleDownload}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900">{currentLessonPlan.title}</h4>
              <p className="text-sm text-gray-600">
                {currentLessonPlan.subject} • Grade {currentLessonPlan.grade} • {currentLessonPlan.duration}
              </p>
            </div>
            
            {currentLessonPlan.objectives.length > 0 && (
              <div>
                <h5 className="font-medium text-gray-900 mb-2">Learning Objectives</h5>
                <ul className="list-disc list-inside space-y-1">
                  {currentLessonPlan.objectives.map((objective, index) => (
                    <li key={index} className="text-sm text-gray-700">{objective}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {currentLessonPlan.procedures.length > 0 && (
              <div>
                <h5 className="font-medium text-gray-900 mb-2">Activities</h5>
                <ul className="list-disc list-inside space-y-1">
                  {currentLessonPlan.procedures.map((activity, index) => (
                    <li key={index} className="text-sm text-gray-700">{activity}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {currentLessonPlan.materials.length > 0 && (
              <div>
                <h5 className="font-medium text-gray-900 mb-2">Materials</h5>
                <ul className="list-disc list-inside space-y-1">
                  {currentLessonPlan.materials.map((material, index) => (
                    <li key={index} className="text-sm text-gray-700">{material}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {currentLessonPlan.assessment && (
              <div>
                <h5 className="font-medium text-gray-900 mb-2">Assessment</h5>
                <p className="text-sm text-gray-700">
                  {Array.isArray(currentLessonPlan.assessment) 
                    ? currentLessonPlan.assessment.join(', ')
                    : typeof currentLessonPlan.assessment === 'string'
                    ? currentLessonPlan.assessment
                    : 'Assessment details available'
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
