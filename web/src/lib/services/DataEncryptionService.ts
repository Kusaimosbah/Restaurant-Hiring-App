import crypto from 'crypto';
import bcrypt from 'bcryptjs';

export interface EncryptionConfig {
  algorithm: string;
  keyLength: number;
  ivLength: number;
  saltLength: number;
  iterations: number;
}

export interface EncryptedData {
  data: string;
  iv: string;
  salt?: string;
  algorithm: string;
}

export interface HashOptions {
  saltRounds?: number;
  pepper?: string;
}

export class DataEncryptionService {
  private static readonly DEFAULT_CONFIG: EncryptionConfig = {
    algorithm: 'aes-256-gcm',
    keyLength: 32,
    ivLength: 16,
    saltLength: 32,
    iterations: 100000,
  };

  private static masterKey: Buffer | null = null;

  /**
   * Initialize encryption service with master key
   */
  static initialize(masterKey?: string): void {
    if (masterKey) {
      this.masterKey = Buffer.from(masterKey, 'hex');
    } else {
      // Use environment variable or generate key
      const envKey = process.env.ENCRYPTION_MASTER_KEY;
      if (envKey) {
        this.masterKey = Buffer.from(envKey, 'hex');
      } else {
        // Generate a new master key (for development only)
        this.masterKey = crypto.randomBytes(this.DEFAULT_CONFIG.keyLength);
        console.warn('Generated new master key. Set ENCRYPTION_MASTER_KEY in production.');
      }
    }
  }

  /**
   * Generate encryption key from password and salt
   */
  private static deriveKey(password: string, salt: Buffer): Buffer {
    return crypto.pbkdf2Sync(
      password,
      salt,
      this.DEFAULT_CONFIG.iterations,
      this.DEFAULT_CONFIG.keyLength,
      'sha256'
    );
  }

  /**
   * Encrypt data with AES-256-GCM
   */
  static encrypt(data: string, password?: string): EncryptedData {
    if (!this.masterKey && !password) {
      throw new Error('Encryption service not initialized and no password provided');
    }

    const iv = crypto.randomBytes(this.DEFAULT_CONFIG.ivLength);
    let key: Buffer;
    let salt: Buffer | undefined;

    if (password) {
      salt = crypto.randomBytes(this.DEFAULT_CONFIG.saltLength);
      key = this.deriveKey(password, salt);
    } else {
      key = this.masterKey!;
    }

    const cipher = crypto.createCipher(this.DEFAULT_CONFIG.algorithm, key);
    cipher.setAAD(iv);

    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return {
      data: encrypted + ':' + authTag.toString('hex'),
      iv: iv.toString('hex'),
      salt: salt?.toString('hex'),
      algorithm: this.DEFAULT_CONFIG.algorithm,
    };
  }

