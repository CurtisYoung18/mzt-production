"use client"

import { useState, useCallback } from "react"
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
      title: "公积金提取咨询",
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
    // Add user message for account query
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: "我要查询公积金账户信息",
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)

    try {
      // Fetch account info from API
      const response = await fetch(`/api/account/info?userId=${user.userId}`)
      if (!response.ok) {
        throw new Error("获取账户信息失败")
      }
      const { data: accountInfo } = await response.json()

      // Create AI message with account info card
      const aiMessageWithCard: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "",
        timestamp: new Date(),
        accountInfo,
      }
      setMessages((prev) => [...prev, aiMessageWithCard])

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

      const summaryMessageId = (Date.now() + 2).toString()
      setMessages((prev) => [
        ...prev,
        {
          id: summaryMessageId,
          role: "assistant",
          content: "",
          timestamp: new Date(),
        },
      ])

      // Process chunk with proper tag handling
      const processChunk = (chunk: string, isFinal = false) => {
        buffer += chunk
        
        while (true) {
          const thinkStart = buffer.indexOf("<think>")
          const thinkEnd = buffer.indexOf("</think>")
          
          if (thinkStart !== -1 && !isInThinkingMode) {
            const beforeThink = buffer.substring(0, thinkStart)
            if (beforeThink) summaryContent += beforeThink
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
          } else {
            summaryContent += safeChunk
          }
          buffer = buffer.substring(safeLength)
        } else if (isFinal && buffer.length > 0) {
          if (isInThinkingMode) {
            thinkingContent += buffer
          } else {
            summaryContent += buffer
          }
          buffer = ""
        }
      }

      // Throttled UI update
      const updateSummaryUI = (force = false) => {
        const now = Date.now()
        if (!force && now - lastUpdateTime < UPDATE_INTERVAL) return
        lastUpdateTime = now
        
        setMessages((prev) =>
          prev.map((m) =>
            m.id === summaryMessageId
              ? { 
                  ...m, 
                  content: summaryContent.replace(/<\/?think>/g, "").trim(), 
                  thinking: thinkingContent.replace(/<\/?think>/g, "").trim() || undefined,
                  thinkingComplete
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
                  updateSummaryUI(true)
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
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)
    setConnectionError(null)
    
    // Show thinking animation immediately after user message is sent
    // This ensures no blank waiting period

    try {
      const convId = await initConversation()
      const messageContent: MessageContent[] = [{ type: "text", text: content }]

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

      const aiMessageId = (Date.now() + 1).toString()
      setMessages((prev) => [
        ...prev,
        {
          id: aiMessageId,
          role: "assistant",
          content: "",
          timestamp: new Date(),
        },
      ])

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

      // Helper function to process text chunk and extract thinking/content in real-time
      const processTextChunk = (chunk: string, isFinal = false) => {
        buffer += chunk
        
        // Loop to process all complete tags in the buffer
        while (true) {
          const thinkStartIndex = buffer.indexOf("<think>")
          const thinkEndIndex = buffer.indexOf("</think>")
          
          if (thinkStartIndex !== -1 && !isInThinkingMode) {
            // Found <think>, flush content before it
            const beforeThink = buffer.substring(0, thinkStartIndex)
            if (beforeThink) fullContent += beforeThink
            
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
          } else {
            fullContent += safeChunk
          }
          buffer = buffer.substring(safeLength)
        } else if (isFinal && buffer.length > 0) {
          // Final flush
          if (isInThinkingMode) {
            thinkingContent += buffer
          } else {
            fullContent += buffer
          }
          buffer = ""
        }
      }
      
      // Throttled UI update function
      const updateUI = (force = false) => {
        const now = Date.now()
        if (!force && now - lastUpdateTime < UPDATE_INTERVAL) return
        lastUpdateTime = now
        
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMessageId
              ? {
                  ...m,
                  content: fullContent || "",
                  thinking: thinkingContent || undefined,
                  thinkingComplete: thinkingComplete,
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
                  
                  // Force final update
                  updateUI(true)
                  console.log("[v0] Stream ended")
                } else if (event.code === 11 && event.message === "MessageInfo") {
                  // MessageInfo - log for debugging
                  console.log("[v0] MessageInfo:", event.data)
                } else if (event.code === 4 && event.message === "Cost") {
                  // Cost information - log for debugging
                  console.log("[v0] Cost:", event.data)
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
      
      // Force final update
      updateUI(true)
      
      if (!fullContent && !thinkingContent) {
        setMessages((prev) =>
          prev.map((m) => (m.id === aiMessageId ? { ...m, content: "抱歉，我暂时无法处理您的请求，请稍后再试。" } : m))
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
