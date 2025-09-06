"use client";
import React, { useState } from "react";
import { X, Upload, Plus, User } from "lucide-react";
import { StudentProfile } from "@/services/mongodb";

interface ProfileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProfile: (profile: Omit<StudentProfile, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

export function ProfileUploadModal({ isOpen, onClose, onAddProfile }: ProfileUploadModalProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'manual'>('upload');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Manual entry form state
  const [manualForm, setManualForm] = useState({
    name: '',
    grade: '',
    age: '',
    canDoAttitude: '',
    interestAwareness: '',
    multiculturalNavigation: '',
    racialPride: '',
    selectiveTrust: '',
    socialJustice: ''
  });

  // File upload state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!manualForm.name || !manualForm.grade || !manualForm.age) {
      setError('Name, grade, and age are required fields.');
      return;
    }

    const newProfile: Omit<StudentProfile, 'id' | 'createdAt' | 'updatedAt'> = {
      name: manualForm.name,
      grade: manualForm.grade,
      age: parseInt(manualForm.age),
      learningStyle: 'Not specified', // This field is removed from manualForm
      interests: [],
      strengths: [],
      challenges: [],
      goals: [],
      culturalBackground: undefined,
      languageNeeds: undefined,
      specialNeeds: undefined
    };

    // Store Black Genius Framework components in the strengths field
    const blackGeniusComponents = [
      manualForm.canDoAttitude && `Can-Do Attitude: ${manualForm.canDoAttitude}`,
      manualForm.interestAwareness && `Interest Awareness: ${manualForm.interestAwareness}`,
      manualForm.multiculturalNavigation && `Multicultural Navigation: ${manualForm.multiculturalNavigation}`,
      manualForm.racialPride && `Racial Pride: ${manualForm.racialPride}`,
      manualForm.selectiveTrust && `Selective Trust: ${manualForm.selectiveTrust}`,
      manualForm.socialJustice && `Social Justice: ${manualForm.socialJustice}`
    ].filter(Boolean);

    if (blackGeniusComponents.length > 0) {
      newProfile.strengths = blackGeniusComponents;
    }

    onAddProfile(newProfile);
    onClose();
    resetForm();
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadedFile) {
      setError('Please select a file to upload.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);

      const response = await fetch('/.netlify/functions/parse-pdf-profiles', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }

      if (result.profiles && result.profiles.length > 0) {
        // Add each parsed profile
        result.profiles.forEach((profile: any) => {
          onAddProfile(profile);
        });
        onClose();
        resetForm();
      } else {
        setError('No profiles found in the uploaded file.');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setError(error instanceof Error ? error.message : 'Failed to process file');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setManualForm({
      name: '',
      grade: '',
      age: '',
      canDoAttitude: '',
      interestAwareness: '',
      multiculturalNavigation: '',
      racialPride: '',
      selectiveTrust: '',
      socialJustice: ''
    });
    setUploadedFile(null);
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Add Student Profile</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'upload'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Upload className="w-4 h-4 inline mr-2" />
            Upload File
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'manual'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <User className="w-4 h-4 inline mr-2" />
            Manual Entry
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {activeTab === 'upload' && (
            <form onSubmit={handleFileUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Student Profile Document
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => setUploadedFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-600">
                      <span className="font-medium text-blue-600 hover:text-blue-500">
                        Click to upload
                      </span>{' '}
                      or drag and drop
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PDF, DOC, or DOCX files accepted
                    </p>
                  </label>
                </div>
                {uploadedFile && (
                  <p className="mt-2 text-sm text-gray-600">
                    Selected: {uploadedFile.name}
                  </p>
                )}
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!uploadedFile || isProcessing}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Upload & Parse
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'manual' && (
            <form onSubmit={handleManualSubmit} className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Student Name *
                </label>
                <input
                  type="text"
                  value={manualForm.name}
                  onChange={(e) => setManualForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Grade Level *
                </label>
                <select
                  value={manualForm.grade}
                  onChange={(e) => setManualForm(prev => ({ ...prev, grade: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Grade</option>
                  <option value="K">Kindergarten</option>
                  <option value="1">1st Grade</option>
                  <option value="2">2nd Grade</option>
                  <option value="3">3rd Grade</option>
                  <option value="4">4th Grade</option>
                  <option value="5">5th Grade</option>
                  <option value="6">6th Grade</option>
                  <option value="7">7th Grade</option>
                  <option value="8">8th Grade</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Age *
                </label>
                <input
                  type="number"
                  min="4"
                  max="15"
                  value={manualForm.age}
                  onChange={(e) => setManualForm(prev => ({ ...prev, age: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

              

              {/* Black Genius Framework Components */}
              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Black Genius Framework Components</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Describe how this student demonstrates each component of the Black Genius Framework.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Can-Do Attitude
                    </label>
                    <input
                      type="text"
                      value={manualForm.canDoAttitude}
                      onChange={(e) => setManualForm(prev => ({ ...prev, canDoAttitude: e.target.value }))}
                      placeholder="e.g., Positive, Resilient, Empowered"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Interest Awareness
                    </label>
                    <input
                      type="text"
                      value={manualForm.interestAwareness}
                      onChange={(e) => setManualForm(prev => ({ ...prev, interestAwareness: e.target.value }))}
                      placeholder="e.g., Curious, Passionate, Engaged"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Multicultural Navigation
                    </label>
                    <input
                      type="text"
                      value={manualForm.multiculturalNavigation}
                      onChange={(e) => setManualForm(prev => ({ ...prev, multiculturalNavigation: e.target.value }))}
                      placeholder="e.g., Understanding, Appreciating, Engaging"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Racial Pride
                    </label>
                    <input
                      type="text"
                      value={manualForm.racialPride}
                      onChange={(e) => setManualForm(prev => ({ ...prev, racialPride: e.target.value }))}
                      placeholder="e.g., Proud, Respected, Valued"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Selective Trust
                    </label>
                    <input
                      type="text"
                      value={manualForm.selectiveTrust}
                      onChange={(e) => setManualForm(prev => ({ ...prev, selectiveTrust: e.target.value }))}
                      placeholder="e.g., Confident, Secure, Protected"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Social Justice
                    </label>
                    <input
                      type="text"
                      value={manualForm.socialJustice}
                      onChange={(e) => setManualForm(prev => ({ ...prev, socialJustice: e.target.value }))}
                      placeholder="e.g., Inclusive, Equitable, Fair"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Profile
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
