import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

function getEncryptionKey() {
  const rawKey = process.env.ENCRYPTION_KEY || 'cerilas_default_secure_key_32bytes!!';
  return crypto.createHash('sha256').update(String(rawKey)).digest();
}

/**
 * Encrypts sensitive text using AES-256-GCM.
 * Output format: base64(iv + authTag + encryptedData)
 */
export function encryptText(plainText) {
  if (!plainText) return '';
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getEncryptionKey(), iv);
  
  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag();

  return Buffer.concat([iv, tag, Buffer.from(encrypted, 'hex')]).toString('base64');
}

/**
 * Decrypts text previously encrypted with encryptText.
 */
export function decryptText(cipherTextBase64) {
  if (!cipherTextBase64) return '';
  try {
    const buffer = Buffer.from(cipherTextBase64, 'base64');
    if (buffer.length < IV_LENGTH + TAG_LENGTH) {
      throw new Error('Invalid ciphertext buffer length');
    }

    const iv = buffer.subarray(0, IV_LENGTH);
    const tag = buffer.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
    const encryptedData = buffer.subarray(IV_LENGTH + TAG_LENGTH);

    const decipher = crypto.createDecipheriv(ALGORITHM, getEncryptionKey(), iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encryptedData, null, 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error.message);
    throw new Error('Failed to decrypt credentials');
  }
}
