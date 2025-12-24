import { NextRequest, NextResponse } from "next/server"
import {
  updateThinking,
  updateThinkingByConversation,
  registerConversationMessage,
} from "@/lib/thinking-store"

/**
 * POST /api/chat/thinking/update
 * 更新思考内容
 * 
 * 请求体:
 * {
 *   messageId?: string,      // 消息ID（与 conversationId 二选一）
 *   conversationId?: string, // 会话ID（与 messageId 二选一）
 *   content: string,         // 思考内容
 *   registerMapping?: boolean // 是否注册 conversationId -> messageId 映射
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messageId, conversationId, content, registerMapping } = body

    console.log(`[ThinkingAPI] 收到更新请求 - messageId: ${messageId}, conversationId: ${conversationId}, content length: ${content?.length || 0}`)

    // 验证参数
    if (!messageId && !conversationId) {
      return NextResponse.json(
        { error: "必须提供 messageId 或 conversationId" },
        { status: 400 }
      )
    }

    if (content === undefined || content === null) {
      return NextResponse.json(
        { error: "必须提供 content" },
        { status: 400 }
      )
    }

    // 如果需要注册映射
    if (registerMapping && conversationId && messageId) {
      registerConversationMessage(conversationId, messageId)
    }

    // 更新思考内容
    if (messageId) {
      // 通过 messageId 更新
      updateThinking(messageId, content, conversationId)
      return NextResponse.json({
        success: true,
        messageId,
        conversationId,
      })
    } else if (conversationId) {
      // 通过 conversationId 更新
      const updated = updateThinkingByConversation(conversationId, content)
      if (!updated) {
        return NextResponse.json(
          { error: "未找到对应的 conversationId 映射，请先通过 messageId 创建或使用 registerMapping" },
          { status: 404 }
        )
      }
      return NextResponse.json({
        success: true,
        conversationId,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[ThinkingAPI] 更新思考内容失败:", error)
    return NextResponse.json(
      { error: "更新思考内容失败" },
      { status: 500 }
    )
  }
}

