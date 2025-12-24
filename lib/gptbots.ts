// GPTBots API Client for Private Deployment (Server-side)
// Uses custom fetch with SSL certificate bypass for Vercel deployment

import http from "http"
import https from "https"
import { Readable } from "stream"

// Agent Key - 用于与 GPTBots Agent 交互
const GPTBOTS_AGENT_KEY = process.env.GPTBOTS_AGENT_KEY || "app-LfqJtziJlLlAppTpsKgq21ck"

// Workflow Key - 用于调用 GPTBots Workflow API
const GPTBOTS_WORKFLOW_KEY = process.env.GPTBOTS_WORKFLOW_KEY || "app-6U1jipKo3AN4qLrf7wzl4UqP"

// GPTBots Base URL
const GPTBOTS_BASE_URL = process.env.GPTBOTS_BASE_URL || "https://api-sg.gptbots.ai"

// Create HTTPS agent that ignores SSL certificate errors
const httpsAgent = new https.Agent({
  rejectUnauthorized: false, // Ignore SSL certificate errors
})

// Custom fetch function that bypasses SSL certificate validation
async function fetchWithSSLBypass(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url)
    const isHttps = urlObj.protocol === "https:"
    const httpModule = isHttps ? https : http
    
    const requestOptions: http.RequestOptions | https.RequestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || "GET",
      headers: options.headers as Record<string, string>,
      ...(isHttps ? { agent: httpsAgent } : {}),
    }

    const req = httpModule.request(requestOptions, (res) => {
      const chunks: Uint8Array[] = []
      
      res.on("data", (chunk: Buffer) => {
        chunks.push(new Uint8Array(chunk))
      })

      res.on("end", () => {
        // Concatenate all chunks into a single Uint8Array
        const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0)
        const body = new Uint8Array(totalLength)
        let offset = 0
        for (const chunk of chunks) {
          body.set(chunk, offset)
          offset += chunk.length
        }
        
        // Create a Response-like object
        const response = new Response(body, {
          status: res.statusCode || 200,
          statusText: res.statusMessage || "OK",
          headers: res.headers as HeadersInit,
        })
        
        resolve(response)
      })
    })

    req.on("error", (error: any) => {
      // Handle SSL errors more gracefully
      if (error.code === "EPROTO" || error.message?.includes("SSL") || error.message?.includes("TLS")) {
        const errorMsg = `SSL/TLS error: ${error.message}. ` +
          `If the server uses HTTP instead of HTTPS, update GPTBOTS_BASE_URL to use http://`
        reject(new Error(errorMsg))
      } else {
        reject(error)
      }
    })

    // Write body if present
    if (options.body) {
      if (typeof options.body === "string") {
        req.write(options.body)
      } else if (options.body instanceof ReadableStream) {
        // Handle stream
        const reader = options.body.getReader()
        const pump = async () => {
          try {
            while (true) {
              const { done, value } = await reader.read()
              if (done) break
              req.write(Buffer.from(value))
            }
            req.end()
          } catch (err) {
            req.destroy(err as Error)
          }
        }
        pump()
        return
      }
    }

    req.end()
  })
}

// For streaming responses
function fetchStreamWithSSLBypass(
  url: string,
  options: RequestInit = {}
): Promise<ReadableStream<Uint8Array>> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url)
    const isHttps = urlObj.protocol === "https:"
    const httpModule = isHttps ? https : http
    
    const requestOptions: http.RequestOptions | https.RequestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || "GET",
      headers: options.headers as Record<string, string>,
      ...(isHttps ? { agent: httpsAgent } : {}),
    }

    const req = httpModule.request(requestOptions, (res) => {
      if (res.statusCode && res.statusCode >= 400) {
        let errorBody = ""
        res.on("data", (chunk) => {
          errorBody += chunk.toString()
        })
        res.on("end", () => {
          reject(new Error(`HTTP ${res.statusCode}: ${errorBody}`))
        })
        return
      }

      // Convert Node.js stream to Web ReadableStream
      const readable = new ReadableStream<Uint8Array>({
        start(controller) {
          res.on("data", (chunk: Buffer) => {
            controller.enqueue(new Uint8Array(chunk))
          })
          res.on("end", () => {
            controller.close()
          })
          res.on("error", (err) => {
            controller.error(err)
          })
        },
        cancel() {
          res.destroy()
        },
      })

      resolve(readable)
    })

    req.on("error", (error: any) => {
      // Handle SSL errors more gracefully
      if (error.code === "EPROTO" || error.message?.includes("SSL") || error.message?.includes("TLS")) {
        const errorMsg = `SSL/TLS error: ${error.message}. ` +
          `If the server uses HTTP instead of HTTPS, update GPTBOTS_BASE_URL to use http://`
        reject(new Error(errorMsg))
      } else {
        reject(error)
      }
    })

    // Write body if present
    if (options.body) {
      if (typeof options.body === "string") {
        req.write(options.body)
      }
    }

    req.end()
  })
}

