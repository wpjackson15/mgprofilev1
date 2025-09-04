"use client";
import React, { useState } from "react";
import { LessonPlanGenerator } from '@/components/LessonPlanGenerator';

export default function LessonPlansPage() {
  const [selectedProfiles, setSelectedProfiles] = useState<Set<string>>(new Set());
  const [studentProfiles, setStudentProfiles] = useState<any[]>([
    {
      id: 'sample-1',
      name: 'Alex Johnson',
      grade: '3',
      age: 8,
      learningStyle: 'Visual',
      interests: ['Math', 'Science', 'Art'],
      strengths: ['Problem-solving', 'Creativity', 'Teamwork'],
      challenges: ['Reading comprehension', 'Time management'],
      goals: ['Improve reading skills', 'Develop leadership'],
      culturalBackground: 'African American',
      languageNeeds: 'English',
      specialNeeds: 'None',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'sample-2',
      name: 'Maya Rodriguez',
      grade: '4',
      age: 9,
      learningStyle: 'Kinesthetic',
      interests: ['Science', 'Music', 'Outdoor activities'],
      strengths: ['Curiosity', 'Hands-on learning', 'Social skills'],
      challenges: ['Writing', 'Organization'],
      goals: ['Improve writing skills', 'Learn more about nature'],
      culturalBackground: 'Hispanic',
      languageNeeds: 'English',
      specialNeeds: 'None',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]);

  const handleToggleProfile = (profileId: string) => {
    const newSelected = new Set(selectedProfiles);
    if (newSelected.has(profileId)) {
      newSelected.delete(profileId);
    } else {
      newSelected.add(profileId);
    }
    setSelectedProfiles(newSelected);
  };

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
                          onToggleProfile={handleToggleProfile}
                        />
        </div>
      </div>
    </div>
  );
}
