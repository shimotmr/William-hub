/**
 * Shioaji 連線管理客戶端
 * 負責與 Python wrapper 通信，管理 Shioaji 連線狀態
 */
import { spawn } from 'child_process'
import { promises as fs } from 'fs'
import path from 'path'
import { CredentialEncryption } from './encryption'

interface ShioajiCredentials {
  api_key: string
  secret_key: string
  ca_cert?: string
  ca_password?: string
  simulation_mode: boolean
}

interface ConnectionStatus {
  connected: boolean
  connection_time?: string
  api_calls_today: number
  daily_quota: number
  bandwidth_used_mb: number
  accounts: Array<{
    account_id: string
    account_type: string
    is_ca_activated: boolean
  }>
}

interface AccountInfo {
  account_id: string
  broker_id: string
  account_type: string
  signed: boolean
}

export class ShioajiClient {
  private readonly wrapperPath: string
  private readonly tempCredentialsDir: string
  private readonly encryption: CredentialEncryption

  constructor() {
    this.wrapperPath = path.join(process.env.HOME || '', 'clawd', 'shioaji_cli.py')
    this.tempCredentialsDir = path.join(process.env.HOME || '', '.openclaw', 'temp')
    this.encryption = new CredentialEncryption()
  }

  /**
   * 創建臨時憑證文件
   * @param credentials 憑證資料
   * @returns 臨時文件路徑
   */
  private async createTempCredentialsFile(credentials: ShioajiCredentials): Promise<string> {
    // 確保臨時目錄存在
    await fs.mkdir(this.tempCredentialsDir, { recursive: true })

    // 創建憑證文件內容
    const credentialsData = {
      api_key: credentials.api_key,
      secret_key: credentials.secret_key,
      provider: "sinopac",
      note: `Temporary credentials for user - ${credentials.simulation_mode ? 'Simulation' : 'Production'} Mode`
    }

    // 生成臨時文件名
    const timestamp = Date.now()
    const tempFilePath = path.join(this.tempCredentialsDir, `shioaji_${timestamp}.json`)

    // 寫入文件
    await fs.writeFile(tempFilePath, JSON.stringify(credentialsData, null, 2), 'utf8')

    return tempFilePath
  }

