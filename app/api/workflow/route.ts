import { type NextRequest, NextResponse } from "next/server"
import { callWorkflowAPI, type WorkflowRequest, CARD_TYPE_TO_WORKFLOW_TYPE } from "@/lib/gptbots"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { cardType, userId, type } = body

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
    }

    console.log("[Workflow API Route] 调用 Workflow:", {
      cardType,
      userId,
      type: type ?? CARD_TYPE_TO_WORKFLOW_TYPE[cardType],
    })

    const result = await callWorkflowAPI(workflowRequest)

    console.log("[Workflow API Route] Workflow 结果:", {
      success: result.success,
      userMessage: result.userMessage,
      isAttrChanged: result.isAttrChanged,
      hasData: !!result.data,
    })

    // 返回完整的响应信息
    return NextResponse.json({
      success: result.success,
      userMessage: result.userMessage,
      isAttrChanged: result.isAttrChanged,
      data: result.data,
      // 如果是 type 100（个人与配偶信息查询），返回账户数据
      accountData: cardType === "processing_auth" || type === 100 ? result.data : undefined,
    })
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

