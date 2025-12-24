/**
 * 思考内容内存存储
 * 用于存储 AI 思考过程中的实时状态更新
 */

interface ThinkingEntry {
  messageId: string
  conversationId?: string
  content: string
  updatedAt: number
  createdAt: number
}

// 存储思考内容 - messageId -> ThinkingEntry
const thinkingStore = new Map<string, ThinkingEntry>()

// conversationId -> messageId 映射（支持通过 conversationId 查找）
const conversationToMessageMap = new Map<string, string>()

// 过期时间：5分钟
const EXPIRY_TIME = 5 * 60 * 1000

// 清理间隔：1分钟
const CLEANUP_INTERVAL = 60 * 1000

// 自动清理过期条目
let cleanupTimer: NodeJS.Timeout | null = null

function startCleanup() {
  if (cleanupTimer) return
  
  cleanupTimer = setInterval(() => {
    const now = Date.now()
    const expiredKeys: string[] = []
    
    thinkingStore.forEach((entry, key) => {
      if (now - entry.updatedAt > EXPIRY_TIME) {
        expiredKeys.push(key)
      }
    })
    
    expiredKeys.forEach(key => {
      const entry = thinkingStore.get(key)
      if (entry?.conversationId) {
        conversationToMessageMap.delete(entry.conversationId)
      }
      thinkingStore.delete(key)
    })
    
    if (expiredKeys.length > 0) {
      console.log(`[ThinkingStore] 清理了 ${expiredKeys.length} 个过期条目`)
    }
  }, CLEANUP_INTERVAL)
}

// 启动清理定时器
startCleanup()

/**
 * 更新思考内容
 */
export function updateThinking(
  messageId: string,
  content: string,
  conversationId?: string
): void {
  const now = Date.now()
  const existing = thinkingStore.get(messageId)
  
  const entry: ThinkingEntry = {
    messageId,
    conversationId: conversationId || existing?.conversationId,
    content,
    updatedAt: now,
    createdAt: existing?.createdAt || now,
  }
  
  thinkingStore.set(messageId, entry)
  
  // 更新 conversationId -> messageId 映射
  if (conversationId) {
    conversationToMessageMap.set(conversationId, messageId)
  }
  
  console.log(`[ThinkingStore] 更新思考内容 - messageId: ${messageId}, conversationId: ${conversationId || 'N/A'}, content length: ${content.length}`)
}

/**
 * 通过 messageId 获取思考内容
 */
export function getThinking(messageId: string): string | null {
  const entry = thinkingStore.get(messageId)
  if (!entry) {
    console.log(`[ThinkingStore] 未找到思考内容 - messageId: ${messageId}`)
    return null
  }
  
  console.log(`[ThinkingStore] 获取思考内容 - messageId: ${messageId}, content length: ${entry.content.length}`)
  return entry.content
}

/**
 * 通过 conversationId 获取思考内容
 */
export function getThinkingByConversation(conversationId: string): string | null {
  const messageId = conversationToMessageMap.get(conversationId)
  if (!messageId) {
    console.log(`[ThinkingStore] 未找到 conversationId 映射 - conversationId: ${conversationId}`)
    return null
  }
  
  return getThinking(messageId)
}

/**
 * 通过 conversationId 更新思考内容
 */
export function updateThinkingByConversation(
  conversationId: string,
  content: string
): boolean {
  const messageId = conversationToMessageMap.get(conversationId)
  if (!messageId) {
    console.log(`[ThinkingStore] 未找到 conversationId 映射，无法更新 - conversationId: ${conversationId}`)
    return false
  }
  
  updateThinking(messageId, content, conversationId)
  return true
}

/**
 * 注册 conversationId 和 messageId 的映射关系
 */
export function registerConversationMessage(
  conversationId: string,
  messageId: string
): void {
  conversationToMessageMap.set(conversationId, messageId)
  console.log(`[ThinkingStore] 注册映射 - conversationId: ${conversationId} -> messageId: ${messageId}`)
}

/**
 * 删除思考内容
 */
export function deleteThinking(messageId: string): void {
  const entry = thinkingStore.get(messageId)
  if (entry?.conversationId) {
    conversationToMessageMap.delete(entry.conversationId)
  }
  thinkingStore.delete(messageId)
  console.log(`[ThinkingStore] 删除思考内容 - messageId: ${messageId}`)
}

/**
 * 清空所有思考内容（用于调试）
 */
export function clearAllThinking(): void {
  thinkingStore.clear()
  conversationToMessageMap.clear()
  console.log(`[ThinkingStore] 清空所有思考内容`)
}

/**
 * 获取存储状态（用于调试）
 */
export function getStoreStatus(): {
  thinkingCount: number
  mappingCount: number
} {
  return {
    thinkingCount: thinkingStore.size,
    mappingCount: conversationToMessageMap.size,
  }
}

