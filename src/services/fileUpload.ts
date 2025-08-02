import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { storage, db } from '../lib/firebase';

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
   * Upload a file to Firebase Storage and save metadata to Firestore
   */
  static async uploadFile(
    file: File, 
    userId: string
  ): Promise<FileUploadResult> {
    try {
      // Create a unique file ID
      const fileId = `${userId}_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      
      // Create storage reference
      const storageRef = ref(storage, `uploads/${userId}/${fileId}`);
      
      // Upload file to Firebase Storage
      console.log('Uploading file to Firebase Storage:', file.name);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      // Create file metadata
      const fileData: UploadedFile = {
        id: fileId,
        fileName: file.name,
        fileUrl: downloadURL,
        fileType: file.type,
        fileSize: file.size,
        uploadedAt: new Date().toISOString(),
        userId,
        status: 'uploaded'
      };
      
      // Save metadata to Firestore
      console.log('Saving metadata to Firestore:', fileId);
      const fileDocRef = doc(db, 'uploadedFiles', fileId);
      await setDoc(fileDocRef, fileData);
      
      console.log('File uploaded successfully:', fileId);
      
      return {
        success: true,
        file: fileData
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
   * Get file metadata from Firestore
   */
  static async getFile(fileId: string): Promise<UploadedFile | null> {
    try {
      const fileDocRef = doc(db, 'uploadedFiles', fileId);
      const fileDoc = await getDoc(fileDocRef);
      
      if (fileDoc.exists()) {
        return fileDoc.data() as UploadedFile;
      }
      return null;
    } catch (error) {
      console.error('Error getting file:', error);
      return null;
    }
  }
  
  /**
   * Delete file from both Storage and Firestore
   */
  static async deleteFile(fileId: string, userId: string): Promise<boolean> {
    try {
      // Get file metadata first
      const file = await this.getFile(fileId);
      if (!file || file.userId !== userId) {
        return false;
      }
      
      // Delete from Storage
      const storageRef = ref(storage, `uploads/${userId}/${fileId}`);
      await deleteObject(storageRef);
      
      // Delete from Firestore
      const fileDocRef = doc(db, 'uploadedFiles', fileId);
      await deleteDoc(fileDocRef);
      
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }
  
  /**
   * Update file status in Firestore
   */
  static async updateFileStatus(
    fileId: string, 
    status: UploadedFile['status'], 
    error?: string
  ): Promise<boolean> {
    try {
      const fileDocRef = doc(db, 'uploadedFiles', fileId);
      await setDoc(fileDocRef, { 
        status, 
        ...(error && { error }),
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      return true;
    } catch (error) {
      console.error('Error updating file status:', error);
      return false;
    }
  }
} 