import type { NextRequest } from "next/server"
import { sendMessageStreaming, type GPTBotsMessage } from "@/lib/gptbots"

export async function POST(request: NextRequest) {
  try {
    const { conversationId, messages } = await request.json()

    console.log("[消息发送] 会话ID:", conversationId)
    console.log("[消息发送] 消息数量:", messages?.length)

    if (!conversationId || !messages) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Validate conversationId format
    if (typeof conversationId !== "string" || conversationId.trim().length === 0) {
      return new Response(JSON.stringify({ error: "conversationId must be a non-empty string" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Validate messages format per API docs
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages must be a non-empty array" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Validate each message has required fields
    for (const msg of messages) {
      if (!msg.role || (msg.role !== "user" && msg.role !== "assistant")) {
        return new Response(JSON.stringify({ error: "Each message must have a valid role (user or assistant)" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        })
      }
      if (!msg.content) {
        return new Response(JSON.stringify({ error: "Each message must have content" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        })
      }
    }

    // Call GPTBots API with streaming using our SSL-bypassing client
    const stream = await sendMessageStreaming(conversationId, messages as GPTBotsMessage[])

    // Transform the stream to SSE format
    const encoder = new TextEncoder()
    const decoder = new TextDecoder()

    const transformedStream = new ReadableStream({
      async start(controller) {
        const reader = stream.getReader()
        let buffer = ""

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) {
              console.log("[消息发送] ✅ 流式响应完成")
              break
            }

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split("\n")
            buffer = lines.pop() || ""

            for (const line of lines) {
              if (line.trim()) {
                try {
                  // Handle SSE format: "data: {...}" or plain JSON
                  let jsonStr = line.trim()
                  if (jsonStr.startsWith("data:")) {
                    jsonStr = jsonStr.slice(5).trim() // Remove "data:" prefix
                  }
                  
                  if (jsonStr) {
                    const event = JSON.parse(jsonStr)
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
                  }
                } catch (error) {
                  // Not valid JSON, skip
                  console.log("[消息发送] 跳过非JSON行:", line.substring(0, 50))
                }
              }
            }
          }

          // Process remaining buffer
          if (buffer.trim()) {
            try {
              let jsonStr = buffer.trim()
              if (jsonStr.startsWith("data:")) {
                jsonStr = jsonStr.slice(5).trim() // Remove "data:" prefix
              }
              
              if (jsonStr) {
                const event = JSON.parse(jsonStr)
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
              }
            } catch {
              // Not valid JSON, skip
            }
          }
        } catch (error) {
          console.error("[消息发送] ❌ 流式响应错误:", error)
          controller.error(error)
        } finally {
          controller.close()
        }
      },
    })

    return new Response(transformedStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (error) {
    console.error("[消息发送] ❌ 发送失败:", error)
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