  /**
   * 清理臨時憑證文件
   * @param filePath 文件路徑
   */
  private async cleanupTempFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath)
    } catch (error) {
      console.warn('Failed to cleanup temp file:', filePath, error)
    }
  }

  /**
   * 執行 Python CLI 命令
   * @param command 要執行的命令
   * @param credentialsPath 憑證文件路徑
   * @returns Promise<any>
   */
  private async executePythonWrapper(command: string, credentialsPath?: string): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const pythonPath = path.join(process.env.HOME || '', 'clawd', 'trading_env', 'bin', 'python')
      const cmd = [this.wrapperPath, command]
      
      if (credentialsPath) {
        cmd.push('--credentials', credentialsPath)
      }

      const childProcess = spawn(pythonPath, cmd, {
        env: { ...process.env },
        stdio: ['pipe', 'pipe', 'pipe']
      })

      let stdout = ''
      let stderr = ''

      childProcess.stdout.on('data', (data: Buffer) => {
        stdout += data.toString()
      })

      childProcess.stderr.on('data', (data: Buffer) => {
        stderr += data.toString()
      })

      childProcess.on('close', (code: number | null) => {
        if (code === 0) {
          try {
            const result = stdout.trim() ? JSON.parse(stdout.trim()) : {}
            resolve(result)
          } catch (error) {
            console.error('Failed to parse Python output:', stdout)
            reject(new Error(`Failed to parse Python output: ${error}`))
          }
        } else {
          console.error('Python wrapper error:', stderr)
          reject(new Error(`Python wrapper failed with code ${code}: ${stderr}`))
        }
      })

      childProcess.on('error', (error: Error) => {
        console.error('Failed to start Python process:', error)
        reject(new Error(`Failed to start Python process: ${error}`))
      })
    })
  }

  /**
   * 測試憑證連線
   * @param credentials 憑證資料
   * @returns 連線結果
   */
  async testConnection(credentials: ShioajiCredentials): Promise<{ success: boolean; accounts?: AccountInfo[]; error?: string }> {
    let tempFilePath: string | null = null

    try {
      // 創建臨時憑證文件
      tempFilePath = await this.createTempCredentialsFile(credentials)

      // 執行連線測試
      const result = await this.executePythonWrapper('test_connection', tempFilePath) as { success?: boolean; accounts?: AccountInfo[]; error?: string }

      if (result.success) {
        return {
          success: true,
          accounts: result.accounts || []
        }
      } else {
        return {
          success: false,
          error: result.error || '連線測試失敗'
        }
      }
    } catch (error: any) {
      console.error('Connection test error:', error)
      return {
        success: false,
        error: error.message || '連線測試異常'
      }
    } finally {
      // 清理臨時文件
      if (tempFilePath) {
        await this.cleanupTempFile(tempFilePath)
      }
    }
  }

  /**
   * 激活憑證連線
   * @param encryptedCredentials 加密的憑證資料
   * @returns 激活結果
   */
  async activateConnection(encryptedCredentials: unknown): Promise<{ success: boolean; accounts?: AccountInfo[]; error?: string }> {
    try {
      // Type guard and cast
      if (typeof encryptedCredentials !== 'object' || encryptedCredentials === null) {
        throw new Error('Invalid credentials format')
      }
      
      const creds = encryptedCredentials as Record<string, unknown>
      
      // 解密憑證
      const credentials: ShioajiCredentials = {
        api_key: this.encryption.decryptCredential(JSON.parse(creds.api_key_encrypted as string)),
        secret_key: this.encryption.decryptCredential(JSON.parse(creds.secret_key_encrypted as string)),
        simulation_mode: (creds.simulation_mode as boolean) || true
      }

      if (creds.ca_cert_encrypted) {
        credentials.ca_cert = this.encryption.decryptCredential(JSON.parse(creds.ca_cert_encrypted as string))
      }

      if (creds.ca_password_encrypted) {
        credentials.ca_password = this.encryption.decryptCredential(JSON.parse(creds.ca_password_encrypted as string))
      }

      // 測試連線
      return await this.testConnection(credentials)

    } catch (error: any) {
      console.error('Activation error:', error)
      return {
        success: false,
        error: error.message || '憑證激活失敗'
      }
    }
  }

  /**
   * 獲取連線狀態
   * @param encryptedCredentials 加密的憑證資料
   * @returns 連線狀態
   */
  async getConnectionStatus(encryptedCredentials: unknown): Promise<ConnectionStatus> {
    try {
      // Type guard and cast
      if (typeof encryptedCredentials !== 'object' || encryptedCredentials === null) {
        throw new Error('Invalid credentials format')
      }
      
      const creds = encryptedCredentials as Record<string, unknown>
      
      // 解密憑證
      const credentials: ShioajiCredentials = {
        api_key: this.encryption.decryptCredential(JSON.parse(creds.api_key_encrypted as string)),
        secret_key: this.encryption.decryptCredential(JSON.parse(creds.secret_key_encrypted as string)),
        simulation_mode: (creds.simulation_mode as boolean) || true
      }

      // 測試連線
      const connectionTest = await this.testConnection(credentials)

      if (connectionTest.success && connectionTest.accounts) {
        return {
          connected: true,
          connection_time: (creds.last_login_at as string) || (creds.created_at as string),
          api_calls_today: (creds.daily_api_calls as number) || 0,
          daily_quota: 10000,
          bandwidth_used_mb: 0.0,
          accounts: connectionTest.accounts.map(account => ({
            account_id: account.account_id,
            account_type: account.account_type,
            is_ca_activated: !credentials.simulation_mode && account.signed
          }))
        }
      } else {
        return {
          connected: false,
          api_calls_today: (creds.daily_api_calls as number) || 0,
          daily_quota: 10000,
          bandwidth_used_mb: 0.0,
          accounts: []
        }
      }
    } catch (error) {
      console.error('Get connection status error:', error)
      return {
        connected: false,
        api_calls_today: 0,
        daily_quota: 10000,
        bandwidth_used_mb: 0.0,
        accounts: []
      }
    }
  }

  /**
   * 驗證 Shioaji API 是否可用
   * @returns 是否可用
   */
  async isShioajiAvailable(): Promise<boolean> {
    try {
      const result = await this.executePythonWrapper('check_availability') as { available?: boolean }
      return result.available === true
    } catch (error) {
      console.error('Shioaji availability check failed:', error)
      return false
    }
  }
}