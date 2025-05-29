import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { encryptData, decryptToBlob } from './encryption';
import { logAuditEvent } from './auditLogger';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'your-health-uploads';

interface UploadedFile {
  fileId: string;
  originalName: string;
  mimeType: string;
  size: number;
  userId: string;
  createdAt: Date;
  description?: string;
  tags?: string[];
}

/**
 * Uploads a file to secure storage with encryption
 */
export const uploadFile = async (
  file: File,
  userId: string,
  metadata: {
    description?: string;
    tags?: string[];
    ipAddress?: string;
    userAgent?: string;
  } = {}
): Promise<UploadedFile> => {
  try {
    const fileId = uuidv4();
    const fileExt = file.name.split('.').pop() || '';
    const s3Key = `users/${userId}/${fileId}.${fileExt}`;
    
    // Encrypt the file content
    const fileBuffer = await file.arrayBuffer();
    const encryptedContent = await encryptData(Buffer.from(fileBuffer).toString('base64'));
    
    // Upload to S3
    const uploadParams = {
      Bucket: BUCKET_NAME,
      Key: s3Key,
      Body: encryptedContent,
      ContentType: file.type,
      Metadata: {
        'x-user-id': userId,
        'x-original-name': encodeURIComponent(file.name),
        'x-file-id': fileId,
        'x-uploaded-at': new Date().toISOString(),
      },
    };
    
    await s3Client.send(new PutObjectCommand(uploadParams));
    
    // Create file record in database
    const fileRecord: UploadedFile = {
      fileId,
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
      userId,
      createdAt: new Date(),
      description: metadata.description,
      tags: metadata.tags,
    };
    
    // Log the upload event
    await logAuditEvent({
      userId,
      action: 'UPLOAD_FILE',
      resourceType: 'FILE',
      resourceId: fileId,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
      metadata: {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        description: metadata.description,
        tags: metadata.tags,
      },
    });
    
    return fileRecord;
  } catch (error) {
    console.error('File upload failed:', error);
    throw new Error('Failed to upload file');
  }
};

/**
 * Generates a secure, time-limited download URL for a file
 */
export const getFileDownloadUrl = async (
  fileId: string,
  userId: string,
  expiresInSeconds = 3600 // 1 hour default
): Promise<string> => {
  try {
    // In a real implementation, verify the user has permission to access this file
    const s3Key = `users/${userId}/${fileId}`; // You'd need to look up the actual key
    
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
    });
    
    const url = await getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
    
    // Log the download event
    await logAuditEvent({
      userId,
      action: 'DOWNLOAD_FILE',
      resourceType: 'FILE',
      resourceId: fileId,
      metadata: {
        expiresInSeconds,
      },
    });
    
    return url;
  } catch (error) {
    console.error('Failed to generate download URL:', error);
    throw new Error('Failed to generate download URL');
  }
};

/**
 * Deletes a file from storage
 */
export const deleteFile = async (fileId: string, userId: string): Promise<void> => {
  try {
    // In a real implementation, verify the user has permission to delete this file
    const s3Key = `users/${userId}/${fileId}`; // You'd need to look up the actual key
    
    await s3Client.send(new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
    }));
    
    // Log the deletion event
    await logAuditEvent({
      userId,
      action: 'DELETE_FILE',
      resourceType: 'FILE',
      resourceId: fileId,
    });
    
  } catch (error) {
    console.error('Failed to delete file:', error);
    throw new Error('Failed to delete file');
  }
};

/**
 * Gets file metadata without downloading the file
 */
export const getFileMetadata = async (fileId: string, userId: string): Promise<UploadedFile | null> => {
  try {
    // In a real implementation, fetch from your database
    // This is a placeholder that would be replaced with actual database logic
    return null;
  } catch (error) {
    console.error('Failed to get file metadata:', error);
    return null;
  }
};

/**
 * Lists all files for a user
 */
export const listUserFiles = async (userId: string): Promise<UploadedFile[]> => {
  try {
    // In a real implementation, fetch from your database with pagination
    // This is a placeholder that would be replaced with actual database logic
    return [];
  } catch (error) {
    console.error('Failed to list user files:', error);
    return [];
  }
};
