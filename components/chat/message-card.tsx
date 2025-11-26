"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Download, ChevronDown, ChevronUp, Brain, Sparkles } from "lucide-react"
import type { Message } from "@/types/chat"

interface MessageCardProps {
  message: Message
  userId: string
}

export default function MessageCard({ message, userId }: MessageCardProps) {
  const [expanded, setExpanded] = useState(true)
  const [thinkingExpanded, setThinkingExpanded] = useState(false)

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

  // Regular text message with thinking process
  return (
    <div className="max-w-full space-y-2">
      {/* Thinking Process - Collapsible (like ChatGPT) */}
      {message.thinking && (
        <div className="bg-gradient-to-r from-purple-50/50 to-blue-50/50 dark:from-purple-950/20 dark:to-blue-950/20 border border-purple-200/50 dark:border-purple-800/50 rounded-lg overflow-hidden mb-2">
          <button
            onClick={() => setThinkingExpanded(!thinkingExpanded)}
            className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-purple-50/50 dark:hover:bg-purple-950/30 transition-colors group"
          >
            <div className="flex items-center gap-2 text-sm">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                <span className="font-medium text-purple-700 dark:text-purple-300">思考过程</span>
              </div>
              {!thinkingExpanded && (
                <span className="text-xs text-muted-foreground ml-2 truncate max-w-[200px]">
                  {message.thinking.substring(0, 50)}...
                </span>
              )}
            </div>
            {thinkingExpanded ? (
              <ChevronUp className="h-4 w-4 text-purple-600 dark:text-purple-400 group-hover:text-purple-700 dark:group-hover:text-purple-300" />
            ) : (
              <ChevronDown className="h-4 w-4 text-purple-600 dark:text-purple-400 group-hover:text-purple-700 dark:group-hover:text-purple-300" />
            )}
          </button>
          {thinkingExpanded && (
            <div className="px-4 py-3 border-t border-purple-200/50 dark:border-purple-800/50 bg-white/50 dark:bg-black/20">
              <div className="prose prose-sm max-w-none">
                <p className="whitespace-pre-wrap text-muted-foreground leading-relaxed text-sm font-mono">
                  {message.thinking}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Main Content */}
      <div className="bg-secondary/80 px-4 py-3 rounded-2xl rounded-tl-sm">
        <p className="whitespace-pre-wrap text-foreground leading-relaxed">{message.content}</p>
      </div>
    </div>
  )
}