export interface MessageContent {
  type: "text" | "image" | "audio" | "document"
  text?: string
  image?: Array<{
    base64_content?: string
    url?: string
    format: string
    name: string
  }>
  audio?: Array<{
    base64_content?: string
    url?: string
    format: string
    name: string
  }>
  document?: Array<{
    base64_content?: string
    url?: string
    format: string
    name: string
  }>
}

export interface GPTBotsMessage {
  role: "user" | "assistant"
  content: string | MessageContent[]
}

export interface ConversationConfig {
  long_term_memory?: boolean
  short_term_memory?: boolean
}

export interface CreateConversationResponse {
  conversation_id: string
}

export interface SendMessageResponse {
  create_time: number
  conversation_id: string
  message_id: string
  output: Array<{
    from_component_branch: string
    from_component_name: string
    content: {
      text?: string
      audio?: Array<{
        audio: string
        transcript: string
      }>
    }
  }>
}

// Streaming response types
export interface StreamEvent {
  code: number
  message: string
  data: unknown
}

// Create a new conversation
export async function createConversation(userId: string): Promise<string> {
  const url = `${GPTBOTS_BASE_URL}/v1/conversation`
  console.log("[GPTBots 会话] 创建会话 - 用户:", userId)
  console.log("[GPTBots 会话] API 地址:", url)

  try {
    const response = await fetchWithSSLBypass(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GPTBOTS_AGENT_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ user_id: userId }),
    })

    console.log("[GPTBots 会话] 响应状态:", response.status)
    const responseText = await response.text()
    console.log("[GPTBots 会话] 响应内容:", responseText.substring(0, 500))

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${responseText}`)
    }

    const data: CreateConversationResponse = JSON.parse(responseText)
    console.log("[GPTBots 会话] ✅ 会话已创建:", data.conversation_id)
    return data.conversation_id
  } catch (error) {
    console.error("[GPTBots 会话] ❌ 创建会话失败:", error)
    throw error
  }
}

// Update user properties in GPTBots
export interface PropertyValue {
  property_name: string
  value: unknown
}

export async function updateUserProperties(
  userId: string,
  propertyValues: PropertyValue[]
): Promise<boolean> {
  const url = `${GPTBOTS_BASE_URL}/v1/property/update`
  console.log("[GPTBots 属性] 更新用户属性 - 用户:", userId)
  console.log("[GPTBots 属性] 属性值:", JSON.stringify(propertyValues))

  try {
    const response = await fetchWithSSLBypass(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GPTBOTS_AGENT_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: userId,
        property_values: propertyValues,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[GPTBots 属性] ❌ 更新失败:", response.status, errorText)
      return false
    }

    console.log("[GPTBots 属性] ✅ 用户属性已更新")
    return true
  } catch (error) {
    console.error("[GPTBots 属性] ❌ 更新出错:", error)
    return false
  }
}

// Send message with streaming support
export async function sendMessageStreaming(
  conversationId: string,
  messages: GPTBotsMessage[],
  config?: ConversationConfig,
): Promise<ReadableStream<Uint8Array>> {
  const url = `${GPTBOTS_BASE_URL}/v2/conversation/message`
  console.log("[GPTBots 消息] 发送消息 - 会话ID:", conversationId)

  const stream = await fetchStreamWithSSLBypass(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GPTBOTS_AGENT_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      conversation_id: conversationId,
      response_mode: "streaming",
      messages,
      conversation_config: config,
    }),
  })

  console.log("[GPTBots 消息] ✅ 流式响应已创建")
  return stream
}

// Send message with blocking mode
export async function sendMessageBlocking(
  conversationId: string,
  messages: GPTBotsMessage[],
  config?: ConversationConfig,
): Promise<SendMessageResponse> {
  const url = `${GPTBOTS_BASE_URL}/v2/conversation/message`

  const response = await fetchWithSSLBypass(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GPTBOTS_AGENT_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      conversation_id: conversationId,
      response_mode: "blocking",
      messages,
      conversation_config: config,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`HTTP ${response.status}: ${errorText}`)
  }

  return response.json() as Promise<SendMessageResponse>
}

// Helper to convert file to base64
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      const result = reader.result as string
      const base64 = result.split(",")[1]
      resolve(base64)
    }
    reader.onerror = (error) => reject(error)
  })
}

// Helper to get file format from mime type
export function getFileFormat(mimeType: string): string {
  const formatMap: Record<string, string> = {
    "image/jpeg": "jpeg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/webp": "webp",
    "audio/mpeg": "mp3",
    "audio/mp3": "mp3",
    "audio/wav": "wav",
    "application/pdf": "pdf",
    "text/plain": "txt",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "text/csv": "csv",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
    "text/html": "html",
    "application/json": "json",
    "text/markdown": "md",
  }
  return formatMap[mimeType] || "txt"
}

// Helper to determine content type from file
export function getContentType(file: File): "image" | "audio" | "document" {
  if (file.type.startsWith("image/")) return "image"
  if (file.type.startsWith("audio/")) return "audio"
  return "document"
}

// Parse streaming response
export function parseStreamEvent(line: string): StreamEvent | null {
  if (!line.trim()) return null
  try {
    return JSON.parse(line)
  } catch {
    return null
  }
}

// Workflow API 调用接口

// 卡片类型到 type 值的映射（租房提取流程）
export const CARD_TYPE_TO_WORKFLOW_TYPE: Record<string, number> = {
  "user_unauth": 1,             // 用户授权卡片提交
  "auth": 1,                    // 用户授权卡片提交 (兼容旧名称)
  "prefill_info": 100,          // 个人与配偶信息查询 (用于签约预填)
  "processing_auth": 100,       // 个人与配偶信息查询 (兼容旧名称)
  "account_info": 200,          // 账户信息查询 (type=200)
  "mate_sms": 1071,             // 配偶手机签约卡片提交
  "mate_sign": 1081,            // 配偶授权卡片提交
  "spouse_sign": 1071,          // 配偶签约卡片提交 (兼容旧名称)
  "spouse_auth": 1081,          // 配偶授权卡片提交 (兼容旧名称)
  "sms_sign": 1121,             // 本人手机签约卡片提交
  "bank_sign": 1131,            // 本人银行卡签约卡片提交
  "extract_submit": 1132,       // 提取提交卡片提交
}

export interface WorkflowRequest {
  cardType: string // 卡片类型：auth, sms_sign, bank_sign 等
  userId: string // 用户ID
  type?: number // 可选：直接指定 type 值，否则根据 cardType 映射
  extraInput?: Record<string, unknown> // 额外的 input 参数（如 code, mobile）
}

// Workflow API 原始响应格式
export interface WorkflowRawResponse {
  workflowId?: string
  workflowName?: string
  workflowVersion?: string
  workflowRunId?: string
  input?: {
    data: string // JSON 字符串
    type: number
  }
  output?: {
    data?: string // JSON 字符串，包含实际业务数据 (type=200 返回)
    display_info?: string // JSON 字符串，包含预填信息 (type=100 返回)
    is_attr_changed?: boolean
    user_message?: string
  }
  workflowExecutionTime?: number
  status?: string // SUCCEED, FAILED, PENDING, RUNNING
  totalCost?: number
  totalTokens?: number
  startTime?: number
  endTime?: number
}

// 解析后的 Workflow 响应
export interface WorkflowResponse {
  success: boolean // 是否成功
  userMessage?: string // 用户消息（用于自动发送）
  isAttrChanged?: boolean // 是否属性发生变化
  data?: Record<string, unknown> // 解析后的业务数据 (type=200)
  displayInfo?: Record<string, unknown> // 解析后的预填信息 (type=100)
  rawResponse?: WorkflowRawResponse // 原始响应
}

// 解析 type 100 返回的公积金账户数据
export interface GjjAccountData {
  xingming?: string // 姓名
  zjhm?: string // 证件号码
  sjhm?: string // 手机号码
  grzh?: string // 个人账户
  zhye?: string // 账户余额
  grjcbl?: string // 个人缴存比例
  dwjcbl?: string // 单位缴存比例
  grjcjs?: string // 个人缴存基数
  gryjce?: string // 个人月缴存额
  dwyjce?: string // 单位月缴存额
  dwmc?: string // 单位名称
  dwzh?: string // 单位账户
  grzhzt?: string // 个人账户状态
  khrq?: string // 开户日期
  styhmc?: string // 受托银行名称
  hyzk?: string // 婚姻状况
  poxm?: string // 配偶姓名
  pozjhm?: string // 配偶证件号码
  pozjlx?: string // 配偶证件类型
  // 更多字段...
  [key: string]: unknown
}

/**
 * 调用 GPTBots Workflow API
 * 根据 doc/工作流api.md 文档格式
 * 
 * @param request Workflow 请求参数
 * @returns Workflow 响应结果
 */
export async function callWorkflowAPI(request: WorkflowRequest): Promise<WorkflowResponse> {
  const url = `${GPTBOTS_BASE_URL}/v1/workflow/invoke`
  
  // 获取 type 值：优先使用传入的 type，否则根据 cardType 映射
  const typeValue = request.type ?? CARD_TYPE_TO_WORKFLOW_TYPE[request.cardType]
  
  if (typeValue === undefined) {
    console.error("[Workflow API] ❌ 未知的卡片类型:", request.cardType)
    return {
      success: false,
      userMessage: "未知的卡片类型",
    }
  }
  
  console.log("[Workflow API] 调用 Workflow - 卡片类型:", request.cardType, "type:", typeValue)
  console.log("[Workflow API] 用户ID:", request.userId)
  console.log("[Workflow API] API 地址:", url)

  // 构建请求体：按照文档格式
  const inputData: Record<string, unknown> = { userId: request.userId }
  // 合并额外的 input 参数（如 code, mobile）
  if (request.extraInput) {
    Object.assign(inputData, request.extraInput)
  }
  
  const requestBody = {
    userId: request.userId,
    input: {
      data: JSON.stringify(inputData),
      type: typeValue,
    },
    isAsync: false, // 同步执行
  }

  console.log("[Workflow API] 请求体:", JSON.stringify(requestBody, null, 2))

  try {
    const response = await fetchWithSSLBypass(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GPTBOTS_WORKFLOW_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    })

    console.log("[Workflow API] 响应状态:", response.status)
    const responseText = await response.text()
    console.log("[Workflow API] 响应内容:", responseText.substring(0, 1000))

    if (!response.ok) {
      console.error("[Workflow API] ❌ 调用失败:", response.status, responseText)
      return {
        success: false,
        userMessage: `Workflow API 调用失败: HTTP ${response.status}`,
      }
    }

    try {
      const rawResponse: WorkflowRawResponse = JSON.parse(responseText)
      console.log("[Workflow API] ✅ Workflow 响应状态:", rawResponse.status)
      
      // 检查执行状态
      if (rawResponse.status !== "SUCCEED") {
        console.error("[Workflow API] ❌ Workflow 执行失败:", rawResponse.status)
        return {
          success: false,
          userMessage: `Workflow 执行失败: ${rawResponse.status}`,
          rawResponse,
        }
      }
      
      // 解析 output
      const output = rawResponse.output
      if (!output) {
        console.log("[Workflow API] ⚠️ 没有 output 数据")
        return {
          success: true,
          rawResponse,
        }
      }
      
      // 解析 output.data（JSON 字符串）- type=200 账户信息
      let parsedData: Record<string, unknown> = {}
      if (output.data) {
        try {
          parsedData = JSON.parse(output.data)
          console.log("[Workflow API] 解析后的业务数据 (data):", JSON.stringify(parsedData, null, 2).substring(0, 500))
        } catch (parseDataError) {
          console.error("[Workflow API] ⚠️ 解析 output.data 失败:", parseDataError)
        }
      }
      
      // 解析 output.display_info（JSON 字符串）- type=100 预填信息
      let parsedDisplayInfo: Record<string, unknown> = {}
      if (output.display_info) {
        try {
          parsedDisplayInfo = JSON.parse(output.display_info)
          console.log("[Workflow API] 解析后的预填信息 (display_info):", JSON.stringify(parsedDisplayInfo, null, 2).substring(0, 500))
        } catch (parseDisplayInfoError) {
          console.error("[Workflow API] ⚠️ 解析 output.display_info 失败:", parseDisplayInfoError)
        }
      }
      
      // 检查业务状态（code 字段）
      const code = parsedData.code as number | undefined
      const isEligible = parsedData.is_eligible as boolean | undefined
      
      // 判断是否成功：
      // - code 为 0 或 is_eligible 为 true
      // - 或者有 display_info/data 返回（type=100/200 查询场景）
      const isSuccess = code === 0 || isEligible === true || Object.keys(parsedDisplayInfo).length > 0 || Object.keys(parsedData).length > 0
      
      console.log("[Workflow API] 业务状态 - code:", code, "is_eligible:", isEligible, "成功:", isSuccess)
      
      return {
        success: isSuccess,
        userMessage: output.user_message,
        isAttrChanged: output.is_attr_changed,
        data: Object.keys(parsedData).length > 0 ? parsedData : undefined,
        displayInfo: Object.keys(parsedDisplayInfo).length > 0 ? parsedDisplayInfo : undefined,
        rawResponse,
      }
    } catch (parseError) {
      console.error("[Workflow API] ❌ 响应解析失败:", parseError)
      return {
        success: false,
        userMessage: "Workflow API 响应解析失败",
      }
    }
  } catch (error) {
    console.error("[Workflow API] ❌ 调用出错:", error)
    return {
      success: false,
      userMessage: error instanceof Error ? error.message : "Workflow API 调用出错",
    }
  }
}
