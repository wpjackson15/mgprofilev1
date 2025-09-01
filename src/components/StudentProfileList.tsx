"use client";
import React from "react";
import { Users, Edit, Trash2, CheckSquare, Square } from "lucide-react";
import { StudentProfile } from '@/services/mongodb';

interface StudentProfileListProps {
  profiles: StudentProfile[];
  selectedProfiles: Set<string>;
  onToggleProfile: (profileId: string) => void;
  onEditProfile: (profile: StudentProfile) => void;
  onDeleteProfile: (profileId: string) => void;
}

export function StudentProfileList({ 
  profiles, 
  selectedProfiles, 
  onToggleProfile, 
  onEditProfile, 
  onDeleteProfile 
}: StudentProfileListProps) {
  if (profiles.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p>No student profiles yet. Add some to get started!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {profiles.map((profile) => (
        <div
          key={profile.id}
          className={`border rounded-lg p-4 transition-all ${
            selectedProfiles.has(profile.id)
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-start gap-3">
            <button
              onClick={() => onToggleProfile(profile.id)}
              className="mt-1 text-blue-600 hover:text-blue-800"
            >
              {selectedProfiles.has(profile.id) ? (
                <CheckSquare className="w-5 h-5" />
              ) : (
                <Square className="w-5 h-5" />
              )}
            </button>
            
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">{profile.name}</h4>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>{profile.grade}</span>
                  <span>•</span>
                  <span>{profile.subject}</span>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 line-clamp-2">
                {profile.profile}
              </p>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => onEditProfile(profile)}
                className="p-1 text-gray-400 hover:text-gray-600"
                title="Edit profile"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDeleteProfile(profile.id)}
                className="p-1 text-red-400 hover:text-red-600"
                title="Delete profile"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
