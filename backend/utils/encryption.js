const crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc';
const KEY_BYTES = 32;

function getKey() {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) throw new Error('ENCRYPTION_KEY environment variable is not set');
  // Accept a 64-char hex string (preferred) or a raw string padded/truncated to 32 bytes
  if (/^[0-9a-fA-F]{64}$/.test(raw)) {
    return Buffer.from(raw, 'hex');
  }
  const buf = Buffer.alloc(KEY_BYTES, 0);
  Buffer.from(raw, 'utf8').copy(buf);
  return buf;
}

/**
 * Encrypts a plaintext string.
 * Returns "ivHex:ciphertextHex" or null if text is falsy.
 */
function encrypt(text) {
  if (!text) return null;
  const key = getKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * Decrypts a string produced by encrypt().
 * Returns the plaintext or null if ciphertext is falsy.
 */
function decrypt(ciphertext) {
  if (!ciphertext) return null;
  const key = getKey();
  const [ivHex, encHex] = ciphertext.split(':');
  if (!ivHex || !encHex) throw new Error('Invalid ciphertext format — expected "ivHex:encHex"');
  const iv = Buffer.from(ivHex, 'hex');
  const encrypted = Buffer.from(encHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}

module.exports = { encrypt, decrypt };
