"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import type { LLMCardType } from "@/types/chat"

interface ExtractFlowChartProps {
  currentCardType?: LLMCardType // 当前卡片类型
  className?: string
}

// 流程步骤定义（根据 doc/提取流程 - 阶段字典.md）
const FLOW_STEPS = [
  { id: "user_unauth", label: "用户授权", phase: "1000" },
  { id: "pf_list", label: "选择类型", phase: "1021" },
  { id: "mate_sms", label: "配偶手机签约", phase: "1071" },
  { id: "mate_sign", label: "配偶授权", phase: "1081" },
  { id: "sms_sign", label: "本人手机签约", phase: "1121" },
  { id: "bank_sign", label: "本人银行卡签约", phase: "1131" },
  { id: "finish", label: "完成提取", phase: "1132" },
]

// 根据 card_type 获取当前步骤索引
function getStepIndex(cardType?: LLMCardType): number {
  if (!cardType) return -1
  
  // 特殊处理：auth 类型映射到 user_unauth
  const typeToMatch = cardType === "auth" ? "user_unauth" : cardType
  
  const index = FLOW_STEPS.findIndex(step => step.id === typeToMatch)
  return index
}

export default function ExtractFlowChart({ currentCardType, className }: ExtractFlowChartProps) {
  const currentStepIndex = getStepIndex(currentCardType)
  
  // 如果没有有效的卡片类型，不显示流程图
  if (currentStepIndex < 0) {
    return null
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        "bg-gradient-to-b from-white/80 to-gray-50/80 dark:from-gray-900/80 dark:to-gray-800/80",
        "border border-gray-200/60 dark:border-gray-700/60 rounded-xl p-3",
        className
      )}
    >
      <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3">
        提取流程进度
      </h4>
      
      <div className="relative">
        {/* 连接线 */}
        <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-gray-200 dark:bg-gray-700" />
        
        {/* 步骤列表 */}
        <div className="space-y-2 relative">
          {FLOW_STEPS.map((step, index) => {
            const isCompleted = index < currentStepIndex
            const isCurrent = index === currentStepIndex
            const isPending = index > currentStepIndex
            
            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-2"
              >
                {/* 步骤指示器 */}
                <div
                  className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium z-10",
                    isCompleted && "bg-green-500 text-white",
                    isCurrent && "bg-blue-500 text-white ring-2 ring-blue-200 dark:ring-blue-800",
                    isPending && "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500"
                  )}
                >
                  {isCompleted ? (
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>
                
                {/* 步骤标签 */}
                <span
                  className={cn(
                    "text-xs",
                    isCompleted && "text-green-600 dark:text-green-400",
                    isCurrent && "text-blue-600 dark:text-blue-400 font-medium",
                    isPending && "text-gray-400 dark:text-gray-500"
                  )}
                >
                  {step.label}
                </span>
              </motion.div>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}

