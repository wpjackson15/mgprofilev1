import { useState, useCallback } from 'react';
import { StudentProfile } from '@/services/firestore';
import { ProfileUploadService, UploadResult } from '@/services/profileUpload';

export function useProfileUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    current: number;
    total: number;
    message: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const uploadProfiles = useCallback(async (files: FileList): Promise<UploadResult> => {
    setIsUploading(true);
    setError(null);
    setUploadProgress({ current: 0, total: files.length, message: 'Starting upload...' });

    try {
      const result = await ProfileUploadService.processFiles(files);
      
      if (result.success) {
        setUploadProgress({
          current: result.totalProcessed,
          total: result.totalProcessed,
          message: `Successfully processed ${result.totalValid} profiles from ${result.totalProcessed} files`
        });
      } else {
        setError(result.error || 'Upload failed');
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      return {
        success: false,
        profiles: [],
        error: errorMessage,
        totalProcessed: 0,
        totalValid: 0
      };
    } finally {
      setIsUploading(false);
      // Clear progress after a delay
      setTimeout(() => setUploadProgress(null), 3000);
    }
  }, []);

  const validateProfile = useCallback((profile: Partial<StudentProfile>) => {
    return ProfileUploadService.validateProfile(profile);
  }, []);

  const generateTemplate = useCallback(() => {
    return ProfileUploadService.generateCSVTemplate();
  }, []);

  const exportProfiles = useCallback((profiles: StudentProfile[]) => {
    return ProfileUploadService.exportToCSV(profiles);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    isUploading,
    uploadProgress,
    error,
    
    // Actions
    uploadProfiles,
    validateProfile,
    generateTemplate,
    exportProfiles,
    clearError,
  };
} 