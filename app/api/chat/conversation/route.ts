import { type NextRequest, NextResponse } from "next/server"
import { createConversation, updateUserProperties, type PropertyValue } from "@/lib/gptbots"
import { getUserById, getUserAttributes } from "@/lib/db"

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
    console.log("[会话创建] ✅ 用户验证通过 - 从 mock 数据中获取:", user.user_id)

    // Create conversation
    const conversationId = await createConversation(userId)
    console.log("[会话创建] ✅ 会话ID:", conversationId)

    // Fetch user attributes from database and sync to GPTBots
    try {
      console.log("[属性同步] 获取用户属性 - 用户:", userId)
      const userAttributes = await getUserAttributes(userId)
      
      if (userAttributes) {
        console.log("[属性同步] 用户属性:", {
          phase: userAttributes.phase,
          is_auth: userAttributes.is_auth,
          city: userAttributes.city
        })
        
        // Build property values array for GPTBots
        const propertyValues: PropertyValue[] = [
          { property_name: "city", value: userAttributes.city },
          { property_name: "phase", value: userAttributes.phase },
          { property_name: "is_auth", value: userAttributes.is_auth },
        ]

        // Sync user attributes to GPTBots
        const syncResult = await updateUserProperties(userId, propertyValues)
        console.log("[属性同步] 同步到GPTBots:", syncResult ? "✅ 成功" : "❌ 失败")
      } else {
        console.log("[属性同步] ⚠️ 未找到用户属性:", userId)
      }
    } catch (attrError) {
      // Don't fail the whole request if attribute sync fails
      console.error("[属性同步] ❌ 同步失败:", attrError)
    }

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
