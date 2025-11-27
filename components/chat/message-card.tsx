"use client"

import { useState, useMemo } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeRaw from "rehype-raw"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Download, ChevronDown, ChevronUp, Sparkles, Search } from "lucide-react"
import type { Message, LLMCardType, LLMResponse, UserBasicInfo } from "@/types/chat"
import ThinkingProcess from "./thinking-process"
import AccountDetailsCard from "./account-details-card"
import LLMCard from "./llm-card"
import AuthCard from "./auth-card"
import SignCard from "./sign-card"
import FinishCard from "./finish-card"

// 业务卡片类型
const BUSINESS_CARD_TYPES = ["withdrawl_auth", "sign", "finish"]

interface MessageCardProps {
  message: Message
  userId: string
  userInfo?: UserBasicInfo
  onBusinessCardAction?: (cardType: string, action: string, extraData?: { message?: string }) => void
  onViewRecords?: () => void
  onContinueChat?: () => void
  onEndChat?: (rating: number) => void
}

// 解析 LLM 返回的 JSON 格式内容
function parseLLMResponse(content: string): LLMResponse | null {
  if (!content) return null
  
  // 尝试解析 JSON 格式
  const trimmed = content.trim()
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed)
      if ('content' in parsed) {
        return {
          card_type: parsed.card_type || null,
          card_message: parsed.card_message || '',
          content: parsed.content || ''
        }
      }
    } catch {
      // 不是有效的 JSON，返回 null
    }
  }
  
  return null
}

