"use client";
import React, { useRef } from "react";
import { Upload, X, Download } from "lucide-react";
import { useProfileUpload } from '@/hooks/useProfileUpload';
import { StudentProfile } from '@/services/mongodb';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (profiles: StudentProfile[]) => void;
}

export function UploadModal({ isOpen, onClose, onUpload }: UploadModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadProfiles, isUploading, uploadProgress, error, clearError, generateTemplate } = useProfileUpload();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const result = await uploadProfiles(files);
    
    if (result.success && result.profiles.length > 0) {
      onUpload(result.profiles);
      onClose();
    }
  };

  const handleDownloadTemplate = () => {
    const template = generateTemplate();
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student-profiles-template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Upload Student Profiles</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Upload PDF files to automatically extract student profiles using AI! Also supports CSV and TXT files with columns: Name, Grade, Subject, Profile.
          </p>
          
          {/* Progress Display */}
          {uploadProgress && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-900">Processing Files</span>
                <span className="text-sm text-blue-700">{uploadProgress.current}/{uploadProgress.total}</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                ></div>
              </div>
              <p className="text-sm text-blue-700 mt-2">{uploadProgress.message}</p>
            </div>
          )}
          
          <div className="flex gap-2 justify-center">
            <button
              onClick={handleDownloadTemplate}
              className="text-blue-600 hover:text-blue-800 text-sm underline"
            >
              Download CSV Template
            </button>
            <span className="text-gray-400">|</span>
            <a
              href="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit?usp=sharing"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 text-sm underline"
            >
              View Example
            </a>
          </div>
          
          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-700">{error}</p>
              <button
                onClick={clearError}
                className="text-red-600 hover:text-red-800 text-sm underline mt-2"
              >
                Clear Error
              </button>
            </div>
          )}
          
          {/* File Upload */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.csv,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex flex-col items-center space-y-2 w-full"
            >
              <Upload className="w-8 h-8 text-gray-400" />
              <span className="text-sm text-gray-600">
                {isUploading ? 'Processing...' : 'Click to upload files'}
              </span>
            </button>
          </div>
          
          <div className="text-xs text-gray-500 text-center">
            Supported formats: PDF, CSV, TXT. PDFs will be processed with AI to extract student information.
          </div>
        </div>
      </div>
    </div>
  );
}
