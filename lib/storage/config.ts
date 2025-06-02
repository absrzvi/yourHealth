export const storageConfig = {
  uploadDir: process.env.UPLOAD_DIR || './uploads',
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB
  encryptionKey: process.env.FILE_ENCRYPTION_KEY || 'default-encryption-key-32-characters-long',
  allowedMimeTypes: [
    'image/jpeg',
    'image/png',
    'application/pdf',
    'image/heic',
    'image/heif'
  ],
  // HIPAA compliance: Add access logging
  enableAccessLogging: true,
  // Minimum dimensions for image quality
  minImageWidth: 800,
  minImageHeight: 800
};
