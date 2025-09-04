"use client";
import React, { useState } from "react";
import { BookOpen, Loader2, Download, FileText } from "lucide-react";
import { CALES_CRITERIA_DESCRIPTIONS } from '@/lib/calesCriteria';
import { GRADE_OPTIONS, SUBJECT_OPTIONS, STATE_OPTIONS, OUTPUT_FORMAT_OPTIONS, type LessonSettings, type LessonPlanFormData } from '@/lib/lessonPlanConstants';
import { StudentProfile, LessonPlan } from '@/services/mongodb';

interface LessonPlanGeneratorProps {
  studentProfiles: StudentProfile[];
  selectedProfiles: Set<string>;
  onGenerate: (lessonPlan: Omit<LessonPlan, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => Promise<string>;
  onDownload: (lessonPlan: LessonPlan) => Promise<void>;
}

export function LessonPlanGenerator({ 
  studentProfiles, 
  selectedProfiles,
  onGenerate, 
  onDownload 
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
        `Student: ${profile.name} (Grade ${profile.grade}, ${profile.subject})\nProfile: ${profile.profile}`
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
  "assessment": "Assessment description",
  "materials": ["Material 1", "Material 2"],
  "duration": "45 minutes"
}`;

      // Call the working Netlify function
      const response = await fetch('/.netlify/functions/generate-lesson-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt, 
          studentProfiles: selectedProfilesList,
          outputFormat: formData.outputFormat,
          lessonSettings: formData.lessonSettings,
          calesCriteria: formData.calesCriteria,
          useRAG: formData.useRAG
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate lesson plan');
      }

      const data = await response.json();
      
      // Create the lesson plan object
      const newLessonPlan: Omit<LessonPlan, 'id' | 'createdAt' | 'updatedAt' | 'userId'> = {
        title: data.title,
        subject: data.subject,
        grade: data.grade,
        objectives: data.objectives,
        activities: data.activities,
        assessment: data.assessment,
        materials: data.materials,
        duration: data.duration,
        studentProfiles: selectedProfilesList,
        lessonSettings: formData.lessonSettings,
        outputFormat: formData.outputFormat,
        googleDocUrl: data.googleDocUrl,
        calesCriteria: formData.calesCriteria,
        content: '',
        prompt: prompt
      };

      const lessonPlanId = await onGenerate(newLessonPlan);
      
      // Create the full lesson plan object
      const savedLessonPlan: LessonPlan = {
        id: lessonPlanId,
        ...newLessonPlan,
        userId: '', // Will be set by the parent
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      setCurrentLessonPlan(savedLessonPlan);
    } catch (error) {
      console.error('Error generating lesson plan:', error);
      setGenerationError('Failed to generate lesson plan. Please try again.');
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

  const updateCalesCriteria = (field: string, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      calesCriteria: {
        ...prev.calesCriteria,
        [field]: value
      }
    }));
  };

  const toggleAllCalesCriteria = (value: boolean) => {
    const newCriteria = Object.keys(formData.calesCriteria).reduce((acc, key) => {
      acc[key] = value;
      return acc;
    }, {} as Record<string, boolean>);
    
    setFormData(prev => ({
      ...prev,
      calesCriteria: newCriteria
    }));
  };

  return (
    <div className="space-y-6">
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

      {/* CALES Criteria */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">CALES Framework Criteria</h3>
          <div className="flex gap-2">
            <button
              onClick={() => toggleAllCalesCriteria(true)}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Select All
            </button>
            <span className="text-gray-400">|</span>
            <button
              onClick={() => toggleAllCalesCriteria(false)}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Clear All
            </button>
          </div>
        </div>
        
        <p className="text-gray-600 mb-4">
          Select the CALES (Culturally Affirming Learning Environment) criteria to include in your lesson plan generation.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(CALES_CRITERIA_DESCRIPTIONS).map(([key, description]) => (
            <div key={key} className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
              <button
                onClick={() => updateCalesCriteria(key, !formData.calesCriteria[key])}
                className="mt-1"
              >
                {formData.calesCriteria[key] ? (
                  <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center">
                    <div className="w-3 h-3 bg-white rounded-sm" />
                  </div>
                ) : (
                  <div className="w-5 h-5 border-2 border-gray-300 rounded" />
                )}
              </button>
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-900 cursor-pointer">
                  {description}
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Generate Button */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <button
          onClick={handleSubmit}
          disabled={isGenerating || !formData.lessonSettings.grade || !formData.lessonSettings.subject || !formData.lessonSettings.state || selectedProfiles.size === 0}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

        {generationError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800 text-sm">{generationError}</p>
          </div>
        )}
      </div>

      {/* Generated Lesson Plan */}
      {currentLessonPlan && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-green-800">
              <FileText className="w-5 h-5" />
              <span className="font-medium">Lesson Plan Generated Successfully!</span>
            </div>
            <button
              onClick={handleDownload}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download {currentLessonPlan.outputFormat === 'pdf' ? 'PDF' : 'Google Doc'}
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-green-700">
            <div>
              <p><strong>Title:</strong> {currentLessonPlan.title}</p>
              <p><strong>Grade:</strong> {currentLessonPlan.grade}</p>
              <p><strong>Subject:</strong> {currentLessonPlan.subject}</p>
              <p><strong>State:</strong> {currentLessonPlan.lessonSettings.state}</p>
            </div>
            <div>
              <p><strong>Duration:</strong> {currentLessonPlan.duration}</p>
              <p><strong>Objectives:</strong> {currentLessonPlan.objectives.length} learning objectives</p>
              <p><strong>Activities:</strong> {currentLessonPlan.activities.length} engaging activities</p>
              <p><strong>Format:</strong> {currentLessonPlan.outputFormat === 'pdf' ? 'PDF' : 'Google Doc'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
