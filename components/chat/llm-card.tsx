"use client"

import { motion } from "framer-motion"
import { AlertTriangle, CheckCircle, Info, XCircle, X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { LLMCardType } from "@/types/chat"
import { useState } from "react"

interface LLMCardProps {
  type: LLMCardType
  message: string
  className?: string
  onClose?: () => void
}

const cardConfig = {
  warning: {
    icon: AlertTriangle,
    title: "提示",
    bgColor: "bg-white",
    borderColor: "border-gray-200",
    iconColor: "text-amber-500",
    titleColor: "text-gray-900",
    messageColor: "text-gray-600",
    buttonColor: "text-blue-500 hover:text-blue-600",
  },
  success: {
    icon: CheckCircle,
    title: "成功",
    bgColor: "bg-white",
    borderColor: "border-green-200",
    iconColor: "text-green-500",
    titleColor: "text-gray-900",
    messageColor: "text-gray-600",
    buttonColor: "text-green-500 hover:text-green-600",
  },
  info: {
    icon: Info,
    title: "提示",
    bgColor: "bg-white",
    borderColor: "border-blue-200",
    iconColor: "text-blue-500",
    titleColor: "text-gray-900",
    messageColor: "text-gray-600",
    buttonColor: "text-blue-500 hover:text-blue-600",
  },
  error: {
    icon: XCircle,
    title: "错误",
    bgColor: "bg-white",
    borderColor: "border-red-200",
    iconColor: "text-red-500",
    titleColor: "text-gray-900",
    messageColor: "text-gray-600",
    buttonColor: "text-red-500 hover:text-red-600",
  },
}

// 有效的卡片类型
const validCardTypes = ["warning", "success", "info", "error"] as const
type ValidCardType = typeof validCardTypes[number]

function isValidCardType(type: unknown): type is ValidCardType {
  return typeof type === "string" && validCardTypes.includes(type as ValidCardType)
}

export default function LLMCard({ type, message, className, onClose }: LLMCardProps) {
  const [isVisible, setIsVisible] = useState(true)

  // 检查 type 是否有效
  if (!type || !isVisible || !isValidCardType(type)) return null

  const config = cardConfig[type]
  const IconComponent = config.icon

  const handleClose = () => {
    setIsVisible(false)
    onClose?.()
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 10 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn(
        "relative rounded-2xl border shadow-lg overflow-hidden",
        config.bgColor,
        config.borderColor,
        className
      )}
    >
      {/* 内容区域 */}
      <div className="px-6 py-5 text-center">
        {/* 标题 */}
        <h3 className={cn("text-lg font-semibold mb-3", config.titleColor)}>
          {config.title}
        </h3>
        
        {/* 消息内容 */}
        <p className={cn("text-sm leading-relaxed mb-4", config.messageColor)}>
          {message}
        </p>
        
        {/* 确认按钮 */}
        <button
          onClick={handleClose}
          className={cn(
            "text-base font-medium transition-colors",
            config.buttonColor
          )}
        >
          好的
        </button>
      </div>
    </motion.div>
  )
}

