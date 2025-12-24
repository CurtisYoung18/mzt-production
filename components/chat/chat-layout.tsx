"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { flushSync } from "react-dom"
import ChatSidebar from "./chat-sidebar"
import ChatMain from "./chat-main"
import type { Message, ChatSession, UserBasicInfo } from "@/types/chat"

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
  
  // 流程图相关状态
  const [flowUserAttributes, setFlowUserAttributes] = useState<{
    is_auth: boolean
    is_married: boolean
    permit_extract_types: string[]
    phase: string
  } | null>(null)
  const [selectedExtractType, setSelectedExtractType] = useState<string | null>(null)
  const [isFlowFinished, setIsFlowFinished] = useState(false)
  const [showFlowChart, setShowFlowChart] = useState(false) // 只有触发 sms_sign 后才显示流程图
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
        // 标题生成失败不影响主功能，静默处理
        return
      }

      const data = await response.json()
      if (data.title) {
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
    
    // Check if we have at least 3 user messages and 3 assistant responses
    if (userMessages.length >= 3 && assistantMessages.length >= 3) {
      titleGenerationAttempted.current = true
      generateSessionTitle(messages, activeSessionId)
    } else if (userMessages.length >= 1 && assistantMessages.length >= 1) {
      // Update title with first user message if not yet set
      const currentSession = sessions.find((s) => s.id === activeSessionId)
      if (currentSession?.title === "新会话") {
        const firstUserMessage = userMessages[0].content
        const title = firstUserMessage.substring(0, 15) + (firstUserMessage.length > 15 ? "..." : "")
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

  // 获取用户属性（用于流程图）
  const fetchUserAttributes = useCallback(async () => {
    console.log("[Flow] ========== FETCHING USER ATTRIBUTES ==========")
    console.log("[Flow] Fetching for userId:", user.userId)
    try {
      const response = await fetch(`/api/user/attribute?userId=${user.userId}`)
      console.log("[Flow] Response status:", response.status)
      if (response.ok) {
        const data = await response.json()
        console.log("[Flow] Response data:", JSON.stringify(data, null, 2))
        if (data.data) {
          const newAttrs = {
            is_auth: data.data.is_auth ?? false,
            is_married: data.data.is_married ?? false,
            permit_extract_types: data.data.permit_extract_types ?? [],
            phase: data.data.phase ?? "1000"
          }
          console.log("[Flow] Setting flow attributes:", newAttrs)
          setFlowUserAttributes(newAttrs)
          console.log("[Flow] ✅ User attributes updated successfully")
        }
      } else {
        console.log("[Flow] ❌ Response not ok:", response.statusText)
      }
    } catch (error) {
      console.error("[Flow] ❌ Failed to fetch user attributes:", error)
    }
    console.log("[Flow] ========== FETCH COMPLETE ==========")
  }, [user.userId])

  // 初始化时获取用户属性
  useEffect(() => {
    fetchUserAttributes()
  }, [fetchUserAttributes])

  // 消息变化时更新用户属性（phase 可能变化）
  useEffect(() => {
    if (messages.length > 1) {
      fetchUserAttributes()
    }
  }, [messages.length, fetchUserAttributes])

  const handleNewSession = async () => {
    console.log("[NewSession] ========== STARTING NEW SESSION ==========")
    console.log("[NewSession] User:", user.userId)
    
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
    setSelectedExtractType(null) // 重置选择的提取类型
    setIsFlowFinished(false) // 重置完成状态
    setShowFlowChart(false) // 重置流程图显示状态
    
    // 重置用户 mock 数据到初始状态（用于演示）
    console.log("[NewSession] Step 1: Calling reset API...")
    try {
      const resetResponse = await fetch("/api/user/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.userId }),
      })
      const resetData = await resetResponse.json()
      console.log("[NewSession] Reset API response:", resetData)
      if (resetResponse.ok) {
        console.log("[NewSession] ✅ Reset API successful")
      } else {
        console.log("[NewSession] ❌ Reset API failed:", resetResponse.status)
      }
    } catch (error) {
      console.error("[NewSession] ❌ Failed to reset user attributes:", error)
    }
    
    // 等待一下确保数据更新完成，然后重新获取用户属性
    console.log("[NewSession] Step 2: Fetching updated user attributes...")
    await fetchUserAttributes()
    
    console.log("[NewSession] Step 3: Setting welcome message")
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content:
          "您好！我是福晓金，您的公积金智能助手。如果您的问题不在上述列表中，或者您有其他特定的需求，您也可以直接告诉我，我会根据您的描述提供个性化的帮助。",
        timestamp: new Date(),
      },
    ])
    console.log("[NewSession] ========== NEW SESSION COMPLETE ==========")
  }

  const handleDeleteSession = (id: string) => {
    setSessions(sessions.filter((s) => s.id !== id))
    if (activeSessionId === id && sessions.length > 1) {
      const remaining = sessions.filter((s) => s.id !== id)
      setActiveSessionId(remaining[0]?.id || "")
    }
  }

  // 快捷指南：公积金账户查询
  // 直接发送消息给 AI，由 AI 根据 is_auth 属性决定返回 auth 卡片还是 gjj_details 卡片
  const handleAccountQuery = async () => {
    // 直接调用 handleSendMessage，让 AI 处理
    handleSendMessage("我要查询公积金账户信息")
  }

  // 用户基本信息（用于业务卡片显示）
  const userInfo: UserBasicInfo = {
    name: user.name,
    phone: user.phone,
    idType: "二代身份证",
    idNumber: user.idCard,
    }

  // 处理业务卡片操作
  const handleBusinessCardAction = async (cardType: string, action: string, extraData?: { message?: string }) => {
    
    // 提取流程授权 (card_type: "auth", type: 1)
    if (cardType === "auth" && action === "confirm") {
      try {
        // 1. 调用 Workflow API (type: 1 - 用户授权卡片提交)
        const workflowResponse = await fetch("/api/workflow", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cardType: "auth",
            userId: user.userId,
          }),
        })

        const workflowResult = await workflowResponse.json()
        console.log("[Business Card] auth workflow result:", workflowResult)

        // 2. 只有当 Workflow 返回 success 为 true 时，才执行后续操作
        if (workflowResult.success) {
          // 更新用户 is_auth 为 true（完成授权）
          
          // 2.1 更新本地 mock 数据库
          await fetch("/api/user/attribute", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: user.userId,
              attributeName: "is_auth",
              value: true,
            }),
          })

          // 2.2 同步更新 GPTBots 用户属性
          await fetch("/api/user/gptbots-attribute", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: user.userId,
              attributeName: "is_auth",
              value: true,
            }),
          })

          // 获取用户可用的提取类型
          const attrResponse = await fetch(`/api/user/attribute?userId=${user.userId}`)
          const attrData = await attrResponse.json()
          const permitExtractTypes = attrData?.data?.permit_extract_types || []
          
          // 找到包含 auth 卡片的消息，更新它显示可用的提取类型
          setMessages((prev) => {
            const lastAuthMessageIndex = [...prev].reverse().findIndex(m => m.llmCardType === "auth")
            if (lastAuthMessageIndex === -1) return prev
            
            const actualIndex = prev.length - 1 - lastAuthMessageIndex
            return prev.map((m, i) =>
              i === actualIndex
                ? { ...m, authCompleted: true, permitExtractTypes }
                : m
            )
          })
          
          // 刷新流程图的用户属性状态
          fetchUserAttributes()
          
          // 使用 Workflow 返回的 user_message 发送确认消息
          const userMessage = workflowResult.userMessage || "我已完成授权，请继续"
          setTimeout(() => {
            handleSendMessage(userMessage)
          }, 500)
        } else {
          // Workflow 调用失败，使用返回的 userMessage 或显示错误
          const errorMessage = workflowResult.userMessage || workflowResult.error || "授权失败，请重试"
          console.error("[Business Card] Workflow 调用失败:", errorMessage)
          // 发送失败消息给 AI
          setTimeout(() => {
            handleSendMessage(errorMessage)
          }, 500)
        }
      } catch (error) {
        console.error("[Business Card] auth error:", error)
      }
    }
    
    // 查询公积金授权 (card_type: "processing_auth", type: 100) - 个人与配偶信息查询
    // 这个 type 会返回公积金账户详细数据，需要渲染到账户查询卡片
    if (cardType === "processing_auth" && action === "confirm") {
      try {
        // 1. 调用 Workflow API (type: 100 - 个人与配偶信息查询)
        const workflowResponse = await fetch("/api/workflow", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cardType: "processing_auth",
            userId: user.userId,
          }),
        })

        const workflowResult = await workflowResponse.json()
        console.log("[Business Card] processing_auth workflow result:", workflowResult)

        // 2. 只有当 Workflow 返回 success 为 true 时，才执行后续操作
        if (workflowResult.success) {
          // 2.1 更新本地 mock 数据库
          await fetch("/api/user/attribute", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: user.userId,
              attributeName: "is_auth",
              value: true,
            }),
          })

          // 2.2 同步更新 GPTBots 用户属性
          await fetch("/api/user/gptbots-attribute", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: user.userId,
              attributeName: "is_auth",
              value: true,
            }),
          })
          
          // 2.3 处理 type 100 返回的公积金账户数据
          // 将 Workflow 返回的账户数据转换为前端需要的格式
          const accountData = workflowResult.accountData || workflowResult.data
          let parsedAccountInfo = null
          
          if (accountData) {
            console.log("[Business Card] 解析公积金账户数据:", accountData)
            // 将 API 返回的字段映射到前端 AccountInfo 格式
            parsedAccountInfo = parseGjjAccountData(accountData)
          }
          
          // 找到包含 processing_auth 卡片的消息，更新 authCompleted 和账户信息
          setMessages((prev) => {
            const lastAuthMessageIndex = [...prev].reverse().findIndex(m => m.llmCardType === "processing_auth")
            if (lastAuthMessageIndex === -1) return prev
            
            const actualIndex = prev.length - 1 - lastAuthMessageIndex
            return prev.map((m, i) =>
              i === actualIndex
                ? { 
                    ...m, 
                    authCompleted: true,
                    // 如果有账户数据，添加到消息中
                    accountInfo: parsedAccountInfo || m.accountInfo,
                  }
                : m
            )
          })
          
          // 刷新流程图的用户属性状态
          fetchUserAttributes()
          
          // 使用 Workflow 返回的 user_message 发送确认消息
          const userMessage = workflowResult.userMessage || "我已完成授权，请继续"
          setTimeout(() => {
            handleSendMessage(userMessage)
          }, 500)
        } else {
          // Workflow 调用失败，使用返回的 userMessage
          const errorMessage = workflowResult.userMessage || workflowResult.error || "授权失败，请重试"
          console.error("[Business Card] Workflow 调用失败:", errorMessage)
          setTimeout(() => {
            handleSendMessage(errorMessage)
          }, 500)
        }
      } catch (error) {
        console.error("[Business Card] processing_auth error:", error)
      }
    }
    
    // 手机签约完成 (card_type: "sms_sign", type: 1121)
    if (cardType === "sms_sign" && action === "confirm") {
      try {
        // 1. 调用 Workflow API (type: 1121 - 本人手机签约卡片提交)
        const workflowResponse = await fetch("/api/workflow", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cardType: "sms_sign",
            userId: user.userId,
          }),
        })

        const workflowResult = await workflowResponse.json()
        console.log("[Business Card] sms_sign workflow result:", workflowResult)

        // 2. 只有当 Workflow 返回 success 为 true 时，才执行后续操作
        if (workflowResult.success) {
          // 手机签约完成: 更新 phase
          const response = await fetch("/api/user/attribute", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: user.userId,
              attributeName: "sms_signed",
              value: true,
            }),
          })
          console.log("[手机签约] 本地 sms_signed 更新: true")

          // 同步到 GPTBots
          await fetch("/api/user/gptbots-attribute", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: user.userId,
              attributeName: "sms_signed",
              value: true,
            }),
          })
          console.log("[手机签约] GPTBots sms_signed 已同步")

          // 刷新流程图的用户属性状态
          fetchUserAttributes()
          
          // 使用 Workflow 返回的 user_message 发送确认消息
          const userMessage = workflowResult.userMessage || "我已完成手机号签约，请继续"
          handleSendMessage(userMessage)
        } else {
          const errorMessage = workflowResult.userMessage || workflowResult.error || "手机签约失败，请重试"
          console.error("[Business Card] Workflow 调用失败:", errorMessage)
          handleSendMessage(errorMessage)
        }
      } catch (error) {
        console.error("[Business Card] sms_sign error:", error)
      }
    }
    
    // 银行卡签约完成 (card_type: "bank_sign", type: 1131)
    if (cardType === "bank_sign" && action === "confirm") {
      try {
        // 1. 调用 Workflow API (type: 1131 - 本人银行卡签约卡片提交)
        const workflowResponse = await fetch("/api/workflow", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cardType: "bank_sign",
            userId: user.userId,
          }),
        })

        const workflowResult = await workflowResponse.json()
        console.log("[Business Card] bank_sign workflow result:", workflowResult)

        // 2. 只有当 Workflow 返回 success 为 true 时，才执行后续操作
        if (workflowResult.success) {
          // 银行卡签约完成: 更新 bank_card_signed
          await fetch("/api/user/attribute", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: user.userId,
              attributeName: "bank_card_signed",
              value: true,
            }),
          })
          console.log("[银行卡签约] 本地 bank_card_signed 更新: true")

          // 同步到 GPTBots
          await fetch("/api/user/gptbots-attribute", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: user.userId,
              attributeName: "bank_card_signed",
              value: true,
            }),
          })
          console.log("[银行卡签约] GPTBots bank_card_signed 已同步")

          // 刷新流程图的用户属性状态
          fetchUserAttributes()
          
          // 使用 Workflow 返回的 user_message 发送确认消息
          const userMessage = workflowResult.userMessage || "我已完成银行卡签约，请继续"
          handleSendMessage(userMessage)
        } else {
          const errorMessage = workflowResult.userMessage || workflowResult.error || "银行卡签约失败，请重试"
          console.error("[Business Card] Workflow 调用失败:", errorMessage)
          handleSendMessage(errorMessage)
        }
      } catch (error) {
        console.error("[Business Card] bank_sign error:", error)
      }
    }
  }

  // 解析公积金账户数据（从 Workflow API 返回的格式转换为前端 AccountInfo 格式）
  const parseGjjAccountData = (data: Record<string, unknown>): Record<string, unknown> | null => {
    if (!data) return null
    
    try {
      // 将 API 返回的字段映射到前端需要的格式
      return {
        personalAccount: data.grzh || "",
        openDate: data.khrq ? String(data.khrq).substring(0, 10).replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3") : "",
        paidUntil: data.JZNY || "",
        idType: data.zjlx === "01" ? "身份证" : "其他",
        idNumber: data.zjhm || "",
        residence: data.jtzz || "",
        maritalStatus: data.hyzk === "20" ? "已婚" : data.hyzk === "10" ? "未婚" : "其他",
        phone: data.sjhm || "",
        bankName: data.styhmc || "",
        bankAccount: data.yhzh || "",
        accountType: data.zhlx === "01" ? "公积金账户" : "其他",
        accountStatus: data.grzhzt === "01" ? "正常" : data.grzhzt === "02" ? "封存" : "其他",
        sealDate: data.fcrq || null,
        depositBase: Number(data.grjcjs) || 0,
        personalRate: `${data.grjcbl || 0}%`,
        personalAmount: Number(data.gryjce) || 0,
        companyRate: `${data.dwjcbl || 0}%`,
        companyAmount: Number(data.dwyjce) || 0,
        companyName: data.dwmc || "",
        companyAccount: data.dwzh || "",
        totalBalance: Number(data.zhye) || 0,
        // 配偶信息
        spouseName: data.poxm || null,
        spouseIdNumber: data.pozjhm || null,
        // 原始数据
        rawData: data,
      }
    } catch (error) {
      console.error("[parseGjjAccountData] 解析失败:", error)
      return null
    }
  }

  // 查看提取记录
  const handleViewRecords = () => {
    setIsFlowFinished(true) // 标记流程完成
    window.location.href = "/records"
  }

  // 继续对话
  const handleContinueChat = () => {
    setIsFlowFinished(true) // 标记流程完成
    // 不做任何操作，用户可以继续输入
  }

  // 结束对话并评分
  const handleEndChat = (rating: number) => {
    setIsFlowFinished(true) // 标记流程完成
    // TODO: 发送评分到后端
    // 可以在这里添加保存评分的 API 调用
  }

  const handleSendMessage = async (content: string, attachments?: File[]) => {
    // 检测是否选择了提取类型
    const extractTypeMatch = content.match(/我要办理(.+)提取/)
    if (extractTypeMatch) {
      setSelectedExtractType(extractTypeMatch[1])
    }
    
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
        
        // 当检测到 sms_sign 或 bank_sign card 时，显示流程图
        if (isFinal && llmResponse?.card_type) {
          const cardType = llmResponse.card_type
          if (cardType === "sms_sign" || cardType === "bank_sign") {
            console.log("[流程图] 检测到签约卡片，显示流程图:", cardType)
            setShowFlowChart(true)
          }
        }
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
                } else if (event.code === 11 && event.message === "MessageInfo") {
                  // MessageInfo - log for debugging
                } else if (event.code === 4 && event.message === "Cost") {
                  // Cost information - log for debugging
                } else if (event.code >= 20000 || event.code >= 40000) {
                  // Error codes from API
                  console.error("[AI响应] ❌ API错误:", event.code, event.message)
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
      
      // 检查是否需要获取公积金详情
      const finalLlmResponse = isJsonMode ? parseLLMJsonResponse(jsonBuffer.trim()) : null
      if (finalLlmResponse?.card_type === "gjj_details") {
        try {
          // 获取账户信息
          const accountResponse = await fetch(`/api/account/info?userId=${user.userId}`)
          
          // 获取用户可用的提取类型（用于在卡片下方显示）
          const attrResponse = await fetch(`/api/user/attribute?userId=${user.userId}`)
          const attrData = await attrResponse.json()
          const permitExtractTypes = attrData?.data?.permit_extract_types || []
          
          if (accountResponse.ok) {
            const { data: accountInfo } = await accountResponse.json()
            
            // 更新当前消息，添加 accountInfo 和 permitExtractTypes
            // 布局顺序：content 在上，账户卡片在中，提取业务气泡在下
            setMessages((prev) =>
              prev.map((m) =>
                m.id === aiMessageId
                  ? { 
                      ...m, 
                      accountInfo, 
                      llmCardType: undefined,
                      content: finalLlmResponse.content || m.content, // 保留 AI 返回的 content
                      permitExtractTypes // 可办理的提取业务类型
                    }
                  : m
              )
            )
          }
        } catch (fetchError) {
          console.error("[公积金详情] ❌ 获取账户信息失败:", fetchError)
        }
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
        userAttributes={flowUserAttributes}
        selectedExtractType={selectedExtractType}
        isFlowFinished={isFlowFinished}
        showFlowChart={showFlowChart}
      />
      <ChatMain
        messages={messages}
        onSendMessage={handleSendMessage}
        onAccountQuery={handleAccountQuery}
        userId={user.userId}
        userName={user.name}
        userInfo={userInfo}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        sidebarOpen={sidebarOpen}
        isLoading={isLoading}
        connectionError={connectionError}
        showQuickActions={messages.length <= 1}
        onBusinessCardAction={handleBusinessCardAction}
        onViewRecords={handleViewRecords}
        onContinueChat={handleContinueChat}
        onEndChat={handleEndChat}
      />
    </div>
  )
}
