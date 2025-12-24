import { type NextRequest, NextResponse } from "next/server"
import { resetMockUserAttributes } from "@/lib/mock-db"

// POST - 重置用户属性到初始状态
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json({ error: "缺少用户ID" }, { status: 400 })
    }

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
  } catch (error) {
    console.error("Reset user attributes error:", error)
    return NextResponse.json({ error: "重置用户属性失败" }, { status: 500 })
  }
}

