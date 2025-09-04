"use client";
import React, { useState } from "react";
import { LessonPlanGenerator } from '@/components/LessonPlanGenerator';
import { ProfileUploadModal } from '@/components/ProfileUploadModal';
import { StudentProfile } from '@/services/mongodb';
import { Plus, Trash2, ArrowLeft } from "lucide-react";

export default function LessonPlansPage() {
  const [selectedProfiles, setSelectedProfiles] = useState<Set<string>>(new Set());
  const [studentProfiles, setStudentProfiles] = useState<StudentProfile[]>([
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

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const handleToggleProfile = (profileId: string) => {
    const newSelected = new Set(selectedProfiles);
    if (newSelected.has(profileId)) {
      newSelected.delete(profileId);
    } else {
      newSelected.add(profileId);
    }
    setSelectedProfiles(newSelected);
  };

  const handleAddProfile = (newProfile: Omit<StudentProfile, 'id' | 'createdAt' | 'updatedAt'>) => {
    const profileWithId: StudentProfile = {
      ...newProfile,
      id: `profile-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setStudentProfiles(prev => [...prev, profileWithId]);
  };

  const handleDeleteProfile = (profileId: string) => {
    setStudentProfiles(prev => prev.filter(p => p.id !== profileId));
    setSelectedProfiles(prev => {
      const newSelected = new Set(prev);
      newSelected.delete(profileId);
      return newSelected;
    });
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
        {/* Back to Main Page Button */}
        <div className="mb-6">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Main Page</span>
          </a>
        </div>

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Lesson Plan Generator</h1>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Student Profile
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <LessonPlanGenerator
            studentProfiles={studentProfiles}
            selectedProfiles={selectedProfiles}
            onGenerate={handleGenerateLessonPlan}
            onDownload={handleDownloadLessonPlan}
            onToggleProfile={handleToggleProfile}
            onDeleteProfile={handleDeleteProfile}
          />
        </div>

        <ProfileUploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          onAddProfile={handleAddProfile}
        />
      </div>
    </div>
  );
}
