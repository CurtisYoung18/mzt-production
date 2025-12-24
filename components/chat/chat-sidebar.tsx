"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { PlusCircle, Clock, Trash2, LogOut, ChevronRight, ChevronLeft, Search, FileText, Home, Building2, Timer } from "lucide-react"
import type { ChatSession, LLMCardType } from "@/types/chat"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import ExtractFlowChart from "./extract-flow-chart"

interface User {
  userId: string
  name: string
  phone: string
}

interface ChatSidebarProps {
  user: User
  sessions: ChatSession[]
  activeSessionId: string
  onSelectSession: (id: string) => void
  onNewSession: () => void
  onDeleteSession: (id: string) => void
  isOpen: boolean
  onToggle: () => void
  onAccountQuery?: () => void
  onExtraction?: (type: string) => void
  showQuickActions?: boolean
  currentCardType?: LLMCardType // 当前卡片类型，用于点亮流程图
}

const USER_AVATAR = "https://img.icons8.com/color/96/user-male-circle--v1.png"

const extractionOptions = [
  { id: "rent", label: "租房提取", icon: Home, message: "我要租房提取" },
  { id: "commercial_loan", label: "偿还商业贷款提取", icon: Building2, message: "我要偿还商业贷款提取" },
  { id: "fund_loan", label: "偿还公积金贷款提取", icon: FileText, message: "我要偿还公积金贷款提取" },
  { id: "combined_loan", label: "偿还组合贷款提取", icon: FileText, message: "我要偿还组合贷款提取" },
  { id: "house_purchase", label: "购房提取（一、二手房）", icon: Home, message: "我要购房提取" },
  { id: "resignation", label: "离职提取（销户类）", icon: LogOut, message: "我要离职提取" },
  { id: "retirement", label: "正常退休提取（销户类）", icon: Timer, message: "我要正常退休提取" },
]

