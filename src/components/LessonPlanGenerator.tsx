"use client";
import React, { useState } from "react";
import { BookOpen, Loader2, Download, FileText } from "lucide-react";
import { CALES_CRITERIA_DESCRIPTIONS } from '@/lib/calesCriteria';
import { StudentProfile, LessonPlan } from '@/services/mongodb';

interface LessonPlanGeneratorProps {
  studentProfiles: StudentProfile[];
  onGenerate: (lessonPlan: Omit<LessonPlan, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => Promise<string>;
  onDownload: (lessonPlan: LessonPlan) => Promise<void>;
}

export function LessonPlanGenerator({ 
  studentProfiles, 
  onGenerate, 
  onDownload 
}: LessonPlanGeneratorProps) {
  const [formData, setFormData] = useState({
    grade: '3rd Grade',
    subject: 'Mathematics',
    calesCriteria: 'canDoAttitude',
    prompt: ''
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentLessonPlan, setCurrentLessonPlan] = useState<LessonPlan | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setGenerationError(null);

    try {
      // Create a comprehensive prompt for Claude
      const profilesText = studentProfiles.map(profile => 
        `Student: ${profile.name} (Grade ${profile.grade}, ${profile.subject})\nProfile: ${profile.profile}`
      ).join('\n\n');

      const prompt = `Create a culturally responsive, differentiated lesson plan for ${formData.grade} grade ${formData.subject}.

Lesson Settings:
- Grade Level: ${formData.grade}
- Subject: ${formData.subject}
- CALES Focus: ${formData.calesCriteria}

Student Profiles:
${profilesText}

Additional Requirements: ${formData.prompt || 'None specified'}

Please provide a comprehensive lesson plan with:
1. Title and subject
2. Grade level
3. Learning objectives that align with grade-level standards
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
          studentProfiles,
          outputFormat: 'pdf'
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
        studentProfiles: studentProfiles,
        calesCriteria: { [formData.calesCriteria]: true },
        content: '',
        prompt: formData.prompt
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

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <BookOpen className="w-5 h-5" />
        Generate Lesson Plan
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Grade Level
            </label>
            <input
              type="text"
              value={formData.grade}
              onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 3rd Grade"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject
            </label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Mathematics"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            CALES Criteria Focus
          </label>
          <select
            value={formData.calesCriteria}
            onChange={(e) => setFormData({ ...formData, calesCriteria: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Object.entries(CALES_CRITERIA_DESCRIPTIONS).map(([key, value]) => (
              <option key={key} value={key}>
                {value}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Additional Prompt (Optional)
          </label>
          <textarea
            value={formData.prompt}
            onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="Add any specific requirements or focus areas for this lesson plan..."
          />
        </div>

        {generationError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800 text-sm">{generationError}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isGenerating || studentProfiles.length === 0}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <BookOpen className="w-4 h-4" />
              Generate Lesson Plan
            </>
          )}
        </button>
      </form>

      {currentLessonPlan && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-green-800">
              <FileText className="w-5 h-5" />
              <span className="font-medium">Lesson Plan Generated Successfully!</span>
            </div>
            <button
              onClick={handleDownload}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </button>
          </div>
          
          <div className="mt-4 text-sm text-green-700">
            <p><strong>Title:</strong> {currentLessonPlan.title}</p>
            <p><strong>Duration:</strong> {currentLessonPlan.duration}</p>
            <p><strong>Objectives:</strong> {currentLessonPlan.objectives.length} learning objectives</p>
            <p><strong>Activities:</strong> {currentLessonPlan.activities.length} engaging activities</p>
          </div>
        </div>
      )}
    </div>
  );
}
