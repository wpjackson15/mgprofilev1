import React from 'react';
import { User, CheckCircle, AlertCircle, Edit, Trash2 } from 'lucide-react';
import { StudentProfile } from '@/services/firestore';
import { ProfileUploadService } from '@/services/profileUpload';

interface ProfilePreviewProps {
  profiles: StudentProfile[];
  onEdit?: (profile: StudentProfile) => void;
  onDelete?: (id: string) => void;
  showValidation?: boolean;
  selectedProfiles?: Set<string>;
  onProfileSelect?: (profileId: string) => void;
  showSelection?: boolean;
}

export function ProfilePreview({ profiles, onEdit, onDelete, showValidation = true, selectedProfiles, onProfileSelect, showSelection = false }: ProfilePreviewProps) {
  const getValidationStatus = (profile: StudentProfile) => {
    const validation = ProfileUploadService.validateProfile(profile);
    return {
      isValid: validation.isValid,
      errors: validation.errors,
      hasWarnings: profile.name === 'Unknown' || profile.grade === 'Unknown' || profile.subject === 'Unknown'
    };
  };

  if (profiles.length === 0) {
    return (
      <div className="text-center py-8">
        <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">No profiles to preview</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {profiles.map((profile) => {
        const validation = getValidationStatus(profile);
        
        return (
          <div 
            key={profile.id} 
            className={`border rounded-lg p-4 ${
              validation.isValid 
                ? 'border-green-200 bg-green-50' 
                : 'border-red-200 bg-red-50'
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  {showSelection && onProfileSelect && (
                    <input
                      type="checkbox"
                      checked={selectedProfiles?.has(profile.id) || false}
                      onChange={() => onProfileSelect(profile.id)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                  )}
                  <User className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-800">{profile.name}</h3>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded">
                    Grade {profile.grade}
                  </span>
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 text-sm rounded">
                    {profile.subject}
                  </span>
                  {validation.isValid && (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  )}
                  {!validation.isValid && (
                    <AlertCircle className="w-4 h-4 text-red-600" />
                  )}
                  {validation.hasWarnings && (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                      Needs Review
                    </span>
                  )}
                </div>
                
                <p className="text-gray-600 text-sm mb-2">{profile.profile}</p>
                
                {showValidation && !validation.isValid && (
                  <div className="mt-2">
                    <p className="text-red-600 text-sm font-medium mb-1">Validation Errors:</p>
                    <ul className="text-red-600 text-sm space-y-1">
                      {validation.errors.map((error, index) => (
                        <li key={index} className="flex items-center gap-1">
                          <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                          {error}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {showValidation && validation.hasWarnings && (
                  <div className="mt-2">
                    <p className="text-yellow-600 text-sm font-medium mb-1">Warnings:</p>
                    <ul className="text-yellow-600 text-sm space-y-1">
                      {profile.name === 'Unknown' && (
                        <li className="flex items-center gap-1">
                          <span className="w-1 h-1 bg-yellow-600 rounded-full"></span>
                          Student name is set to &quot;Unknown&quot;
                        </li>
                      )}
                      {profile.grade === 'Unknown' && (
                        <li className="flex items-center gap-1">
                          <span className="w-1 h-1 bg-yellow-600 rounded-full"></span>
                          Grade level is set to &quot;Unknown&quot;
                        </li>
                      )}
                      {profile.subject === 'Unknown' && (
                        <li className="flex items-center gap-1">
                          <span className="w-1 h-1 bg-yellow-600 rounded-full"></span>
                          Subject is set to &quot;Unknown&quot;
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2 ml-4">
                {onEdit && (
                  <button
                    onClick={() => onEdit(profile)}
                    className="text-blue-600 hover:text-blue-800 p-1"
                    title="Edit profile"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => onDelete(profile.id)}
                    className="text-red-600 hover:text-red-800 p-1"
                    title="Delete profile"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
      
      {showValidation && (
        <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              Valid profiles: {profiles.filter(p => getValidationStatus(p).isValid).length} / {profiles.length}
            </span>
            <span className="text-gray-600">
              Created: {new Date().toLocaleDateString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
} 