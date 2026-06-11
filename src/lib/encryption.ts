import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

function getKey(): Buffer {
  const ENCRYPTION_KEY = (process.env.ENCRYPTION_KEY || '').trim();
  if (!ENCRYPTION_KEY) {
    throw new Error('Please define the ENCRYPTION_KEY environment variable in .env.local');
  }
  
  const rawKey = Buffer.from(ENCRYPTION_KEY, 'utf-8');
  if (rawKey.length === 32) {
    return rawKey;
  }
  
  // Fallback: Hash the ENCRYPTION_KEY to exactly 32 bytes to support keys of other lengths
  // and handle Next.js dotenv-expand parsing issues transparently.
  return crypto.createHash('sha256').update(ENCRYPTION_KEY, 'utf-8').digest();
}

export function encrypt(text: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag().toString('hex');
  
  // Format: iv:authTag:encryptedData
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

export function decrypt(encryptedText: string): string {
  try {
    const key = getKey();
    const parts = encryptedText.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid format');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encryptedData = parts[2];
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error: any) {
    console.error('Decryption failed:', error);
    throw new Error(`Failed to decrypt credentials. Details: ${error.message || 'Unknown error'}`);
  }
}
