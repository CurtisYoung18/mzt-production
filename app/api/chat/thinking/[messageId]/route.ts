import { NextRequest, NextResponse } from "next/server"
import { getThinking } from "@/lib/thinking-store"

/**
 * GET /api/chat/thinking/:messageId
 * 获取思考内容
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    // Next.js 15 中 params 是 Promise，需要 await
    const { messageId } = await params

    console.log(`[ThinkingAPI] 获取思考内容 - messageId: ${messageId}`)

    if (!messageId) {
      return NextResponse.json(
        { error: "必须提供 messageId" },
        { status: 400 }
      )
    }

    const content = getThinking(messageId)

    if (content === null) {
      return NextResponse.json({
        success: true,
        messageId,
        content: null,
        found: false,
      })
    }

    return NextResponse.json({
      success: true,
      messageId,
      content,
      found: true,
    })
  } catch (error) {
    console.error("[ThinkingAPI] 获取思考内容失败:", error)
    return NextResponse.json(
      { error: "获取思考内容失败" },
      { status: 500 }
    )
  }
}

