"use client";
import React, { useState } from "react";
import { MapPin, GraduationCap, Check } from "lucide-react";

interface ResourcePreferencesFormProps {
  onSubmit: (preferences: { grade: string; location: string }) => void;
  onSkip: () => void;
}

const GRADE_OPTIONS = [
  { value: "K", label: "Kindergarten" },
  { value: "1", label: "1st Grade" },
  { value: "2", label: "2nd Grade" },
  { value: "3", label: "3rd Grade" },
  { value: "4", label: "4th Grade" },
  { value: "5", label: "5th Grade" },
  { value: "6", label: "6th Grade" },
  { value: "7", label: "7th Grade" },
  { value: "8", label: "8th Grade" },
];

export default function ResourcePreferencesForm({ onSubmit, onSkip }: ResourcePreferencesFormProps) {
  const [grade, setGrade] = useState("");
  const [location, setLocation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grade || !location.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit({ grade, location: location.trim() });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = grade && location.trim().length > 0;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          🎯 Help us find the best resources for your child
        </h3>
        <p className="text-gray-600 text-sm">
          Tell us your child's grade and location so we can show you the most relevant local resources.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Grade Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <GraduationCap className="w-4 h-4 inline mr-1" />
            What grade is your child in?
          </label>
          <select
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="">Select grade...</option>
            {GRADE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Location Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <MapPin className="w-4 h-4 inline mr-1" />
            What's your location? (City, State)
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g., Atlanta, GA or Chicago, IL"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            This helps us find resources in your area
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={!isFormValid || isSubmitting}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Finding Resources...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Find My Resources
              </>
            )}
          </button>
          
          <button
            type="button"
            onClick={onSkip}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm underline"
          >
            Skip for now
          </button>
        </div>
      </form>

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-blue-800 text-xs">
          💡 <strong>Privacy note:</strong> We only use this information to find relevant resources. 
          Your location is not stored permanently.
        </p>
      </div>
    </div>
  );
}
