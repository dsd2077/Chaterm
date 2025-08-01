import Database from 'better-sqlite3'
import { initChatermDatabase, getCurrentUserId } from './connection'
import {
  getLocalAssetRouteLogic,
  updateLocalAssetLabelLogic,
  updateLocalAsseFavoriteLogic,
  getAssetGroupLogic,
  createAssetLogic,
  deleteAssetLogic,
  updateAssetLogic,
  connectAssetInfoLogic,
  getUserHostsLogic,
  refreshOrganizationAssetsLogic,
  updateOrganizationAssetFavoriteLogic
} from './chaterm/assets'
import {
  deleteChatermHistoryByTaskIdLogic,
  getApiConversationHistoryLogic,
  saveApiConversationHistoryLogic,
  getSavedChatermMessagesLogic,
  saveChatermMessagesLogic,
  getTaskMetadataLogic,
  saveTaskMetadataLogic,
  getContextHistoryLogic,
  saveContextHistoryLogic
} from './chaterm/agent'
import {
  getKeyChainSelectLogic,
  createKeyChainLogic,
  deleteKeyChainLogic,
  getKeyChainInfoLogic,
  updateKeyChainLogic,
  getKeyChainListLogic
} from './chaterm/keychains'
import { userSnippetOperationLogic } from './chaterm/snippets'

export class ChatermDatabaseService {
  private static instances: Map<number, ChatermDatabaseService> = new Map()
  private db: Database.Database
  private userId: number

  private constructor(db: Database.Database, userId: number) {
    this.db = db
    this.userId = userId
  }

  public static async getInstance(userId?: number): Promise<ChatermDatabaseService> {
    const targetUserId = userId || getCurrentUserId()
    if (!targetUserId) {
      throw new Error('User ID is required for ChatermDatabaseService')
    }

    if (!ChatermDatabaseService.instances.has(targetUserId)) {
      console.log(`Creating new ChatermDatabaseService instance for user ${targetUserId}`)
      const db = await initChatermDatabase(targetUserId)
      const instance = new ChatermDatabaseService(db, targetUserId)
      ChatermDatabaseService.instances.set(targetUserId, instance)
    }
    return ChatermDatabaseService.instances.get(targetUserId)!
  }

  public getUserId(): number {
    return this.userId
  }

  getLocalAssetRoute(searchType: string, params: any[] = []): any {
    return getLocalAssetRouteLogic(this.db, searchType, params)
  }

  updateLocalAssetLabel(uuid: string, label: string): any {
    return updateLocalAssetLabelLogic(this.db, uuid, label)
  }

  updateLocalAsseFavorite(uuid: string, status: number): any {
    return updateLocalAsseFavoriteLogic(this.db, uuid, status)
  }

  getAssetGroup(): any {
    return getAssetGroupLogic(this.db)
  }

  // Get keychain options
  getKeyChainSelect(): any {
    return getKeyChainSelectLogic(this.db)
  }
  createKeyChain(params: any): any {
    return createKeyChainLogic(this.db, params)
  }

  deleteKeyChain(id: number): any {
    return deleteKeyChainLogic(this.db, id)
  }
  getKeyChainInfo(id: number): any {
    return getKeyChainInfoLogic(this.db, id)
  }
  updateKeyChain(params: any): any {
    return updateKeyChainLogic(this.db, params)
  }

  createAsset(params: any): any {
    return createAssetLogic(this.db, params)
  }

  deleteAsset(uuid: string): any {
    return deleteAssetLogic(this.db, uuid)
  }

  updateAsset(params: any): any {
    return updateAssetLogic(this.db, params)
  }

  getKeyChainList(): any {
    return getKeyChainListLogic(this.db)
  }
  connectAssetInfo(uuid: string): any {
    return connectAssetInfoLogic(this.db, uuid)
  }
  // @Get user host list
  getUserHosts(search: string): any {
    return getUserHostsLogic(this.db, search)
  }

  // Transaction handling
  transaction(fn: () => void): any {
    return this.db.transaction(fn)()
  }

  // Agent API conversation history related methods

  async deleteChatermHistoryByTaskId(taskId: string): Promise<void> {
    return deleteChatermHistoryByTaskIdLogic(this.db, taskId)
  }

  async getApiConversationHistory(taskId: string): Promise<any[]> {
    return getApiConversationHistoryLogic(this.db, taskId)
  }

