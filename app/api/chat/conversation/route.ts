import { type NextRequest, NextResponse } from "next/server"
import { createConversation } from "@/lib/gptbots"
import { getUserById } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = body

    console.log("[会话创建] 开始创建会话 - 用户:", userId)

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }

    // Validate userId length (max 32 characters per API docs)
    if (typeof userId !== "string" || userId.length > 32) {
      return NextResponse.json(
        { error: "userId must be a string with maximum 32 characters" },
        { status: 400 }
      )
    }

    // 验证 user_id 是否存在于 mock 数据中
    const user = await getUserById(userId)
    if (!user) {
      console.log("[会话创建] ⚠️ 用户不存在于 mock 数据中:", userId)
      return NextResponse.json(
        { error: `用户 ${userId} 不存在于系统中` },
        { status: 404 }
      )
    }
    console.log("[会话创建] ✅ 用户验证通过:", user.user_id)

    // Create conversation
    const conversationId = await createConversation(userId)
    console.log("[会话创建] ✅ 会话ID:", conversationId)

    return NextResponse.json({ conversationId })
  } catch (error) {
    console.error("[会话创建] ❌ 创建失败:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to create conversation"
    return NextResponse.json(
      { error: errorMessage, stack: error instanceof Error ? error.stack : undefined },
      { status: 500 },
    )
  }
}
