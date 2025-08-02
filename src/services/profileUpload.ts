import { StudentProfile } from './firestore';
import { FileUploadService, UploadedFile } from './fileUpload';

export interface UploadedProfile {
  name?: string;
  grade?: string;
  subject?: string;
  profile?: string;
}

export interface UploadResult {
  success: boolean;
  profiles: StudentProfile[];
  error?: string;
  totalProcessed: number;
  totalValid: number;
  uploadedFiles?: UploadedFile[];
}

export class ProfileUploadService {
  /**
   * Process uploaded files and extract student profiles
   */
  static async processFiles(files: FileList, userId?: string): Promise<UploadResult> {
    const profiles: StudentProfile[] = [];
    const uploadedFiles: UploadedFile[] = [];
    let totalProcessed = 0;
    let totalValid = 0;

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        totalProcessed++;

        if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
          // Only upload, do not process
          const uploadResult = await FileUploadService.uploadFile(file, userId!, 'pdf');
          if (uploadResult.success && uploadResult.file) {
            uploadedFiles.push(uploadResult.file);
          }
        } else if (file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv')) {
          const result = await this.processCSVFile(file, i);
          profiles.push(...result.profiles);
          totalValid += result.profiles.length;
        } else if (file.type === 'text/plain' || file.name.toLowerCase().endsWith('.txt')) {
          const result = await this.processTextFile(file, i);
          profiles.push(...result.profiles);
          totalValid += result.profiles.length;
        } else {
          console.warn(`Unsupported file type: ${file.type} for file: ${file.name}`);
        }
      }

      return {
        success: true,
        profiles,
        totalProcessed,
        totalValid,
        uploadedFiles: uploadedFiles.length > 0 ? uploadedFiles : undefined
      };
    } catch (error) {
      return {
        success: false,
        profiles: [],
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        totalProcessed,
        totalValid
      };
    }
  }

  /**
   * Process PDF files using Firebase Storage and AI extraction
   */
  private static async processPDFFile(file: File, fileIndex: number, userId?: string): Promise<{ profiles: StudentProfile[], uploadedFile?: UploadedFile }> {
    // Check file size (10MB limit for API)
    if (file.size > 10 * 1024 * 1024) {
      throw new Error(`PDF file "${file.name}" is too large. Please use a file smaller than 10MB.`);
    }

    if (!userId) {
      throw new Error('User ID is required for PDF processing');
    }

    // Upload file to Firebase Storage first
    const uploadResult = await FileUploadService.uploadFile(file, userId, 'pdf');
    if (!uploadResult.success || !uploadResult.file) {
      throw new Error(`Failed to upload PDF "${file.name}": ${uploadResult.error}`);
    }

    // Update file status to processing
    await FileUploadService.updateFileStatus(uploadResult.file.id, 'processing');

    try {
      // Process the PDF using the new storage-based function
      const response = await fetch('/.netlify/functions/process-pdf-from-storage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileUrl: uploadResult.file.fileUrl,
          fileId: uploadResult.file.id
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Failed to process PDF "${file.name}": ${response.status}`;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage += ` - ${errorData.error || errorData.details || errorText}`;
        } catch {
          errorMessage += ` - ${errorText}`;
        }
        
        // Update file status to error
        await FileUploadService.updateFileStatus(uploadResult.file.id, 'error', errorMessage);
        throw new Error(errorMessage);
      }

      const data = await response.json();
      const extractedProfiles = data.profiles || [];

      if (extractedProfiles.length === 0) {
        // Update file status to processed (even if no profiles found)
        await FileUploadService.updateFileStatus(uploadResult.file.id, 'processed');
        throw new Error(`No student profiles found in PDF "${file.name}"`);
      }

      // Update file status to processed
      await FileUploadService.updateFileStatus(uploadResult.file.id, 'processed');

      // Convert to StudentProfile format
      const profiles: StudentProfile[] = extractedProfiles.map((profile: UploadedProfile, index: number) => ({
        id: `pdf-${Date.now()}-${fileIndex}-${index}`,
        name: profile.name || 'Unknown Student',
        grade: profile.grade || 'Unknown Grade',
        subject: profile.subject || 'Unknown Subject',
        profile: profile.profile || 'No profile provided',
        createdAt: new Date().toISOString()
      }));

      return { profiles, uploadedFile: uploadResult.file };
    } catch (error) {
      // Update file status to error if not already set
      await FileUploadService.updateFileStatus(uploadResult.file.id, 'error', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  /**
   * Process CSV files
   */
  private static async processCSVFile(file: File, fileIndex: number): Promise<{ profiles: StudentProfile[] }> {
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      throw new Error(`CSV file "${file.name}" must have at least a header row and one data row`);
    }

    const profiles: StudentProfile[] = [];
    
    // Skip header row (assuming first row is headers)
    for (let j = 1; j < lines.length; j++) {
      const line = lines[j].trim();
      if (!line) continue;

      // Handle CSV with potential commas in quoted fields
      const values = this.parseCSVLine(line);
      
      if (values.length >= 4) {
        profiles.push({
          id: `csv-${Date.now()}-${fileIndex}-${j}`,
          name: values[0]?.trim() || 'Unknown',
          grade: values[1]?.trim() || 'Unknown',
          subject: values[2]?.trim() || 'Unknown',
          profile: values[3]?.trim() || 'No profile provided',
          createdAt: new Date().toISOString()
        });
      }
    }

    if (profiles.length === 0) {
      throw new Error(`No valid student profiles found in CSV "${file.name}"`);
    }

    return { profiles };
  }

  /**
   * Process plain text files
   */
  private static async processTextFile(file: File, fileIndex: number): Promise<{ profiles: StudentProfile[] }> {
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      throw new Error(`Text file "${file.name}" is empty`);
    }

    const profiles: StudentProfile[] = [];
    
    // Try to parse as tab-separated or comma-separated
    for (let j = 0; j < lines.length; j++) {
      const line = lines[j].trim();
      if (!line) continue;

      // Try tab-separated first, then comma-separated
      let values = line.split('\t');
      if (values.length < 4) {
        values = line.split(',');
      }

      if (values.length >= 4) {
        profiles.push({
          id: `txt-${Date.now()}-${fileIndex}-${j}`,
          name: values[0]?.trim() || 'Unknown',
          grade: values[1]?.trim() || 'Unknown',
          subject: values[2]?.trim() || 'Unknown',
          profile: values[3]?.trim() || 'No profile provided',
          createdAt: new Date().toISOString()
        });
      }
    }

    if (profiles.length === 0) {
      throw new Error(`No valid student profiles found in text file "${file.name}"`);
    }

    return { profiles };
  }

  /**
   * Parse CSV line handling quoted fields
   */
  private static parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current);
    return result;
  }

  /**
   * Validate a single student profile
   */
  static validateProfile(profile: Partial<StudentProfile>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!profile.name || profile.name.trim().length === 0) {
      errors.push('Student name is required');
    }

    if (!profile.grade || profile.grade.trim().length === 0) {
      errors.push('Grade level is required');
    }

    if (!profile.subject || profile.subject.trim().length === 0) {
      errors.push('Subject is required');
    }

    if (!profile.profile || profile.profile.trim().length === 0) {
      errors.push('Student profile description is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Generate a sample CSV template
   */
  static generateCSVTemplate(): string {
    return `Name,Grade,Subject,Profile
"John Smith","3","Math","John is a visual learner who enjoys hands-on activities. He struggles with abstract concepts but excels when given concrete examples. He has ADHD and benefits from frequent movement breaks."
"Maria Garcia","5","Science","Maria is bilingual (Spanish/English) and learns best through collaborative activities. She has strong verbal skills and enjoys explaining concepts to others. She needs support with written assignments."
"Alex Johnson","2","ELA","Alex is a kinesthetic learner who loves to act out stories. They have dyslexia and benefit from audio books and text-to-speech tools. Alex is very creative and enjoys drawing."`;
  }

  /**
   * Export profiles to CSV
   */
  static exportToCSV(profiles: StudentProfile[]): string {
    const headers = ['Name', 'Grade', 'Subject', 'Profile', 'Created At'];
    const rows = profiles.map(profile => [
      `"${profile.name}"`,
      `"${profile.grade}"`,
      `"${profile.subject}"`,
      `"${profile.profile.replace(/"/g, '""')}"`,
      `"${profile.createdAt}"`
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }
} 