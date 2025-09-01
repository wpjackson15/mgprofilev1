"use client";
import React, { useState } from "react";
import { BookOpen, Loader2, Download, FileText } from "lucide-react";
import { CALESCriteria, CALES_FORM_FIELDS } from '@/lib/calesCriteria';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);

    try {
      const newLessonPlan: Omit<LessonPlan, 'id' | 'createdAt' | 'updatedAt' | 'userId'> = {
        title: `Lesson Plan - ${formData.subject} - ${formData.grade}`,
        grade: formData.grade,
        subject: formData.subject,
        calesCriteria: formData.calesCriteria,
        prompt: formData.prompt,
        studentProfiles: studentProfiles,
        content: '',
        assessment: '',
        materials: '',
        objectives: '',
        activities: []
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
            CALES Criteria
          </label>
          <select
            value={formData.calesCriteria}
            onChange={(e) => setFormData({ ...formData, calesCriteria: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Object.entries(CALESCriteria).map(([key, value]) => (
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
        </div>
      )}
    </div>
  );
}
