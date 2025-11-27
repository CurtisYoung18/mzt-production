// GPTBots API Client for Private Deployment (Server-side)
// Uses custom fetch with SSL certificate bypass for Vercel deployment

import http from "http"
import https from "https"
import { Readable } from "stream"

const GPTBOTS_API_KEY = process.env.GPTBOTS_API_KEY || "app-O9qte2NIaa2JgFFS7ePpK69c"
const GPTBOTS_BASE_URL = process.env.GPTBOTS_BASE_URL || "https://27.156.118.33:40443"

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
      const chunks: Buffer[] = []
      
      res.on("data", (chunk) => {
        chunks.push(chunk)
      })

      res.on("end", () => {
        const body = Buffer.concat(chunks)
        
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
        Authorization: `Bearer ${GPTBOTS_API_KEY}`,
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
        Authorization: `Bearer ${GPTBOTS_API_KEY}`,
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
      Authorization: `Bearer ${GPTBOTS_API_KEY}`,
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
      Authorization: `Bearer ${GPTBOTS_API_KEY}`,
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
