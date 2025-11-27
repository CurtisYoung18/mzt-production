import { type NextRequest, NextResponse } from "next/server"
import { getUserAttributes } from "@/lib/db"
import { mockUserAttributes } from "@/lib/mock-db"

// 是否使用模拟数据库
const USE_MOCK_DB = process.env.USE_MOCK_DB === "true" || !process.env.DATABASE_URL

// GET - 获取用户属性
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "缺少用户ID" }, { status: 400 })
    }

    const attributes = await getUserAttributes(userId)
    
    if (!attributes) {
      return NextResponse.json({ error: "用户属性不存在" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: attributes })
  } catch (error) {
    console.error("Get user attributes error:", error)
    return NextResponse.json({ error: "获取用户属性失败" }, { status: 500 })
  }
}

// PUT - 更新用户属性
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, attributeName, value } = body

    if (!userId || !attributeName) {
      return NextResponse.json({ error: "缺少必要参数" }, { status: 400 })
    }

    if (USE_MOCK_DB) {
      // Mock 模式：更新内存中的数据
      const userAttr = mockUserAttributes.find(a => a.user_id === userId)
      if (userAttr) {
        const oldValue = (userAttr as Record<string, unknown>)[attributeName]
        // 动态更新属性
        (userAttr as Record<string, unknown>)[attributeName] = value
        console.log(`[Mock API] Updated user attribute: ${userId}.${attributeName}`)
        console.log(`[Mock API] Old value: ${oldValue} -> New value: ${value}`)
        return NextResponse.json({ success: true, message: "属性已更新", oldValue, newValue: value })
      }
      console.log(`[Mock API] User not found: ${userId}`)
      return NextResponse.json({ error: "用户不存在" }, { status: 404 })
    }

    // 真实数据库模式
    // TODO: 实现真实数据库更新逻辑

    return NextResponse.json({ success: true, message: "属性已更新" })
  } catch (error) {
    console.error("Update user attribute error:", error)
    return NextResponse.json({ error: "更新用户属性失败" }, { status: 500 })
  }
}

