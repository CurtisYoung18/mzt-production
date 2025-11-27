import { type NextRequest, NextResponse } from "next/server"
import { updateUserProperties } from "@/lib/gptbots"

// POST - 更新 GPTBots 用户属性
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, attributeName, value } = body

    if (!userId || !attributeName) {
      return NextResponse.json({ error: "缺少必要参数" }, { status: 400 })
    }

    console.log(`[GPTBots API] Updating ${attributeName} = ${value} for user ${userId}`)

    // 调用 GPTBots API 更新用户属性
    const success = await updateUserProperties(userId, [
      {
        property_name: attributeName,
        value: value,
      },
    ])

    if (success) {
      console.log(`[GPTBots API] Successfully updated ${attributeName} for user ${userId}`)
      return NextResponse.json({ 
        success: true, 
        message: "GPTBots 用户属性已更新",
        attributeName,
        value,
      })
    } else {
      console.error(`[GPTBots API] Failed to update ${attributeName} for user ${userId}`)
      return NextResponse.json({ 
        success: false, 
        error: "GPTBots 用户属性更新失败" 
      }, { status: 500 })
    }
  } catch (error) {
    console.error("Update GPTBots user attribute error:", error)
    return NextResponse.json({ error: "更新 GPTBots 用户属性失败" }, { status: 500 })
  }
}

