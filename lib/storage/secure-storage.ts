import { createHash, randomBytes, createCipheriv, createDecipheriv } from 'crypto';
import { writeFile, mkdir, readFile, unlink, appendFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { storageConfig } from './config';

const IV_LENGTH = 16;
const ACCESS_LOG_PATH = join(process.cwd(), 'logs', 'file-access.log');

// Ensure the log directory exists
async function ensureLogDir() {
  const logDir = join(process.cwd(), 'logs');
  if (!existsSync(logDir)) {
    await mkdir(logDir, { recursive: true });
  }
}

// Log access to PHI data for HIPAA compliance
async function logAccess(action: string, userId: string, filePath: string) {
  if (!storageConfig.enableAccessLogging) return;
  
  try {
    await ensureLogDir();
    const timestamp = new Date().toISOString();
    const logEntry = `${timestamp} | ${action} | User: ${userId} | File: ${filePath}\n`;
    await appendFile(ACCESS_LOG_PATH, logEntry, { flag: 'a' });
  } catch (error) {
    console.error('Failed to log file access:', error);
    // Do not throw - logging should not block main functionality
  }
}

async function ensureUploadDir() {
  if (!existsSync(storageConfig.uploadDir)) {
    await mkdir(storageConfig.uploadDir, { recursive: true });
  }
}

// Generate a secure filename that doesn't expose PHI
function generateSecureFilename(originalName: string, userId: string): string {
  const timestamp = Date.now();
  const random = randomBytes(8).toString('hex');
  const hash = createHash('sha256')
    .update(`${userId}-${timestamp}-${random}-${originalName}`)
    .digest('hex');
  return `${timestamp}-${hash.slice(0, 16)}.enc`;
}

async function encryptBuffer(buffer: Buffer): Promise<{ iv: string; encrypted: Buffer }> {
  // Ensure key is exactly 32 bytes for AES-256
  const key = Buffer.from(storageConfig.encryptionKey.padEnd(32, '0').slice(0, 32));
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv('aes-256-cbc', key, iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  return { iv: iv.toString('hex'), encrypted };
}

async function decryptBuffer(encrypted: Buffer, iv: string): Promise<Buffer> {
  // Ensure key is exactly 32 bytes for AES-256
  const key = Buffer.from(storageConfig.encryptionKey.padEnd(32, '0').slice(0, 32));
  const decipher = createDecipheriv('aes-256-cbc', key, Buffer.from(iv, 'hex'));
  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
}

// HIPAA-compliant secure storage service
export const secureStorage = {
  async storeFile(file: Express.Multer.File, userId: string) {
    await ensureUploadDir();
    
    // Use secure naming that doesn't expose PHI
    const secureName = generateSecureFilename(file.originalname, userId);
    const filePath = join(storageConfig.uploadDir, secureName);
    
    // Encrypt the file with AES-256-CBC
    const { iv, encrypted } = await encryptBuffer(file.buffer);
    
    // Store IV with the file for later decryption
    await writeFile(filePath, `${iv}:${encrypted.toString('base64')}`);
    
    // Log the access for HIPAA compliance
    await logAccess('STORE', userId, filePath);
    
    return {
      filePath,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size
    };
  },

  async retrieveFile(filePath: string, userId: string) {
    // Log access for HIPAA compliance
    await logAccess('RETRIEVE', userId, filePath);
    
    const fileContent = await readFile(filePath, 'utf8');
    const [iv, encryptedBase64] = fileContent.split(':');
    
    if (!iv || !encryptedBase64) {
      throw new Error('Invalid file format');
    }
    
    const buffer = await decryptBuffer(
      Buffer.from(encryptedBase64, 'base64'),
      iv
    );
    
    return { buffer };
  },

  async deleteFile(filePath: string, userId: string) {
    // Log access for HIPAA compliance
    await logAccess('DELETE', userId, filePath);
    
    if (existsSync(filePath)) {
      await unlink(filePath);
    }
  },
  
  // Helper method to sanitize file metadata before storing in database
  sanitizeMetadata(metadata: any) {
    // Strip any PHI that shouldn't be stored
    const safeMetadata = { ...metadata };
    
    // Remove any potential PII
    delete safeMetadata.patientName;
    delete safeMetadata.patientAddress;
    delete safeMetadata.patientPhone;
    delete safeMetadata.patientEmail;
    delete safeMetadata.patientDOB;
    
    return safeMetadata;
  }
};
