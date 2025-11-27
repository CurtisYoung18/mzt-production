"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, ThumbsUp, ThumbsDown, Paperclip, ImageIcon, Mic, FileText, X, Loader2, AlertCircle, Sparkles } from "lucide-react"
import type { Message } from "@/types/chat"
import MessageCard from "./message-card"
import QuickActions from "./quick-actions"
import { motion, AnimatePresence } from "framer-motion"

interface ChatMainProps {
  messages: Message[]
  onSendMessage: (content: string, attachments?: File[]) => void
  onAccountQuery: () => void
  userId: string
  userName: string
  onToggleSidebar: () => void
  sidebarOpen: boolean
  isLoading?: boolean
  connectionError?: string | null
  showQuickActions?: boolean
}

const ASSISTANT_AVATAR = "/images/icon.jpeg"
const USER_AVATAR = "https://img.icons8.com/color/96/user-male-circle--v1.png"

export default function ChatMain({
  messages,
  onSendMessage,
  onAccountQuery,
  userId,
  userName,
  onToggleSidebar,
  sidebarOpen,
  isLoading = false,
  connectionError,
  showQuickActions = true,
}: ChatMainProps) {
  const [input, setInput] = useState("")
  const [isFocused, setIsFocused] = useState(false)
  const [attachments, setAttachments] = useState<File[]>([])
  const [showAttachMenu, setShowAttachMenu] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const audioInputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll with smooth animation (throttled)
  const lastScrollTime = useRef(0)
  useEffect(() => {
    const now = Date.now()
    if (now - lastScrollTime.current < 100) return // Throttle to 100ms
    lastScrollTime.current = now
    
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" })
    }
  }, [messages, isLoading])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if ((!input.trim() && attachments.length === 0) || isLoading) return
    onSendMessage(input.trim(), attachments.length > 0 ? attachments : undefined)
    setInput("")
    setAttachments([])
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: "file" | "image" | "audio") => {
    const files = e.target.files
    if (files) {
      setAttachments((prev) => [...prev, ...Array.from(files)])
    }
    setShowAttachMenu(false)
    e.target.value = ""
  }

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) return <ImageIcon className="h-4 w-4" />
    if (file.type.startsWith("audio/")) return <Mic className="h-4 w-4" />
    return <FileText className="h-4 w-4" />
  }

  return (
    <div className="flex-1 flex flex-col bg-card min-w-0 h-screen overflow-hidden">
      {/* Header */}
      <div className="h-14 border-b border-border flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-3">
          <img
            src={ASSISTANT_AVATAR || "/placeholder.svg"}
            alt="福晓金"
            className="w-9 h-9 rounded-full object-cover bg-amber-50"
          />
          <span className="font-medium text-lg">福晓金</span>
          <span className="text-xs text-muted-foreground bg-primary/10 px-2 py-0.5 rounded-full">公积金智能助手</span>
        </div>
      </div>

      {connectionError && (
        <div className="mx-6 mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-destructive font-medium">连接错误</p>
              <p className="text-sm text-muted-foreground mt-1">{connectionError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 min-h-0 p-6" ref={scrollRef}>
        <div className="max-w-4xl mx-auto space-y-6 pb-4 relative">
          {/* Quick Actions - shown when only welcome message exists */}
          {showQuickActions && messages.length <= 1 && (
            <QuickActions
              onAccountQuery={onAccountQuery}
              onExtraction={(message) => onSendMessage(message)}
              className="mb-6"
            />
          )}
          
          {messages.map((message) => (
            <div key={message.id} className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}>
              <img
                src={message.role === "user" ? USER_AVATAR : ASSISTANT_AVATAR}
                alt={message.role === "user" ? "用户" : "福晓金"}
                className="w-10 h-10 rounded-full object-cover shrink-0 mt-1 bg-amber-50"
              />
              <div
                className={`flex flex-col gap-2 max-w-[85%] ${message.role === "user" ? "items-end" : "items-start"}`}
              >
                {message.role === "user" ? (
                  <div className="bg-primary text-primary-foreground px-5 py-3.5 rounded-2xl rounded-tr-sm shadow-sm">
                    <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                  </div>
                ) : (
                  <>
                    <MessageCard message={message} userId={userId} />
                    {message.content && (
                      <div className="flex items-center gap-1 ml-1 opacity-0 hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-green-600 hover:bg-green-50">
                          <ThumbsUp className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-red-500 hover:bg-red-50">
                          <ThumbsDown className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
          {/* Loading indicator with thinking animation - smooth transition */}
          <AnimatePresence>
            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="flex gap-3"
              >
                <img
                  src={ASSISTANT_AVATAR || "/placeholder.svg"}
                  alt="福晓金"
                  className="w-10 h-10 rounded-full object-cover shrink-0 mt-1 bg-amber-50"
                />
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: "auto", opacity: 1 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="bg-gradient-to-r from-orange-50/50 to-blue-50/50 dark:from-orange-950/20 dark:to-blue-950/20 border border-orange-200/50 dark:border-orange-800/50 px-4 py-3 rounded-2xl rounded-tl-sm overflow-hidden"
                >
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <div className="relative">
                      <Sparkles className="h-4 w-4 text-orange-600 dark:text-orange-400 animate-pulse" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-2 w-2 bg-orange-400 rounded-full animate-ping" />
                      </div>
                    </div>
                    <span className="text-sm text-orange-700 dark:text-orange-300 font-medium">正在思考...</span>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="px-6 py-2 border-t border-border">
          <div className="max-w-4xl mx-auto flex flex-wrap gap-2">
            {attachments.map((file, index) => (
              <div key={index} className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-full text-sm">
                {getFileIcon(file)}
                <span className="max-w-[150px] truncate">{file.name}</span>
                <button onClick={() => removeAttachment(index)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-border p-4 shrink-0">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div
            className={`relative flex items-end rounded-full border-2 transition-all duration-300 ease-out overflow-hidden ${
              isFocused
                ? "border-primary bg-card shadow-lg shadow-primary/10"
                : "border-border bg-input hover:border-primary/50"
            }`}
          >
            <div className="relative">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="m-1 h-10 w-10 rounded-full shrink-0"
                onClick={() => setShowAttachMenu(!showAttachMenu)}
              >
                <Paperclip className="h-5 w-5" />
              </Button>
              {showAttachMenu && (
                <div className="absolute bottom-14 left-0 bg-card border border-border rounded-lg shadow-lg py-2 min-w-[140px] z-10">
                  <button
                    type="button"
                    className="w-full px-4 py-2 text-sm text-left hover:bg-muted flex items-center gap-2"
                    onClick={() => imageInputRef.current?.click()}
                  >
                    <ImageIcon className="h-4 w-4" /> 图片
                  </button>
                  <button
                    type="button"
                    className="w-full px-4 py-2 text-sm text-left hover:bg-muted flex items-center gap-2"
                    onClick={() => audioInputRef.current?.click()}
                  >
                    <Mic className="h-4 w-4" /> 语音
                  </button>
                  <button
                    type="button"
                    className="w-full px-4 py-2 text-sm text-left hover:bg-muted flex items-center gap-2"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <FileText className="h-4 w-4" /> 文件
                  </button>
                </div>
              )}
            </div>

            {/* Hidden file inputs */}
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.txt,.docx,.csv,.xlsx,.html,.json,.md"
              multiple
              onChange={(e) => handleFileSelect(e, "file")}
            />
            <input
              ref={imageInputRef}
              type="file"
              className="hidden"
              accept="image/*"
              multiple
              onChange={(e) => handleFileSelect(e, "image")}
            />
            <input
              ref={audioInputRef}
              type="file"
              className="hidden"
              accept="audio/*"
              onChange={(e) => handleFileSelect(e, "audio")}
            />

            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="请输入你想咨询的内容"
              className="flex-1 min-h-[48px] max-h-[120px] resize-none border-0 bg-transparent px-4 py-3 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/60"
              rows={1}
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="icon"
              disabled={(!input.trim() && attachments.length === 0) || isLoading}
              className={`m-2 h-10 w-10 rounded-full transition-all duration-300 shrink-0 ${
                (input.trim() || attachments.length > 0) && !isLoading
                  ? "bg-primary hover:bg-primary/90 hover:scale-105 shadow-md"
                  : "bg-primary/30 text-primary-foreground/50"
              }`}
            >
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
