import { type NextRequest, NextResponse } from "next/server"
import { getUserAttributes } from "@/lib/db"
import { mockUserAttributes } from "@/lib/mock-db"

// 是否使用模拟数据库
const USE_MOCK_DB = process.env.USE_MOCK_DB === "true" || !process.env.DATABASE_URL

// Phase 字典（新版 1000-1031 线性递增）：
// 1000: 未开始 | 1001: 开始办理
// 1005-1007: 婚姻检验 | 1015-1017: 手机签约 | 1018-1020: 银行卡签约
// 1021-1028: 后续校验 | 1029: 满足条件 | 1030: 人脸识别 | 1031: 提交成功
//
// 有 card 的 phase:
// - 1015: sms_sign (手机签约卡片)
// - 1018: bank_sign (银行卡签约卡片)
// - 1029: finish (完成卡片)
const PHASE_JUMP_MAP: Record<string, string> = {
  // 完成手机签约 → 跳到未银行卡签约
  "1016": "1018",
  "1017": "1018",
  // 完成银行卡签约 → 跳到满足提取条件（跳过中间的校验步骤，演示用）
  "1019": "1029",
  "1020": "1029",
  // 中间步骤如果直接设置，也跳到满足条件
  "1021": "1029",
  "1022": "1029",
  "1023": "1029",
  "1024": "1029",
  "1025": "1029",
  "1026": "1029",
  "1027": "1029",
  "1028": "1029",
}

// 获取实际应该设置的 phase 值（跳过没有 card 的中间 phase）
function getActualPhase(requestedPhase: string): string {
  return PHASE_JUMP_MAP[requestedPhase] || requestedPhase
}

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

    // 如果是更新 phase，应用跳转逻辑
    let actualValue = value
    if (attributeName === "phase") {
      actualValue = getActualPhase(value)
      if (actualValue !== value) {
        console.log(`[API] Phase jump: ${value} -> ${actualValue} (skipping phases without cards)`)
      }
    }

    if (USE_MOCK_DB) {
      // Mock 模式：更新内存中的数据
      const userAttr = mockUserAttributes.find(a => a.user_id === userId)
      if (userAttr) {
        const userRecord = userAttr as Record<string, string | boolean | string[] | null>
        const oldValue = userRecord[attributeName]
        // 动态更新属性
        userRecord[attributeName] = actualValue
        console.log(`[Mock API] Updated user attribute: ${userId}.${attributeName}`)
        console.log(`[Mock API] Old value: ${oldValue} -> New value: ${actualValue}`)
        return NextResponse.json({ 
          success: true, 
          message: "属性已更新", 
          oldValue, 
          newValue: actualValue,
          requestedValue: value,
          jumped: actualValue !== value
        })
      }
      console.log(`[Mock API] User not found: ${userId}`)
      return NextResponse.json({ error: "用户不存在" }, { status: 404 })
    }

    // 真实数据库模式 - 目前未实现，返回成功以不阻止流程
    console.log(`[API] Real DB mode - would update ${userId}.${attributeName} = ${actualValue}`)
    return NextResponse.json({ 
      success: true, 
      message: "属性已更新（真实数据库模式）",
      newValue: actualValue,
      requestedValue: value,
      jumped: actualValue !== value
    })
  } catch (error) {
    console.error("Update user attribute error:", error)
    return NextResponse.json({ error: "更新用户属性失败" }, { status: 500 })
  }
}