export default function ChatSidebar({
  user,
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  isOpen,
  onToggle,
  onAccountQuery,
  onExtraction,
  showQuickActions = false,
  currentCardType,
}: ChatSidebarProps) {
  const router = useRouter()
  const [showExtractionOptions, setShowExtractionOptions] = useState(false)

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    window.location.href = "/login"
  }

  return (
    <div className="relative flex">
      {/* Sidebar content */}
      <div
        className={`h-screen bg-sidebar flex flex-col transition-all duration-300 ease-in-out overflow-hidden ${
          isOpen ? "w-72" : "w-0"
        }`}
      >
        <div className="w-72 h-full flex flex-col overflow-hidden">
          {/* Header with user info and toggle button */}
          <div className="p-4 flex items-center gap-3 shrink-0">
            <img
              src={USER_AVATAR || "/placeholder.svg"}
              alt="用户头像"
              width={44}
              height={44}
              className="rounded-full bg-secondary shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sidebar-foreground truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.phone}</p>
            </div>
            {/* Toggle button inside sidebar */}
            <button
              onClick={onToggle}
              className="w-8 h-8 rounded-lg bg-sidebar-accent/50 hover:bg-sidebar-accent flex items-center justify-center transition-colors shrink-0"
              title="收起侧边栏"
            >
              <ChevronLeft className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          {/* New Chat Button */}
          <div className="px-3 pb-4 shrink-0">
            <Button
              onClick={onNewSession}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground gap-2 h-10 rounded-full text-sm font-medium"
            >
              <PlusCircle className="h-4 w-4" />
              新增会话
            </Button>
          </div>

          {/* Scrollable content area */}
          <ScrollArea className="flex-1 min-h-0">
            <div className="space-y-3 pb-2">
              {/* Quick Actions Section - Shows after first message */}
              {showQuickActions && onAccountQuery && onExtraction && (
                <div className="px-3">
                  <div className="bg-gradient-to-br from-orange-50/80 to-amber-50/80 dark:from-orange-950/30 dark:to-amber-950/30 rounded-xl border border-orange-200/50 dark:border-orange-800/30 overflow-hidden">
                    <div className="px-3 py-2 border-b border-orange-200/30 dark:border-orange-800/30 bg-gradient-to-r from-orange-100/50 to-amber-100/50 dark:from-orange-900/20 dark:to-amber-900/20">
                      <h4 className="text-xs font-semibold text-orange-900 dark:text-orange-100 flex items-center gap-1.5">
                        <span>🏠</span>
                        快捷服务
                      </h4>
                    </div>
                    <div className="p-2 space-y-1.5">
                      {/* Account Query Button */}
                      <button
                        onClick={onAccountQuery}
                        className="w-full flex items-center gap-2 p-2 bg-white/60 dark:bg-gray-800/40 rounded-lg border border-orange-200/30 dark:border-orange-700/20 hover:border-orange-400 dark:hover:border-orange-600 hover:bg-white dark:hover:bg-gray-800/60 transition-all group text-left"
                      >
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shrink-0">
                          <Search className="h-3.5 w-3.5 text-white" />
                        </div>
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">账户查询</span>
                        <ChevronRight className="h-3.5 w-3.5 text-gray-400 group-hover:text-orange-500 ml-auto shrink-0" />
                      </button>

                      {/* Extraction Button */}
                      <button
                        onClick={() => setShowExtractionOptions(!showExtractionOptions)}
                        className={cn(
                          "w-full flex items-center gap-2 p-2 bg-white/60 dark:bg-gray-800/40 rounded-lg border transition-all group text-left",
                          showExtractionOptions
                            ? "border-blue-400 dark:border-blue-600"
                            : "border-orange-200/30 dark:border-orange-700/20 hover:border-blue-400 dark:hover:border-blue-600 hover:bg-white dark:hover:bg-gray-800/60"
                        )}
                      >
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shrink-0">
                          <FileText className="h-3.5 w-3.5 text-white" />
                        </div>
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">公积金提取</span>
                        <motion.div
                          animate={{ rotate: showExtractionOptions ? 90 : 0 }}
                          transition={{ duration: 0.2 }}
                          className="ml-auto shrink-0"
                        >
                          <ChevronRight className="h-3.5 w-3.5 text-gray-400 group-hover:text-blue-500" />
                        </motion.div>
                      </button>

                      {/* Extraction Options */}
                      <AnimatePresence>
                        {showExtractionOptions && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="pt-1 flex flex-wrap gap-1">
                              {extractionOptions.map((option, index) => (
                                <motion.button
                                  key={option.id}
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: index * 0.03, duration: 0.15 }}
                                  onClick={() => {
                                    onExtraction(option.message)
                                    setShowExtractionOptions(false)
                                  }}
                                  className="flex items-center gap-1 px-2 py-1 bg-white dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30 text-xs text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-300 transition-all"
                                >
                                  <option.icon className="h-3 w-3" />
                                  {option.label}
                                </motion.button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              )}

              {/* 流程图 - 根据 currentCardType 点亮，但 account_info 时不显示 */}
              {currentCardType && currentCardType !== "account_info" && (
                <div className="px-3">
                  <ExtractFlowChart 
                    currentCardType={currentCardType}
                  />
                </div>
              )}

          {/* Recent Sessions Header */}
              <div className="px-3 py-2 flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>最近导办记录</span>
          </div>

          {/* Sessions List */}
              <div className="px-3 space-y-1">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={`group flex items-center gap-2 p-2.5 rounded-lg cursor-pointer transition-colors ${
                    activeSessionId === session.id
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "hover:bg-sidebar-accent/50"
                  }`}
                  onClick={() => onSelectSession(session.id)}
                >
                  <span className="flex-1 truncate text-sm">{session.title}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeleteSession(session.id)
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              </div>
            </div>
          </ScrollArea>

          {/* Footer with logout */}
          <div className="p-3 border-t border-sidebar-border space-y-2 shrink-0">
            <Button
              variant="outline"
              className="w-full gap-2 text-muted-foreground hover:text-destructive hover:border-destructive bg-transparent text-sm h-9"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              退出登录
            </Button>
            <p className="text-xs text-center text-muted-foreground">闽政通 · 公积金边聊边办</p>
          </div>
        </div>
      </div>

      {/* Expand button - only visible when sidebar is closed */}
      {!isOpen && (
      <button
        onClick={onToggle}
          className="absolute top-1/2 -translate-y-1/2 left-0 w-6 h-16 bg-sidebar/95 backdrop-blur-sm border border-sidebar-border border-l-0 rounded-r-lg flex items-center justify-center hover:bg-sidebar-accent transition-all duration-200 shadow-md z-10"
          title="展开侧边栏"
        >
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </button>
      )}
    </div>
  )
}
