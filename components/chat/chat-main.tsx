"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, ThumbsUp, ThumbsDown, Paperclip, ImageIcon, FileText, X, Loader2, AlertCircle } from "lucide-react"
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
  const [isComposing, setIsComposing] = useState(false) // Track IME composition state
  const scrollRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const attachMenuRef = useRef<HTMLDivElement>(null)
  const attachButtonRef = useRef<HTMLButtonElement>(null)

  // Close attach menu when clicking outside (but not on the button or menu)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      const clickedOutsideMenu = attachMenuRef.current && !attachMenuRef.current.contains(target)
      const clickedOutsideButton = attachButtonRef.current && !attachButtonRef.current.contains(target)
      
      if (clickedOutsideMenu && clickedOutsideButton) {
        setShowAttachMenu(false)
      }
    }

    if (showAttachMenu) {
      // Use setTimeout to avoid closing immediately when menu opens
      const timer = setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside)
      }, 0)
      return () => {
        clearTimeout(timer)
        document.removeEventListener("mousedown", handleClickOutside)
      }
    }
  }, [showAttachMenu])

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
    // Don't send message if IME is composing (e.g., typing Chinese characters)
    if (e.key === "Enter" && !e.shiftKey && !isComposing) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  // IME composition handlers for proper Chinese/Japanese/Korean input
  const handleCompositionStart = () => {
    setIsComposing(true)
  }

  const handleCompositionEnd = () => {
    setIsComposing(false)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        <div className="max-w-4xl space-y-6 pb-4 relative">
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
          {/* Thinking animation is now handled directly in MessageCard via isThinking prop */}
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
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto relative">
          {/* Attach Menu - positioned outside the input container to avoid clipping */}
          <AnimatePresence>
            {showAttachMenu && (
              <motion.div
                ref={attachMenuRef}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="absolute bottom-full left-0 mb-2 bg-card border border-border rounded-xl shadow-2xl py-2 min-w-[160px] z-50"
              >
                <button
                  type="button"
                  className="w-full px-4 py-3 text-sm text-left hover:bg-muted flex items-center gap-3 transition-colors"
                  onClick={() => {
                    imageInputRef.current?.click()
                    setShowAttachMenu(false)
                  }}
                >
                  <ImageIcon className="h-5 w-5 text-blue-500" /> 图片
                </button>
                <button
                  type="button"
                  className="w-full px-4 py-3 text-sm text-left hover:bg-muted flex items-center gap-3 transition-colors"
                  onClick={() => {
                    fileInputRef.current?.click()
                    setShowAttachMenu(false)
                  }}
                >
                  <FileText className="h-5 w-5 text-orange-500" /> 文件
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div
            className={`relative flex items-end rounded-full border-2 transition-all duration-300 ease-out ${
              isFocused
                ? "border-primary bg-card shadow-lg shadow-primary/10"
                : "border-border bg-input hover:border-primary/50"
            }`}
          >
            {/* Attach button */}
            <div className="relative">
              <Button
                ref={attachButtonRef}
                type="button"
                variant="ghost"
                size="icon"
                className="m-1 h-10 w-10 rounded-full shrink-0"
                onClick={() => setShowAttachMenu(!showAttachMenu)}
              >
                <Paperclip className="h-5 w-5" />
              </Button>
            </div>

            {/* Hidden file inputs */}
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.txt,.docx,.csv,.xlsx,.html,.json,.md"
              multiple
              onChange={handleFileSelect}
            />
            <input
              ref={imageInputRef}
              type="file"
              className="hidden"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
            />

            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onCompositionStart={handleCompositionStart}
              onCompositionEnd={handleCompositionEnd}
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
