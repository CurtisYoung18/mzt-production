"use client"

import { useState, useEffect, useRef } from "react"
import { ChevronDown, ChevronUp, CheckCircle2, Sparkles, Brain } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

interface ThinkingProcessProps {
  thinking: string
  isComplete?: boolean
  className?: string
}

export default function ThinkingProcess({ thinking, isComplete = false, className }: ThinkingProcessProps) {
  const [isExpanded, setIsExpanded] = useState(!isComplete)
  const contentRef = useRef<HTMLDivElement>(null)

  // Auto-collapse when thinking completes
  useEffect(() => {
    if (isComplete && isExpanded) {
      const timer = setTimeout(() => {
        setIsExpanded(false)
      }, 1500)
      return () => clearTimeout(timer)
    } else if (!isComplete && thinking && !isExpanded) {
      setIsExpanded(true)
    }
  }, [isComplete, thinking])

  // Auto-scroll to bottom while thinking
  useEffect(() => {
    if (isExpanded && !isComplete && contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight
    }
  }, [thinking, isExpanded, isComplete])

  // 思考完成后完全隐藏
  if (!thinking || isComplete) return null

  return (
    <div
      className={cn(
        "rounded-xl border overflow-hidden transition-all duration-300 will-change-auto",
        isComplete 
          ? "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50" 
          : "border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-950/50",
        className
      )}
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "w-full px-4 py-3 flex items-center justify-between transition-colors",
          isComplete
            ? "bg-gray-100/80 dark:bg-gray-800/80 hover:bg-gray-100 dark:hover:bg-gray-700/80"
            : "bg-orange-100/80 dark:bg-orange-900/30 hover:bg-orange-100 dark:hover:bg-orange-900/50"
        )}
      >
        <div className="flex items-center gap-3 text-sm">
          <div className="relative flex items-center justify-center w-5 h-5">
            {isComplete ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <>
                <div className="absolute inset-0 bg-orange-500/20 rounded-full animate-ping" />
                <Sparkles className="h-4 w-4 text-orange-500 animate-pulse relative z-10" />
              </>
            )}
          </div>
          <span className={cn(
            "font-medium transition-colors",
            isComplete ? "text-muted-foreground" : "text-foreground"
          )}>
            {isComplete ? "思考完成" : "正在思考..."}
          </span>
          {!isExpanded && (
            <span className="text-xs text-muted-foreground ml-2 truncate max-w-[200px] opacity-60">
              {thinking.replace(/\n/g, " ").substring(0, 60)}...
            </span>
          )}
        </div>
        <div
          className={cn(
            "transition-transform duration-300 text-muted-foreground",
            isExpanded ? "rotate-180" : "rotate-0"
          )}
        >
          <ChevronDown className="h-4 w-4" />
        </div>
      </button>

      {/* Content Area */}
      <AnimatePresence initial={false} mode="wait">
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden will-change-auto"
          >
            <div 
              ref={contentRef}
              className={cn(
                "px-4 pb-4 pt-2 max-h-[300px] overflow-y-auto custom-scrollbar",
                isComplete 
                  ? "bg-gray-50 dark:bg-gray-800/50" 
                  : "bg-orange-50/50 dark:bg-orange-950/30"
              )}
            >
              <div className={cn(
                "pl-4 border-l-2 py-1",
                isComplete 
                  ? "border-gray-300 dark:border-gray-600" 
                  : "border-orange-400 dark:border-orange-600"
              )}>
                <p className="whitespace-pre-wrap text-gray-600 dark:text-gray-400 text-sm font-mono leading-relaxed">
                  {thinking}
                  {!isComplete && (
                    <span className="inline-block w-1.5 h-4 bg-orange-500 ml-1 align-middle animate-pulse rounded-sm" />
                  )}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