  async saveApiConversationHistory(taskId: string, apiConversationHistory: any[]): Promise<void> {
    return saveApiConversationHistoryLogic(this.db, taskId, apiConversationHistory)
  }

  // Agent UI message related methods
  async getSavedChatermMessages(taskId: string): Promise<any[]> {
    return getSavedChatermMessagesLogic(this.db, taskId)
  }

  async saveChatermMessages(taskId: string, uiMessages: any[]): Promise<void> {
    return saveChatermMessagesLogic(this.db, taskId, uiMessages)
  }

  // Agent task metadata related methods
  async getTaskMetadata(taskId: string): Promise<any> {
    return getTaskMetadataLogic(this.db, taskId)
  }

  async saveTaskMetadata(taskId: string, metadata: any): Promise<void> {
    return saveTaskMetadataLogic(this.db, taskId, metadata)
  }

  // Agent context history related methods
  async getContextHistory(taskId: string): Promise<any> {
    return getContextHistoryLogic(this.db, taskId)
  }

  async saveContextHistory(taskId: string, contextHistory: any): Promise<void> {
    return saveContextHistoryLogic(this.db, taskId, contextHistory)
  }
  // Shortcut command related methods
  userSnippetOperation(operation: 'list' | 'create' | 'delete' | 'update' | 'swap', params?: any): any {
    return userSnippetOperationLogic(this.db, operation, params)
  }

  async refreshOrganizationAssets(organizationUuid: string, jumpServerConfig: any): Promise<any> {
    return await refreshOrganizationAssetsLogic(this.db, organizationUuid, jumpServerConfig)
  }

  async refreshOrganizationAssetsWithAuth(
    organizationUuid: string,
    jumpServerConfig: any,
    keyboardInteractiveHandler?: any,
    authResultCallback?: any
  ): Promise<any> {
    return await refreshOrganizationAssetsLogic(this.db, organizationUuid, jumpServerConfig, keyboardInteractiveHandler, authResultCallback)
  }

  updateOrganizationAssetFavorite(organizationUuid: string, host: string, status: number): any {
    try {
      const result = updateOrganizationAssetFavoriteLogic(this.db, organizationUuid, host, status)
      return result
    } catch (error) {
      console.error('ChatermDatabaseService.updateOrganizationAssetFavorite 错误:', error)
      throw error
    }
  }

  // Login log related methods
  insertLoginLog(loginData: {
    username?: string
    email?: string
    ip_address?: string
    mac_address?: string
    login_method?: string
    status?: string
    user_agent?: string
    platform?: string
  }): any {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO login_log (username, email, ip_address, mac_address, login_method, status, user_agent, platform)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `)
      const result = stmt.run(
        loginData.username || null,
        loginData.email || null,
        loginData.ip_address || null,
        loginData.mac_address || null,
        loginData.login_method || null,
        loginData.status || 'success',
        loginData.user_agent || null,
        loginData.platform || null
      )
      return { success: true, data: result }
    } catch (error) {
      console.error('ChatermDatabaseService.insertLoginLog 错误:', error)
      return { success: false, error: error.message }
    }
  }

  getLoginLogs(
    params: {
      limit?: number
      offset?: number
      email?: string
      startDate?: string
      endDate?: string
    } = {}
  ): any {
    try {
      const { limit = 50, offset = 0, email, startDate, endDate } = params

      let whereClauses: string[] = []
      let values: any[] = []

      if (email) {
        whereClauses.push('email = ?')
        values.push(email)
      }

      if (startDate) {
        whereClauses.push('created_at >= ?')
        values.push(startDate)
      }

      if (endDate) {
        whereClauses.push('created_at <= ?')
        values.push(endDate)
      }

      const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''

      const stmt = this.db.prepare(`
        SELECT * FROM login_log 
        ${whereClause}
        ORDER BY created_at DESC 
        LIMIT ? OFFSET ?
      `)

      const countStmt = this.db.prepare(`
        SELECT COUNT(*) as total FROM login_log ${whereClause}
      `)

      const logs = stmt.all(...values, limit, offset)
      const totalResult = countStmt.get(...values) as { total: number }

      return {
        success: true,
        data: {
          logs,
          total: totalResult.total,
          limit,
          offset
        }
      }
    } catch (error) {
      console.error('ChatermDatabaseService.getLoginLogs 错误:', error)
      return { success: false, error: error.message }
    }
  }
}
