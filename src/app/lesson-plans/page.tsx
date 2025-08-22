"use client";
import React from "react";

export default function LessonPlansPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Lesson Plans</h1>
          <p className="text-gray-600">Generate personalized lesson plans for your students</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Coming Soon</h2>
            <p className="text-gray-600 mb-6">
              The lesson plans feature is being updated. Please check back soon!
            </p>
            <a 
              href="/chatbot" 
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Chatbot
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
