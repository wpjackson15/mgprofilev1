"use client";
import React, { useState } from "react";
import { LessonPlanGenerator } from '@/components/LessonPlanGenerator';

export default function LessonPlansPage() {
  const [selectedProfiles] = useState<Set<string>>(new Set());
  const [studentProfiles] = useState<any[]>([]);

  const handleGenerateLessonPlan = async (lessonPlan: any): Promise<string> => {
    console.log('Generating lesson plan:', lessonPlan);
    return 'test-id';
  };

  const handleDownloadLessonPlan = async (lessonPlan: any): Promise<void> => {
    console.log('Downloading lesson plan:', lessonPlan);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Lesson Plan Generator</h1>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <LessonPlanGenerator
            studentProfiles={studentProfiles}
            selectedProfiles={selectedProfiles}
            onGenerate={handleGenerateLessonPlan}
            onDownload={handleDownloadLessonPlan}
          />
        </div>
      </div>
    </div>
  );
}
