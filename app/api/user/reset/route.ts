import { type NextRequest, NextResponse } from "next/server"
import { resetMockUserAttributes } from "@/lib/mock-db"

// 是否使用模拟数据库
const USE_MOCK_DB = process.env.USE_MOCK_DB === "true" || !process.env.DATABASE_URL

// POST - 重置用户属性到初始状态
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json({ error: "缺少用户ID" }, { status: 400 })
    }

    if (USE_MOCK_DB) {
      console.log(`[Reset API] Resetting user attributes for: ${userId}`)
      const success = resetMockUserAttributes(userId)
      if (success) {
        console.log(`[Reset API] ✅ Successfully reset user ${userId} to initial state`)
        return NextResponse.json({ 
          success: true, 
          message: "用户属性已重置到初始状态" 
        })
      }
      console.log(`[Reset API] ❌ User not found: ${userId}`)
      return NextResponse.json({ error: "用户不存在" }, { status: 404 })
    }

    // 真实数据库模式下暂不支持重置
    return NextResponse.json({ 
      success: true, 
      message: "真实数据库模式下不支持重置" 
    })
  } catch (error) {
    console.error("Reset user attributes error:", error)
    return NextResponse.json({ error: "重置用户属性失败" }, { status: 500 })
  }
}

