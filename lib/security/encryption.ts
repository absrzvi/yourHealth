import CryptoJS from 'crypto-js';

// Get encryption key from environment variables
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '';

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length < 32) {
  console.error('ENCRYPTION_KEY must be at least 32 characters long');
  throw new Error('Invalid encryption key configuration');
}

/**
 * Encrypts sensitive data before storing in the database
 * @param data The data to encrypt (string or object)
 * @returns Encrypted string
 */
export const encryptData = <T extends object | string>(data: T): string => {
  try {
    const dataString = typeof data === 'string' ? data : JSON.stringify(data);
    return CryptoJS.AES.encrypt(dataString, ENCRYPTION_KEY).toString();
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt data');
  }
};

/**
 * Decrypts data retrieved from the database
 * @param encryptedString The encrypted string
 * @returns The decrypted data (parsed if it was an object)
 */
export const decryptData = <T = any>(encryptedString: string): T | null => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedString, ENCRYPTION_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    
    if (!decrypted) return null;
    
    // Try to parse as JSON, return as string if not valid JSON
    try {
      return JSON.parse(decrypted) as T;
    } catch (e) {
      return decrypted as unknown as T;
    }
  } catch (error) {
    console.error('Decryption failed:', error);
    return null;
  }
};

/**
 * Creates a secure hash of the data (one-way encryption)
 * @param data The data to hash
 * @returns Hashed string
 */
export const createHash = (data: string): string => {
  return CryptoJS.SHA256(data + ENCRYPTION_KEY).toString();
};

/**
 * Generates a secure random token
 * @param length Length of the token (default: 32)
 * @returns Random token string
 */
export const generateToken = (length = 32): string => {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  
  // Use crypto.getRandomValues for cryptographically secure random numbers
  const values = new Uint32Array(length);
  crypto.getRandomValues(values);
  
  for (let i = 0; i < length; i++) {
    token += charset[values[i] % charset.length];
  }
  
  return token;
};

/**
 * Encrypts a file to a base64 string
 * @param file The file to encrypt
 * @returns Promise that resolves to encrypted string
 */
export const encryptFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        if (!event.target) {
          throw new Error('Failed to read file');
        }
        
        const wordArray = CryptoJS.lib.WordArray.create(event.target.result as ArrayBuffer);
        const encrypted = CryptoJS.AES.encrypt(wordArray, ENCRYPTION_KEY).toString();
        resolve(encrypted);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = (error) => {
      reject(error);
    };
    
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Decrypts a base64 string back to a Blob
 * @param encryptedString The encrypted string
 * @param mimeType The MIME type of the original file
 * @returns Blob with the decrypted file data
 */
export const decryptToBlob = (encryptedString: string, mimeType: string): Blob => {
  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedString, ENCRYPTION_KEY);
    const typedArray = new Uint8Array(
      decrypted.toString(CryptoJS.enc.Latin1).split('').map(char => char.charCodeAt(0))
    );
    
    return new Blob([typedArray], { type: mimeType });
  } catch (error) {
    console.error('File decryption failed:', error);
    throw new Error('Failed to decrypt file');
  }
};