  /**
   * Decrypt data with AES-256-GCM
   */
  static decrypt(encryptedData: EncryptedData, password?: string): string {
    if (!this.masterKey && !password) {
      throw new Error('Encryption service not initialized and no password provided');
    }

    const iv = Buffer.from(encryptedData.iv, 'hex');
    let key: Buffer;

    if (password && encryptedData.salt) {
      const salt = Buffer.from(encryptedData.salt, 'hex');
      key = this.deriveKey(password, salt);
    } else {
      key = this.masterKey!;
    }

    const [encrypted, authTagHex] = encryptedData.data.split(':');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipher(encryptedData.algorithm, key);
    decipher.setAAD(iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Hash password with bcrypt
   */
  static async hashPassword(password: string, options: HashOptions = {}): Promise<string> {
    const saltRounds = options.saltRounds || 12;
    const pepper = options.pepper || process.env.PASSWORD_PEPPER || '';
    
    const pepperedPassword = password + pepper;
    return bcrypt.hash(pepperedPassword, saltRounds);
  }

  /**
   * Verify password hash
   */
  static async verifyPassword(
    password: string,
    hash: string,
    options: HashOptions = {}
  ): Promise<boolean> {
    const pepper = options.pepper || process.env.PASSWORD_PEPPER || '';
    const pepperedPassword = password + pepper;
    
    return bcrypt.compare(pepperedPassword, hash);
  }

  /**
   * Generate secure random token
   */
  static generateToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Generate cryptographically secure random string
   */
  static generateSecureString(
    length: number = 32,
    charset: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  ): string {
    let result = '';
    const charsetLength = charset.length;
    
    for (let i = 0; i < length; i++) {
      const randomIndex = crypto.randomInt(0, charsetLength);
      result += charset[randomIndex];
    }
    
    return result;
  }

  /**
   * Hash data with SHA-256
   */
  static hashData(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Hash data with HMAC
   */
  static hmacHash(data: string, secret?: string): string {
    const key = secret || process.env.HMAC_SECRET || this.masterKey?.toString('hex') || 'default-secret';
    return crypto.createHmac('sha256', key).update(data).digest('hex');
  }

  /**
   * Encrypt sensitive fields in object
   */
  static encryptFields<T extends Record<string, any>>(
    obj: T,
    fieldsToEncrypt: string[],
    password?: string
  ): T {
    const encrypted = { ...obj };
    
    for (const field of fieldsToEncrypt) {
      if (encrypted[field] && typeof encrypted[field] === 'string') {
        const encryptedData = this.encrypt(encrypted[field], password);
        encrypted[field] = JSON.stringify(encryptedData);
      }
    }
    
    return encrypted;
  }

  /**
   * Decrypt sensitive fields in object
   */
  static decryptFields<T extends Record<string, any>>(
    obj: T,
    fieldsToDecrypt: string[],
    password?: string
  ): T {
    const decrypted = { ...obj };
    
    for (const field of fieldsToDecrypt) {
      if (decrypted[field] && typeof decrypted[field] === 'string') {
        try {
          const encryptedData = JSON.parse(decrypted[field] as string) as EncryptedData;
          decrypted[field] = this.decrypt(encryptedData, password) as any;
        } catch (error) {
          console.error(`Failed to decrypt field ${field}:`, error);
        }
      }
    }
    
    return decrypted;
  }

  /**
   * Create data integrity signature
   */
  static createSignature(data: string | object): string {
    const dataString = typeof data === 'string' ? data : JSON.stringify(data);
    return this.hmacHash(dataString);
  }

  /**
   * Verify data integrity signature
   */
  static verifySignature(data: string | object, signature: string): boolean {
    const expectedSignature = this.createSignature(data);
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }

  /**
   * Encrypt file content
   */
  static encryptFile(filePath: string, outputPath: string, password?: string): void {
    const fs = require('fs');
    const content = fs.readFileSync(filePath, 'utf8');
    const encrypted = this.encrypt(content, password);
    fs.writeFileSync(outputPath, JSON.stringify(encrypted));
  }

  /**
   * Decrypt file content
   */
  static decryptFile(encryptedFilePath: string, outputPath: string, password?: string): void {
    const fs = require('fs');
    const encryptedContent = fs.readFileSync(encryptedFilePath, 'utf8');
    const encryptedData = JSON.parse(encryptedContent) as EncryptedData;
    const decrypted = this.decrypt(encryptedData, password);
    fs.writeFileSync(outputPath, decrypted);
  }

  /**
   * Generate key pair for asymmetric encryption
   */
  static generateKeyPair(): { publicKey: string; privateKey: string } {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      },
    });

    return { publicKey, privateKey };
  }

  /**
   * Encrypt with public key (RSA)
   */
  static encryptWithPublicKey(data: string, publicKey: string): string {
    const encrypted = crypto.publicEncrypt(publicKey, Buffer.from(data));
    return encrypted.toString('base64');
  }

  /**
   * Decrypt with private key (RSA)
   */
  static decryptWithPrivateKey(encryptedData: string, privateKey: string): string {
    const decrypted = crypto.privateDecrypt(privateKey, Buffer.from(encryptedData, 'base64'));
    return decrypted.toString();
  }

  /**
   * Get master key (for backup purposes)
   */
  static getMasterKey(): string | null {
    return this.masterKey?.toString('hex') || null;
  }

  /**
   * Rotate master key
   */
  static rotateMasterKey(newKey?: string): string {
    const oldKey = this.masterKey;
    
    if (newKey) {
      this.masterKey = Buffer.from(newKey, 'hex');
    } else {
      this.masterKey = crypto.randomBytes(this.DEFAULT_CONFIG.keyLength);
    }

    // Return old key for re-encryption purposes
    return oldKey?.toString('hex') || '';
  }

  /**
   * Re-encrypt data with new key
   */
  static reEncrypt(
    encryptedData: EncryptedData,
    oldPassword?: string,
    newPassword?: string
  ): EncryptedData {
    const decrypted = this.decrypt(encryptedData, oldPassword);
    return this.encrypt(decrypted, newPassword);
  }
}

// Initialize encryption service
DataEncryptionService.initialize();

export default DataEncryptionService;