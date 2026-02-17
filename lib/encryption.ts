/**
 * AES-256-GCM 加密服務
 * 用於加密和解密敏感的 Shioaji 憑證資料
 */
import crypto from 'crypto'

interface EncryptedData {
  encrypted: string
  iv: string
  authTag: string
  salt: string
}

export class CredentialEncryption {
  private readonly algorithm = 'aes-256-gcm'
  private readonly masterKey: string

  constructor() {
    this.masterKey = process.env.ENCRYPTION_MASTER_KEY || ''
    if (!this.masterKey) {
      throw new Error('ENCRYPTION_MASTER_KEY environment variable is required')
    }
  }

  /**
   * 基於主密鑰和鹽值生成加密密鑰
   * @param salt 鹽值
   * @returns 生成的密鑰
   */
  private deriveKey(salt: Buffer): Buffer {
    return crypto.pbkdf2Sync(this.masterKey, salt, 100000, 32, 'sha256')
  }

  /**
   * 加密憑證資料
   * @param data 要加密的字符串
   * @returns 加密結果對象
   */
  encryptCredential(data: string): EncryptedData {
    try {
      // 生成隨機鹽值和初始化向量
      const salt = crypto.randomBytes(16)
      const iv = crypto.randomBytes(12) // GCM 模式使用 12 字節的 IV
      
      // 基於鹽值生成密鑰
      const key = this.deriveKey(salt)
      
      // 創建 GCM 加密器
      const cipher = crypto.createCipheriv(this.algorithm, key, iv)
      
      // 加密數據
      let encrypted = cipher.update(data, 'utf8')
      cipher.final()
      
      // 獲取認證標籤
      const authTag = cipher.getAuthTag()
      
      return {
        encrypted: encrypted.toString('base64'),
        iv: iv.toString('base64'),
        authTag: authTag.toString('base64'),
        salt: salt.toString('base64')
      }
    } catch (error) {
      console.error('Encryption error:', error)
      throw new Error('加密失敗', { cause: error })
    }
  }

  /**
   * 解密憑證資料
   * @param encryptedData 加密的資料對象
   * @returns 解密後的字符串
   */
  decryptCredential(encryptedData: EncryptedData): string {
    try {
      // 解析加密資料
      const salt = Buffer.from(encryptedData.salt, 'base64')
      const iv = Buffer.from(encryptedData.iv, 'base64')
      const authTag = Buffer.from(encryptedData.authTag, 'base64')
      const encrypted = Buffer.from(encryptedData.encrypted, 'base64')
      
      // 基於鹽值生成密鑰
      const key = this.deriveKey(salt)
      
      // 創建 GCM 解密器
      const decipher = crypto.createDecipheriv(this.algorithm, key, iv)
      decipher.setAuthTag(authTag)
      
      // 解密數據
      let decrypted = decipher.update(encrypted)
      decipher.final()
      
      return decrypted.toString('utf8')
    } catch (error) {
      console.error('Decryption error:', error)
      throw new Error('解密失敗', { cause: error })
    }
  }

  /**
   * 驗證加密資料的完整性
   * @param encryptedData 加密的資料對象
   * @returns 是否有效
   */
  isValidEncryptedData(encryptedData: unknown): encryptedData is EncryptedData {
    return (
      typeof encryptedData === 'object' &&
      encryptedData !== null &&
      'encrypted' in encryptedData &&
      'iv' in encryptedData &&
      'authTag' in encryptedData &&
      'salt' in encryptedData &&
      typeof (encryptedData as Record<string, unknown>).encrypted === 'string' &&
      typeof (encryptedData as Record<string, unknown>).iv === 'string' &&
      typeof (encryptedData as Record<string, unknown>).authTag === 'string' &&
      typeof (encryptedData as Record<string, unknown>).salt === 'string'
    )
  }
}

/**
 * 驗證 API Key 格式
 * @param apiKey API Key
 * @returns 是否有效
 */
export function validateApiKeyFormat(apiKey: string): boolean {
  // Shioaji API Key 通常是 40-50 個字符的字母數字組合
  return /^[A-Za-z0-9]{40,50}$/.test(apiKey)
}

/**
 * 驗證 Secret Key 格式
 * @param secretKey Secret Key
 * @returns 是否有效
 */
export function validateSecretKeyFormat(secretKey: string): boolean {
  // Shioaji Secret Key 通常是 40-50 個字符的字母數字組合
  return /^[A-Za-z0-9]{40,50}$/.test(secretKey)
}