export default function MessageCard({ 
  message, 
  userId, 
  userInfo, 
  onBusinessCardAction,
  onViewRecords,
  onContinueChat,
  onEndChat
}: MessageCardProps) {
  const [expanded, setExpanded] = useState(true)
  
  // 解析消息内容，检查是否为 LLM 结构化响应
  const parsedResponse = useMemo(() => {
    // 优先使用消息中已解析的字段
    if (message.llmCardType !== undefined) {
      return {
        card_type: message.llmCardType,
        card_message: message.llmCardMessage || '',
        content: message.content
      } as LLMResponse
    }
    // 尝试从 content 中解析 JSON
    return parseLLMResponse(message.content)
  }, [message.content, message.llmCardType, message.llmCardMessage])
  
  // 检查是否为业务卡片类型
  const isBusinessCard = parsedResponse?.card_type && BUSINESS_CARD_TYPES.includes(parsedResponse.card_type)

  // Show querying animation for data queries (e.g., account info)
  if (message.isQuerying && !message.accountInfo && !message.content) {
    return (
      <div className="bg-gradient-to-r from-blue-50/80 to-cyan-50/80 dark:from-blue-950/30 dark:to-cyan-950/30 border border-blue-200/60 dark:border-blue-800/50 px-4 py-3 rounded-2xl rounded-tl-sm">
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center">
            <Search className="h-4 w-4 text-blue-500 dark:text-blue-400 animate-pulse" />
            <span className="absolute flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            </span>
          </div>
          <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">正在为您查询信息...</span>
          <div className="flex gap-1 ml-1">
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
          </div>
        </div>
      </div>
    )
  }

  // Check if message has account info
  if (message.accountInfo) {
    return (
      <AccountDetailsCard
        accountInfo={message.accountInfo}
        className="w-full max-w-2xl"
      />
    )
  }

  // Check if message has structured card data
  if (message.cardData) {
    return (
      <Card className="w-full bg-card border-border shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {/* Card Title */}
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm text-foreground mb-2">{message.content}</p>
            <h3 className="font-semibold text-base">{message.cardData.title}</h3>
          </div>

          {/* Tabs */}
          <Tabs defaultValue={message.cardData.tabs?.[0]?.key || "guide"} className="w-full">
            <TabsList className="w-full justify-start gap-0 bg-secondary/50 p-0 h-auto rounded-none border-b border-border">
              {message.cardData.tabs?.map((tab) => (
                <TabsTrigger
                  key={tab.key}
                  value={tab.key}
                  className="flex-1 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
            {message.cardData.tabs?.map((tab) => (
              <TabsContent key={tab.key} value={tab.key} className="mt-0 p-4">
                {tab.items && (
                  <div className="space-y-0">
                    {/* Table header */}
                    <div className="flex items-center justify-between py-2 text-sm text-muted-foreground border-b border-border">
                      <span className="w-8">序</span>
                      <span className="flex-1">材料清单</span>
                      <span className="w-20 text-right">示例样表</span>
                    </div>
                    {/* Table rows */}
                    {tab.items.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between py-3 border-b border-border last:border-0"
                      >
                        <span className="w-8 text-sm text-muted-foreground">{index + 1}</span>
                        <div className="flex-1 flex items-center gap-2">
                          {item.badge && (
                            <span
                              className={`text-xs px-2 py-0.5 rounded ${
                                item.badge === "自备"
                                  ? "bg-primary/20 text-primary"
                                  : item.badge === "可免交"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-blue-100 text-blue-700"
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                          <span className="text-sm">{item.text}</span>
                        </div>
                        <div className="w-20 text-right">
                          {item.downloadable && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:text-primary/80">
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                    {tab.items.length > 3 && (
                      <button
                        onClick={() => setExpanded(!expanded)}
                        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mx-auto py-2"
                      >
                        {expanded ? (
                          <>
                            收起 <ChevronUp className="h-4 w-4" />
                          </>
                        ) : (
                          <>
                            展开更多 <ChevronDown className="h-4 w-4" />
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
          {message.cardData.action && (
            <div className="p-4 pt-0">
              <Button className="w-full bg-card border border-primary text-primary hover:bg-primary/10 h-11">
                {message.cardData.action}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // Show thinking animation when isThinking is true and no content yet
  if (message.isThinking && !message.content && !message.thinking) {
    return (
      <div className="bg-gradient-to-r from-orange-50/80 to-amber-50/80 dark:from-orange-950/30 dark:to-amber-950/30 border border-orange-200/60 dark:border-orange-800/50 px-4 py-3 rounded-2xl rounded-tl-sm">
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-orange-500 dark:text-orange-400" />
            <span className="absolute flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
            </span>
          </div>
          <span className="text-sm text-orange-700 dark:text-orange-300 font-medium">正在思考...</span>
          <div className="flex gap-1 ml-1">
            <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
            <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
            <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
          </div>
        </div>
      </div>
    )
  }

  // 获取要显示的内容（如果是 LLM 结构化响应，使用解析后的 content）
  const displayContent = parsedResponse ? parsedResponse.content : message.content
  const llmCardType = parsedResponse?.card_type
  const llmCardMessage = parsedResponse?.card_message

  // Regular text message with thinking process and LLM card
  return (
    <div className="max-w-full space-y-3">
      {/* Thinking Process Component */}
      {message.thinking && (
        <ThinkingProcess
          thinking={message.thinking}
          isComplete={message.thinkingComplete}
          className="mb-2"
        />
      )}
      
      {/* Business Card - 授权卡片 */}
      {llmCardType === "withdrawl_auth" && userInfo && onBusinessCardAction && (
        <AuthCard
          userInfo={userInfo}
          onConfirm={() => onBusinessCardAction("withdrawl_auth", "confirm")}
        />
      )}
      
      {/* Business Card - 签约卡片 */}
      {llmCardType === "sign" && llmCardMessage && userInfo && onBusinessCardAction && (
        <SignCard
          message={llmCardMessage}
          userInfo={userInfo}
          onConfirm={() => onBusinessCardAction("sign", "confirm", { message: llmCardMessage })}
        />
      )}
      
      {/* Business Card - 完成卡片 */}
      {llmCardType === "finish" && llmCardMessage && (
        <FinishCard
          message={llmCardMessage}
          onViewRecords={onViewRecords}
          onContinueChat={onContinueChat}
          onEndChat={onEndChat}
        />
      )}
      
      {/* LLM Alert Card (warning/success/info/error) */}
      {llmCardType && !isBusinessCard && llmCardMessage && (
        <LLMCard
          type={llmCardType}
          message={llmCardMessage}
          className="max-w-sm"
        />
      )}
      
      {/* Main Content with Markdown and HTML rendering */}
      {displayContent && (
        <div className="bg-secondary/80 px-4 py-3 rounded-2xl rounded-tl-sm">
          <div className="prose prose-sm dark:prose-invert max-w-none text-foreground leading-relaxed
            prose-p:my-2 prose-p:leading-relaxed
            prose-headings:text-foreground prose-headings:font-semibold prose-headings:mt-4 prose-headings:mb-2
            prose-h1:text-xl prose-h2:text-lg prose-h3:text-base
            prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5
            prose-code:bg-muted prose-code:text-foreground prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:before:content-none prose-code:after:content-none
            prose-pre:bg-muted prose-pre:text-foreground prose-pre:p-3 prose-pre:rounded-lg prose-pre:overflow-x-auto
            prose-a:text-primary prose-a:no-underline hover:prose-a:underline
            prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground prose-blockquote:italic
            prose-table:text-sm prose-th:bg-muted prose-th:px-3 prose-th:py-2 prose-td:px-3 prose-td:py-2 prose-td:border-border
            prose-strong:text-foreground prose-strong:font-semibold
            prose-hr:border-border
            [&_span]:inline">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]} 
              rehypePlugins={[rehypeRaw]}
            >
              {displayContent}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  )
}
