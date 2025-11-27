"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { flushSync } from "react-dom"
import ChatSidebar from "./chat-sidebar"
import ChatMain from "./chat-main"
import type { Message, ChatSession } from "@/types/chat"

interface User {
  userId: string
  name: string
  phone: string
  idCard: string
}

interface ChatLayoutProps {
  user: User
}

// Helper functions for file handling (client-side only)
function fileToBase64(file: File): Promise<string> {
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

function getFileFormat(mimeType: string): string {
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

function getContentType(file: File): "image" | "audio" | "document" {
  if (file.type.startsWith("image/")) return "image"
  if (file.type.startsWith("audio/")) return "audio"
  return "document"
}

interface MessageContent {
  type: "text" | "image" | "audio" | "document"
  text?: string
  image?: Array<{ base64_content?: string; url?: string; format: string; name: string }>
  audio?: Array<{ base64_content?: string; url?: string; format: string; name: string }>
  document?: Array<{ base64_content?: string; url?: string; format: string; name: string }>
}

export default function ChatLayout({ user }: ChatLayoutProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([
    {
      id: "1",
      title: "新会话",
      createdAt: new Date(),
      messages: [],
    },
  ])
  const [activeSessionId, setActiveSessionId] = useState("1")
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "您好！我是福晓金，您的公积金智能助手。如果您的问题不在上述列表中，或者您有其他特定的需求，您也可以直接告诉我，我会根据您的描述提供个性化的帮助。",
      timestamp: new Date(),
    },
  ])
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [titleGenerated, setTitleGenerated] = useState(false) // Track if title has been generated for current session
  const titleGenerationAttempted = useRef(false) // Prevent multiple title generation attempts

  // Function to generate session title using AI
  const generateSessionTitle = useCallback(async (messageList: Message[], sessionId: string) => {
    // Filter only user messages with actual content
    const userMessages = messageList.filter(
      (m) => m.id !== "welcome" && 
             m.role === "user" &&
             m.content?.trim()
    )

    // Build conversation history string - only user messages
    const conversationHistory = userMessages
      .slice(0, 3) // Take first 3 user messages
      .map((m) => m.content)
      .join("\n\n")

    console.log("[Title] Generating title with user messages:", conversationHistory.substring(0, 200))

    try {
      const response = await fetch("/api/chat/title", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.userId,
          conversationHistory,
        }),
      })

      if (!response.ok) {
        console.error("[Title] Failed to generate title")
        return
      }

      const data = await response.json()
      if (data.title) {
        console.log("[Title] Generated title:", data.title)
        setSessions((prev) =>
          prev.map((s) => (s.id === sessionId ? { ...s, title: data.title } : s))
        )
        setTitleGenerated(true)
      }
    } catch (error) {
      console.error("[Title] Error generating title:", error)
    }
  }, [user.userId])

  // Effect to trigger title generation when messages update
  useEffect(() => {
    // Skip if title already generated or generation attempted, or if still loading
    if (titleGenerated || titleGenerationAttempted.current || isLoading) {
      return
    }

    // Filter valid user messages (must have content and not be in thinking state)
    const userMessages = messages.filter(
      (m) => m.id !== "welcome" && m.role === "user" && m.content && m.content.trim() !== ""
    )
    
    // Filter valid assistant messages (must have content OR accountInfo, and not be in thinking/querying state)
    const assistantMessages = messages.filter(
      (m) => m.id !== "welcome" && 
             m.role === "assistant" && 
             !m.isThinking && 
             !m.isQuerying &&
             (m.content?.trim() || m.accountInfo)
    )
    
    console.log("[Title] Checking title generation - userMessages:", userMessages.length, "assistantMessages:", assistantMessages.length)
    
    // Check if we have at least 3 user messages and 3 assistant responses
    if (userMessages.length >= 3 && assistantMessages.length >= 3) {
      console.log("[Title] Triggering AI title generation after 3 rounds")
      titleGenerationAttempted.current = true
      generateSessionTitle(messages, activeSessionId)
    } else if (userMessages.length >= 1 && assistantMessages.length >= 1) {
      // Update title with first user message if not yet set
      const currentSession = sessions.find((s) => s.id === activeSessionId)
      if (currentSession?.title === "新会话") {
        const firstUserMessage = userMessages[0].content
        const title = firstUserMessage.substring(0, 15) + (firstUserMessage.length > 15 ? "..." : "")
        console.log("[Title] Setting initial title from first message:", title)
        setSessions((prev) =>
          prev.map((s) => (s.id === activeSessionId ? { ...s, title } : s))
        )
      }
    }
  }, [messages, isLoading, titleGenerated, activeSessionId, sessions, generateSessionTitle])

  // Reset title generation flag when switching sessions
  useEffect(() => {
    titleGenerationAttempted.current = false
    setTitleGenerated(false)
  }, [activeSessionId])

  const initConversation = useCallback(async () => {
    if (conversationId) return conversationId

    try {
      console.log("[v0] Initializing conversation via backend API...")
      const response = await fetch("/api/chat/conversation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.userId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create conversation")
      }

      const data = await response.json()
      console.log("[v0] Conversation created:", data.conversationId)
      setConversationId(data.conversationId)
      setConnectionError(null)
      return data.conversationId
    } catch (error) {
      console.error("Error initializing conversation:", error)
      const errorMsg = error instanceof Error ? error.message : "连接失败"
      setConnectionError(`无法连接到 AI 服务器: ${errorMsg}`)
      throw error
    }
  }, [conversationId, user.userId])

  const handleNewSession = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: "新会话",
      createdAt: new Date(),
      messages: [],
    }
    setSessions([newSession, ...sessions])
    setActiveSessionId(newSession.id)
    setConversationId(null)
    setConnectionError(null)
    setTitleGenerated(false) // Reset title generation flag for new session
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content:
          "您好！我是福晓金，您的公积金智能助手。如果您的问题不在上述列表中，或者您有其他特定的需求，您也可以直接告诉我，我会根据您的描述提供个性化的帮助。",
        timestamp: new Date(),
      },
    ])
  }

  const handleDeleteSession = (id: string) => {
    setSessions(sessions.filter((s) => s.id !== id))
    if (activeSessionId === id && sessions.length > 1) {
      const remaining = sessions.filter((s) => s.id !== id)
      setActiveSessionId(remaining[0]?.id || "")
    }
  }

  const handleAccountQuery = async () => {
    const userMessageId = Date.now().toString()
    const aiMessageId = (Date.now() + 1).toString()
    
    // Add user message for account query
    const userMessage: Message = {
      id: userMessageId,
      role: "user",
      content: "我要查询公积金账户信息",
      timestamp: new Date(),
    }
    
    // Create AI message with querying state immediately
    const aiMessage: Message = {
      id: aiMessageId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
      isQuerying: true, // Show "正在为您查询信息" animation
    }
    
    // Use flushSync to ensure UI updates immediately
    flushSync(() => {
      setMessages((prev) => [...prev, userMessage, aiMessage])
      setIsLoading(true)
    })

    try {
      // Fetch account info from API
      const response = await fetch(`/api/account/info?userId=${user.userId}`)
      if (!response.ok) {
        throw new Error("获取账户信息失败")
      }
      const { data: accountInfo } = await response.json()

      // Update the AI message with account info card (remove isQuerying)
      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiMessageId
            ? { ...m, accountInfo, isQuerying: false }
            : m
        )
      )

      // Now send to AI for summary
      const convId = await initConversation()
      const summaryPrompt = `用户想要查询公积金账号，这是其账号详细信息：${JSON.stringify(accountInfo)}，请做一个简短友好的总结，告诉用户他的账户基本情况。`

      const aiResponse = await fetch("/api/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: convId,
          messages: [{ role: "user", content: [{ type: "text", text: summaryPrompt }] }],
        }),
      })

      if (!aiResponse.ok) {
        throw new Error("AI 总结失败")
      }

      // Handle streaming summary
      const reader = aiResponse.body?.getReader()
      const decoder = new TextDecoder()
      let summaryContent = ""
      let thinkingContent = ""
      let isInThinkingMode = false
      let thinkingComplete = false
      let buffer = ""
      let lastUpdateTime = 0
      const UPDATE_INTERVAL = 50
      
      // JSON mode detection
      let isJsonMode: boolean | null = null
      let jsonBuffer = ""
      let extractedContent = ""

      const summaryMessageId = (Date.now() + 2).toString()
      setMessages((prev) => [
        ...prev,
        {
          id: summaryMessageId,
          role: "assistant",
          content: "",
          timestamp: new Date(),
          isThinking: true, // Show thinking animation while AI generates summary
        },
      ])
      
      // Try to extract content field from partial JSON
      const tryExtractContent = (json: string): string | null => {
        const contentMatch = json.match(/"content"\s*:\s*"((?:[^"\\]|\\.)*)(?:"|$)/)
        if (contentMatch) {
          try {
            let str = contentMatch[1]
            if (str.endsWith('\\')) str = str.slice(0, -1)
            return JSON.parse(`"${str}"`)
          } catch {
            // Fallback: manual unescape
            return contentMatch[1]
              .replace(/\\n/g, '\n')
              .replace(/\\r/g, '\r')
              .replace(/\\t/g, '\t')
              .replace(/\\"/g, '"')
              .replace(/\\\\/g, '\\')
          }
        }
        return null
      }
      
      // Parse complete JSON
      const parseJsonResponse = (content: string) => {
        const trimmed = content.trim()
        if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
          try {
            const parsed = JSON.parse(trimmed)
            if ('content' in parsed) {
              return {
                card_type: parsed.card_type,
                card_message: parsed.card_message,
                content: parsed.content || ''
              }
            }
          } catch { /* ignore */ }
        }
        return null
      }

      // Process chunk with proper tag handling
      const processChunk = (chunk: string, isFinal = false) => {
        buffer += chunk
        jsonBuffer += chunk
        
        // Detect JSON mode
        if (isJsonMode === null && jsonBuffer.trim().length > 0) {
          isJsonMode = jsonBuffer.trim().startsWith('{')
        }
        
        while (true) {
          const thinkStart = buffer.indexOf("<think>")
          const thinkEnd = buffer.indexOf("</think>")
          
          if (thinkStart !== -1 && !isInThinkingMode) {
            const beforeThink = buffer.substring(0, thinkStart)
            if (beforeThink && !isJsonMode) summaryContent += beforeThink
            isInThinkingMode = true
            buffer = buffer.substring(thinkStart + 7)
            continue
          }
          
          if (thinkEnd !== -1 && isInThinkingMode) {
            const thinkPart = buffer.substring(0, thinkEnd)
            if (thinkPart) thinkingContent += thinkPart
            isInThinkingMode = false
            thinkingComplete = true
            buffer = buffer.substring(thinkEnd + 8)
            continue
          }
          
          break
        }
        
        // Flush safe content
        const safeLength = isFinal ? 0 : Math.max(0, buffer.length - 10)
        if (safeLength > 0) {
          const safeChunk = buffer.substring(0, safeLength)
          if (isInThinkingMode) {
            thinkingContent += safeChunk
          } else if (!isJsonMode) {
            summaryContent += safeChunk
          }
          buffer = buffer.substring(safeLength)
        } else if (isFinal && buffer.length > 0) {
          if (isInThinkingMode) {
            thinkingContent += buffer
          } else if (!isJsonMode) {
            summaryContent += buffer
          }
          buffer = ""
        }
        
        // In JSON mode, try to extract content
        if (isJsonMode) {
          const extracted = tryExtractContent(jsonBuffer)
          if (extracted !== null) {
            extractedContent = extracted
          }
        }
      }

      // Throttled UI update
      const updateSummaryUI = (force = false, isFinal = false) => {
        const now = Date.now()
        if (!force && now - lastUpdateTime < UPDATE_INTERVAL) return
        lastUpdateTime = now
        
        // Final JSON parsing
        const llmResponse = isFinal ? parseJsonResponse(jsonBuffer.trim()) : null
        
        let displayContent = ""
        let shouldShowThinking = true
        let cardType = undefined
        let cardMessage = undefined
        
        if (isFinal && llmResponse) {
          displayContent = llmResponse.content
          cardType = llmResponse.card_type
          cardMessage = llmResponse.card_message
          shouldShowThinking = false
        } else if (isJsonMode) {
          displayContent = extractedContent
          shouldShowThinking = !extractedContent
        } else {
          const cleanContent = summaryContent.replace(/<\/?think>/g, "").trim()
          displayContent = cleanContent
          shouldShowThinking = !cleanContent && !thinkingComplete
        }
        
        const cleanThinking = thinkingContent.replace(/<\/?think>/g, "").trim()
        
        setMessages((prev) =>
          prev.map((m) =>
            m.id === summaryMessageId
              ? { 
                  ...m, 
                  content: displayContent, 
                  thinking: cleanThinking || undefined,
                  thinkingComplete,
                  isThinking: shouldShowThinking,
                  llmCardType: cardType,
                  llmCardMessage: cardMessage,
                }
              : m
          )
        )
      }

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const text = decoder.decode(value, { stream: true })
          const lines = text.split("\n")

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const event = JSON.parse(line.slice(6))
                if (event.code === 3 && event.message === "Text") {
                  if (typeof event.data === "string") {
                    processChunk(event.data)
                    updateSummaryUI()
                  }
                } else if (event.code === 0 && event.message === "End") {
                  processChunk("", true)
                  updateSummaryUI(true, true)
                }
              } catch {
                // Skip invalid JSON
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Account query error:", error)
      const errorMsg = error instanceof Error ? error.message : "查询失败"
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `抱歉，${errorMsg}，请稍后重试。`,
          timestamp: new Date(),
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendMessage = async (content: string, attachments?: File[]) => {
    const userMessageId = Date.now().toString()
    const aiMessageId = (Date.now() + 1).toString()
    
    const userMessage: Message = {
      id: userMessageId,
      role: "user",
      content,
      timestamp: new Date(),
    }

    // Create AI message immediately with "isThinking" state
    // This ensures the thinking animation shows INSTANTLY without any blank period
    const aiMessage: Message = {
      id: aiMessageId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
      isThinking: true, // New flag to show thinking state
    }

    // Use flushSync to ensure both messages are added synchronously
    flushSync(() => {
      setMessages((prev) => [...prev, userMessage, aiMessage])
      setIsLoading(true)
      setConnectionError(null)
    })

    try {
      const convId = await initConversation()
      const messageContent: MessageContent[] = []
      
      // Only add text content if there's actual text
      if (content && content.trim()) {
        messageContent.push({ type: "text", text: content })
      }

      // 处理附件
      if (attachments && attachments.length > 0) {
        for (const file of attachments) {
          const base64 = await fileToBase64(file)
          const format = getFileFormat(file.type)
          const contentType = getContentType(file)

          if (contentType === "image") {
            const existingImage = messageContent.find((c) => c.type === "image")
            if (existingImage && existingImage.image) {
              existingImage.image.push({ base64_content: base64, format, name: file.name })
            } else {
              messageContent.push({
                type: "image",
                image: [{ base64_content: base64, format, name: file.name }],
              })
            }
          } else if (contentType === "audio") {
            const existingAudio = messageContent.find((c) => c.type === "audio")
            if (existingAudio && existingAudio.audio) {
              existingAudio.audio.push({ base64_content: base64, format, name: file.name })
            } else {
              messageContent.push({
                type: "audio",
                audio: [{ base64_content: base64, format, name: file.name }],
              })
            }
          } else {
            const existingDoc = messageContent.find((c) => c.type === "document")
            if (existingDoc && existingDoc.document) {
              existingDoc.document.push({ base64_content: base64, format, name: file.name })
            } else {
              messageContent.push({
                type: "document",
                document: [{ base64_content: base64, format, name: file.name }],
              })
            }
          }
        }
      }

      console.log("[v0] Sending message via backend API...")
      const response = await fetch("/api/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: convId,
          messages: [{ role: "user", content: messageContent }],
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to send message")
      }

      // Handle streaming response with real-time thinking parsing
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let fullContent = ""
      let thinkingContent = ""
      let isInThinkingMode = false
      let thinkingComplete = false
      let buffer = "" // Buffer for incomplete tags
      let lastUpdateTime = 0
      const UPDATE_INTERVAL = 50 // Throttle updates to every 50ms
      
      // JSON mode detection and parsing
      let isJsonMode: boolean | null = null // null = not yet determined, true = JSON mode, false = normal mode
      let jsonBuffer = "" // Accumulate all content for JSON parsing
      let extractedContent = "" // Extracted content field from JSON (for streaming display)

      // Try to extract content field from partial JSON
      const tryExtractJsonContent = (json: string): string | null => {
        // Look for "content": "..." pattern - handle escaped characters
        const contentMatch = json.match(/"content"\s*:\s*"((?:[^"\\]|\\.)*)(?:"|$)/)
        if (contentMatch) {
          // Unescape the content using JSON.parse
          try {
            // Make sure we have a complete string for JSON.parse
            let str = contentMatch[1]
            // If the string ends with incomplete escape, remove it
            if (str.endsWith('\\')) {
              str = str.slice(0, -1)
            }
            return JSON.parse(`"${str}"`)
          } catch {
            // Fallback: manual unescape for common cases
            return contentMatch[1]
              .replace(/\\n/g, '\n')
              .replace(/\\r/g, '\r')
              .replace(/\\t/g, '\t')
              .replace(/\\"/g, '"')
              .replace(/\\\\/g, '\\')
          }
        }
        return null
      }

      // Helper function to process text chunk and extract thinking/content in real-time
      const processTextChunk = (chunk: string, isFinal = false) => {
        buffer += chunk
        jsonBuffer += chunk // Also accumulate for JSON detection
        
        // Detect JSON mode on first meaningful content
        if (isJsonMode === null && jsonBuffer.trim().length > 0) {
          isJsonMode = jsonBuffer.trim().startsWith('{')
          if (isJsonMode) {
            console.log("[v0] JSON mode detected - will show thinking until content extracted")
          }
        }
        
        // Loop to process all complete tags in the buffer
        while (true) {
          const thinkStartIndex = buffer.indexOf("<think>")
          const thinkEndIndex = buffer.indexOf("</think>")
          
          if (thinkStartIndex !== -1 && !isInThinkingMode) {
            // Found <think>, flush content before it
            const beforeThink = buffer.substring(0, thinkStartIndex)
            if (beforeThink && !isJsonMode) fullContent += beforeThink
            
            // Switch mode and advance buffer past <think>
            isInThinkingMode = true
            buffer = buffer.substring(thinkStartIndex + 7)
            continue
          }
          
          if (thinkEndIndex !== -1 && isInThinkingMode) {
            // Found </think>, flush thinking content before it
            const thinkingPart = buffer.substring(0, thinkEndIndex)
            if (thinkingPart) thinkingContent += thinkingPart
            
            // Switch mode and advance buffer past </think>
            isInThinkingMode = false
            thinkingComplete = true
            buffer = buffer.substring(thinkEndIndex + 8)
            continue
          }
          
          // No complete tags found
          break
        }
        
        // Process remaining buffer
        // Only flush safe part if not final, to avoid splitting tags across chunks
        // Keep last 10 chars in buffer unless it's the final chunk
        const safeLength = isFinal ? 0 : Math.max(0, buffer.length - 10)
        
        if (safeLength > 0) {
          const safeChunk = buffer.substring(0, safeLength)
          if (isInThinkingMode) {
            thinkingContent += safeChunk
          } else if (!isJsonMode) {
            // Only add to fullContent if not in JSON mode
            fullContent += safeChunk
          }
          buffer = buffer.substring(safeLength)
        } else if (isFinal && buffer.length > 0) {
          // Final flush
          if (isInThinkingMode) {
            thinkingContent += buffer
          } else if (!isJsonMode) {
            fullContent += buffer
          }
          buffer = ""
        }
        
        // In JSON mode, try to extract content for streaming display
        if (isJsonMode) {
          const extracted = tryExtractJsonContent(jsonBuffer)
          if (extracted !== null) {
            extractedContent = extracted
          }
        }
      }
      
      // Parse LLM JSON response format (final parsing)
      const parseLLMJsonResponse = (content: string) => {
        if (!content) return null
        const trimmed = content.trim()
        // Check if it looks like JSON
        if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
          try {
            const parsed = JSON.parse(trimmed)
            if ('content' in parsed) {
              return {
                card_type: parsed.card_type,
                card_message: parsed.card_message,
                content: parsed.content || ''
              }
            }
          } catch {
            // Not valid JSON
          }
        }
        return null
      }
      
      // Throttled UI update function
      const updateUI = (force = false, isFinal = false) => {
        const now = Date.now()
        if (!force && now - lastUpdateTime < UPDATE_INTERVAL) return
        lastUpdateTime = now
        
        // Final JSON parsing
        const llmResponse = isFinal ? parseLLMJsonResponse(jsonBuffer.trim()) : null
        
        // Determine what content to display
        let displayContent = ""
        let shouldShowThinking = true
        
        if (isFinal && llmResponse) {
          // Final: use parsed JSON content
          displayContent = llmResponse.content
          shouldShowThinking = false
        } else if (isJsonMode) {
          // JSON mode: show extracted content if available, otherwise keep thinking
          displayContent = extractedContent
          shouldShowThinking = !extractedContent // Keep thinking until content is extracted
        } else {
          // Normal mode: show fullContent
          displayContent = fullContent || ""
          shouldShowThinking = !fullContent && !thinkingComplete
        }
        
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMessageId
              ? {
                  ...m,
                  content: displayContent,
                  thinking: thinkingContent || undefined,
                  thinkingComplete: thinkingComplete,
                  isThinking: shouldShowThinking,
                  // Add LLM card fields if present (only on final)
                  llmCardType: llmResponse?.card_type || undefined,
                  llmCardMessage: llmResponse?.card_message || undefined,
                }
              : m
          )
        )
      }

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const text = decoder.decode(value, { stream: true })
          const lines = text.split("\n")

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const event = JSON.parse(line.slice(6))
                console.log("[v0] Stream event:", event.code, event.message)

                // Handle different event types per API docs
                if (event.code === 3 && event.message === "Text") {
                  // Text content - process in real-time
                  if (typeof event.data === "string") {
                    processTextChunk(event.data)
                    updateUI() // Throttled update
                  }
                } else if (event.code === 10 && event.message === "FlowOutput") {
                  // FlowOutput often contains the full/partial content that might duplicate what received in Text events.
                  // We intentionally ignore it to prevent duplication, relying on Text events for streaming.
                  console.log("[v0] Skipping FlowOutput to prevent duplication")
                } else if (event.code === 39 && event.message === "Audio") {
                  // Audio transcript
                  if (event.data?.transcript) {
                    fullContent += event.data.transcript
                    setMessages((prev) =>
                      prev.map((m) =>
                        m.id === aiMessageId
                          ? {
                              ...m,
                              content: fullContent,
                              thinking: thinkingContent || undefined,
                            }
                          : m
                      )
                    )
                  }
                } else if (event.code === 0 && event.message === "End") {
                  // Stream ended - process any remaining buffer
                  processTextChunk("", true) // Flush buffer
                  
                  // Clean up any remaining tags or partial tags
                  // Remove </think> and any trailing partial tags like </think
                  thinkingContent = thinkingContent
                    .replace(/<\/think>/g, "")
                    .replace(/<\/think$/i, "")
                    .replace(/<\/thin$/i, "")
                    .replace(/<\/thi$/i, "")
                    .replace(/<\/th$/i, "")
                    .replace(/<\/t$/i, "")
                    .replace(/<\/$|<$|[^>]$/i, (match) => match.startsWith("</") || match.startsWith("<") ? "" : match)
                    .trim()
                    
                  // Clean up fullContent
                  fullContent = fullContent
                    .replace(/<think>/g, "")
                    .replace(/<\/think>/g, "")
                    .trim()
                  
                  // Force final update with JSON parsing
                  updateUI(true, true)
                  console.log("[v0] Stream ended")
                } else if (event.code === 11 && event.message === "MessageInfo") {
                  // MessageInfo - log for debugging
                  console.log("[v0] MessageInfo:", event.data)
                } else if (event.code === 4 && event.message === "Cost") {
                  // Cost information - log for debugging
                  console.log("[v0] Cost:", event.data)
                } else if (event.code >= 20000 || event.code >= 40000) {
                  // Error codes from API
                  console.error("[v0] API Error:", event.code, event.message)
                  fullContent = "抱歉，处理您的请求时出现了问题，请稍后再试。"
                  updateUI(true)
                }
              } catch {
                // Skip invalid JSON
              }
            }
          }
        }
      }

      // Final processing if stream ended without End event
      processTextChunk("", true)
      
      // Clean up any remaining tags
      thinkingContent = thinkingContent
        .replace(/<\/think>/g, "")
        .replace(/<\/think$/i, "")
        .trim()
      
      fullContent = fullContent.replace(/<think>/g, "").replace(/<\/think>/g, "").trim()
      
      // Force final update with JSON parsing
      updateUI(true, true)
      
      // Check for empty content - in JSON mode, check jsonBuffer instead of fullContent
      const hasContent = isJsonMode ? (jsonBuffer.trim().length > 0) : (fullContent.length > 0)
      
      if (!hasContent && !thinkingContent) {
        setMessages((prev) =>
          prev.map((m) => (m.id === aiMessageId ? { ...m, content: "抱歉，我暂时无法处理您的请求，请稍后再试。", isThinking: false } : m))
        )
      } else {
        // Ensure isThinking is cleared after stream completes
        setMessages((prev) =>
          prev.map((m) => (m.id === aiMessageId ? { ...m, isThinking: false } : m))
        )
      }
    } catch (error) {
      console.error("Error sending message:", error)
      const errorMsg = error instanceof Error ? error.message : "发生未知错误"
      setConnectionError(`发送消息失败: ${errorMsg}`)

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `抱歉，发生了错误: ${errorMsg}`,
          timestamp: new Date(),
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex h-screen bg-background">
      <ChatSidebar
        user={user}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={setActiveSessionId}
        onNewSession={handleNewSession}
        onDeleteSession={handleDeleteSession}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onAccountQuery={handleAccountQuery}
        onExtraction={handleSendMessage}
        showQuickActions={messages.length > 1}
      />
      <ChatMain
        messages={messages}
        onSendMessage={handleSendMessage}
        onAccountQuery={handleAccountQuery}
        userId={user.userId}
        userName={user.name}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        sidebarOpen={sidebarOpen}
        isLoading={isLoading}
        connectionError={connectionError}
        showQuickActions={messages.length <= 1}
      />
    </div>
  )
}
