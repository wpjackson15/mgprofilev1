"use client";
import React, { useState } from "react";
import { Upload, Plus, Users, BookOpen } from "lucide-react";

export default function LessonPlansPage() {
  const [studentProfiles, setStudentProfiles] = useState<any[]>([]);
  const [lessonPlan, setLessonPlan] = useState<any>(null);

  const handleUploadFiles = () => {
    // TODO: Implement file upload functionality
    console.log("Upload files clicked");
  };

  const handleManualEntry = () => {
    // TODO: Implement manual entry functionality
    console.log("Manual entry clicked");
  };

  const handleGenerateLessonPlan = () => {
    // TODO: Implement lesson plan generation with LLM
    console.log("Generate lesson plan clicked");
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">My Genius Lesson Plans</h1>
          <p className="text-gray-600">Create culturally responsive, differentiated lessons based on student profiles</p>
        </div>

        {/* Student Profiles Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Student Profiles</h2>
            <div className="flex gap-3">
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

          {/* TODO: Add student profiles list when profiles are added */}
        </div>

        {/* Generated Lesson Plan Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Generated Lesson Plan</h2>
            {studentProfiles.length > 0 && (
              <button
                onClick={handleGenerateLessonPlan}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Generate Lesson Plan
              </button>
            )}
          </div>

          {/* Empty State */}
          {!lessonPlan && (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-2">Ready to Generate</p>
              <p className="text-gray-400">
                {studentProfiles.length === 0 
                  ? "Add student profiles and click 'Generate Lesson Plan' to create culturally responsive, differentiated lessons."
                  : "Click 'Generate Lesson Plan' to create culturally responsive, differentiated lessons."
                }
              </p>
            </div>
          )}

          {/* TODO: Add lesson plan display when generated */}
        </div>
      </div>
    </main>
  );
} 