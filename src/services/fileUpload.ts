import { 
  saveUploadedFile, 
  getUploadedFile, 
  updateFileStatus, 
  UploadedFile as MongoUploadedFile 
} from './mongodb';

export interface UploadedFile {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
  userId: string;
  status: 'uploaded' | 'processing' | 'processed' | 'error';
  error?: string;
}

export interface FileUploadResult {
  success: boolean;
  file?: UploadedFile;
  error?: string;
}

export class FileUploadService {
  /**
   * Upload a file to MongoDB (store as base64)
   */
  static async uploadFile(
    file: File, 
    userId: string
  ): Promise<FileUploadResult> {
    try {
      // Convert file to base64
      const arrayBuffer = await file.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      
      // Create file metadata for MongoDB
      const fileData: MongoUploadedFile = {
        id: '',
        userId,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        fileData: base64,
        uploadedAt: new Date(),
        status: 'pending'
      };
      
      // Save to MongoDB
      console.log('Saving file to MongoDB:', file.name);
      const fileId = await saveUploadedFile(fileData);
      
      // Create response object
      const uploadedFile: UploadedFile = {
        id: fileId,
        fileName: file.name,
        fileUrl: `/api/files/${fileId}`, // We'll create an API endpoint to serve files
        fileType: file.type,
        fileSize: file.size,
        uploadedAt: new Date().toISOString(),
        userId,
        status: 'uploaded'
      };
      
      console.log('File uploaded successfully:', fileId);
      
      return {
        success: true,
        file: uploadedFile
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload file'
      };
    }
  }
  
  /**
   * Get file metadata from MongoDB
   */
  static async getFile(fileId: string): Promise<UploadedFile | null> {
    try {
      const mongoFile = await getUploadedFile(fileId);
      if (!mongoFile) {
        return null;
      }
      
      // Convert MongoDB format to UploadedFile format
      return {
        id: mongoFile.id,
        fileName: mongoFile.fileName,
        fileUrl: `/api/files/${mongoFile.id}`,
        fileType: mongoFile.fileType,
        fileSize: mongoFile.fileSize,
        uploadedAt: mongoFile.uploadedAt.toISOString(),
        userId: mongoFile.userId,
        status: mongoFile.status === 'pending' ? 'uploaded' : mongoFile.status,
        error: mongoFile.errorMessage
      };
    } catch (error) {
      console.error('Error getting file:', error);
      return null;
    }
  }
  
  /**
   * Delete file from MongoDB
   */
  static async deleteFile(fileId: string, userId: string): Promise<boolean> {
    try {
      // Get file metadata first
      const file = await this.getFile(fileId);
      if (!file || file.userId !== userId) {
        return false;
      }
      
      // TODO: Implement delete function in MongoDB service
      // For now, we'll just return true
      console.log('File deletion not yet implemented for MongoDB');
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }
  
  /**
   * Update file status in MongoDB
   */
  static async updateFileStatus(
    fileId: string, 
    status: UploadedFile['status'], 
    error?: string
  ): Promise<boolean> {
    try {
      // Map the status to MongoDB format
      const mongoStatus = status === 'uploaded' || status === 'processing' ? 'pending' : status;
      await updateFileStatus(fileId, mongoStatus, error);
      return true;
    } catch (error) {
      console.error('Error updating file status:', error);
      return false;
    }
  }
} 