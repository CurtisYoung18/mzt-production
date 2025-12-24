import { type NextRequest, NextResponse } from "next/server"
import { callWorkflowAPI, type WorkflowRequest, CARD_TYPE_TO_WORKFLOW_TYPE } from "@/lib/gptbots"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { cardType, userId, type, extraInput } = body

    if (!userId) {
      return NextResponse.json(
        { error: "userId 是必需参数" },
        { status: 400 }
      )
    }

    if (!cardType && type === undefined) {
      return NextResponse.json(
        { error: "cardType 或 type 至少需要提供一个" },
        { status: 400 }
      )
    }

    const workflowRequest: WorkflowRequest = {
      cardType: cardType || "",
      userId,
      type: type !== undefined ? type : undefined,
      extraInput: extraInput || undefined,
    }

    const actualType = type ?? CARD_TYPE_TO_WORKFLOW_TYPE[cardType]
    console.log("[Workflow API Route] 调用 Workflow:", {
      cardType,
      userId,
      type: actualType,
    })

    const result = await callWorkflowAPI(workflowRequest)

    console.log("[Workflow API Route] Workflow 结果:", {
      success: result.success,
      userMessage: result.userMessage,
      isAttrChanged: result.isAttrChanged,
      hasData: !!result.data,
      hasDisplayInfo: !!result.displayInfo,
    })

    // 返回响应
    // type=100: 返回 display_info (用于签约预填写) - 直接返回解析后的对象
    // type=200: 返回 data (用于 account_info 卡片)
    // 其他 type: 返回 data
    
    const responseData: Record<string, unknown> = {
      success: result.success,
      userMessage: result.userMessage,
      isAttrChanged: result.isAttrChanged,
    }
    
    if (actualType === 100 && result.displayInfo) {
      // type=100 返回 display_info 字段 (用于签约预填写)
      // 直接返回解析后的对象，让前端直接使用
      responseData.display_info = result.displayInfo
    }
    
    if (result.data) {
      // 返回 data 字段 (用于 account_info 卡片等)
      responseData.data = result.data
    }

    return NextResponse.json(responseData)
  } catch (error) {
    console.error("[Workflow API Route] ❌ 错误:", error)
    const errorMessage = error instanceof Error ? error.message : "未知错误"
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        userMessage: "系统错误，请稍后重试",
      },
      { status: 500 }
    )
  }
}
