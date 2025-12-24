"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  CheckCircle, 
  FileCheck, 
  Home, 
  CreditCard, 
  Phone, 
  Users, 
  Baby, 
  Wallet, 
  Building, 
  FileText, 
  PartyPopper,
  ChevronDown,
  ShieldCheck,
  History
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { LLMCardType } from "@/types/chat"

interface ExtractFlowChartProps {
  currentCardType?: LLMCardType // 当前激活的卡片类型
  className?: string
}

interface FlowStep {
  id: string
  cardType: string // 对应的 card_type
  label: string
  icon: React.ReactNode
  subLabel?: string
}

// 定义流程步骤顺序（按照提取流程）
// 有 card 的节点会触发流程图更新
const FLOW_STEPS: FlowStep[] = [
  {
    id: "auth",
    cardType: "user_unauth",
    label: "用户授权",
    icon: <FileCheck className="h-4 w-4" />,
  },
  {
    id: "pre_check",
    cardType: "_pre_check", // 无 card，跟随 pf_list
    label: "提取前校验",
    icon: <ShieldCheck className="h-4 w-4" />,
  },
  {
    id: "extract_type",
    cardType: "pf_list",
    label: "提取类型选择",
    icon: <Home className="h-4 w-4" />,
  },
  {
    id: "account_check",
    cardType: "_account_check", // 无 card
    label: "账户状态校验",
    icon: <ShieldCheck className="h-4 w-4" />,
  },
  {
    id: "deposit_check",
    cardType: "_deposit_check", // 无 card
    label: "缴存提取校验",
    icon: <Wallet className="h-4 w-4" />,
  },
  {
    id: "property_check",
    cardType: "_property_check", // 无 card
    label: "本人房产判断",
    icon: <Building className="h-4 w-4" />,
  },
  {
    id: "marriage_check",
    cardType: "_marriage_check", // 无 card
    label: "婚姻状态",
    icon: <Users className="h-4 w-4" />,
  },
  {
    id: "mate_sms",
    cardType: "mate_sms",
    label: "配偶手机签约",
    icon: <Phone className="h-4 w-4" />,
    subLabel: "已婚",
  },
  {
    id: "mate_sign",
    cardType: "mate_sign",
    label: "配偶授权",
    icon: <Users className="h-4 w-4" />,
    subLabel: "已婚",
  },
  {
    id: "spouse_check",
    cardType: "_spouse_check", // 无 card
    label: "配偶资格校验",
    icon: <ShieldCheck className="h-4 w-4" />,
    subLabel: "已婚",
  },
  {
    id: "children_select",
    cardType: "children_select",
    label: "多孩家庭判断",
    icon: <Baby className="h-4 w-4" />,
  },
  {
    id: "sms_sign",
    cardType: "sms_sign",
    label: "本人手机签约",
    icon: <Phone className="h-4 w-4" />,
  },
  {
    id: "bank_sign",
    cardType: "bank_sign",
    label: "本人银行卡签约",
    icon: <CreditCard className="h-4 w-4" />,
  },
  {
    id: "finish",
    cardType: "finish",
    label: "提取确认",
    icon: <FileText className="h-4 w-4" />,
  },
  {
    id: "history_list",
    cardType: "history_list",
    label: "提取记录",
    icon: <History className="h-4 w-4" />,
  },
]

// 根据 card_type 获取当前步骤索引
function getStepIndexByCardType(cardType?: LLMCardType): number {
  if (!cardType) return -1
  
  const index = FLOW_STEPS.findIndex(step => step.cardType === cardType)
  return index
}

export default function ExtractFlowChart({
  currentCardType,
  className
}: ExtractFlowChartProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  // 获取当前步骤索引
  const currentStepIndex = getStepIndexByCardType(currentCardType)
  
  // 如果没有有效的卡片类型，不显示流程图
  if (currentStepIndex < 0) {
    return null
  }

  const renderStep = (step: FlowStep, index: number) => {
    // 判断步骤状态
    const isCompleted = index < currentStepIndex
    const isActive = index === currentStepIndex
    const isPending = index > currentStepIndex
    
    // 无 card 的步骤（以 _ 开头）：当下一个有 card 的步骤激活或完成时，自动完成
    const isNoCardStep = step.cardType.startsWith("_")
    let actualCompleted = isCompleted
    let actualActive = isActive
    
    if (isNoCardStep) {
      // 找到下一个有 card 的步骤
      let nextCardStepIndex = -1
      for (let i = index + 1; i < FLOW_STEPS.length; i++) {
        if (!FLOW_STEPS[i].cardType.startsWith("_")) {
          nextCardStepIndex = i
          break
        }
      }
      // 如果下一个有 card 的步骤已激活或完成，则当前无 card 步骤完成
      if (nextCardStepIndex !== -1 && currentStepIndex >= nextCardStepIndex) {
        actualCompleted = true
        actualActive = false
      } else if (nextCardStepIndex !== -1 && currentStepIndex === nextCardStepIndex - 1) {
        // 当前 card 步骤激活时，下一个无 card 步骤也激活
        actualActive = false
      }
    }

    return (
      <div key={step.id} className="relative">
        {/* 连接线 */}
        {index > 0 && (
          <div className={cn(
            "absolute left-[11px] -top-3 w-0.5 h-3",
            actualCompleted || actualActive ? "bg-green-400" : "bg-gray-200 dark:bg-gray-700"
          )} />
        )}

        {/* 步骤内容 */}
        <motion.div
          initial={false}
          animate={{ 
            scale: actualActive ? 1.02 : 1,
          }}
          className={cn(
            "flex items-center gap-2 py-1.5 px-2 rounded-lg transition-colors",
            actualActive && "bg-blue-50 dark:bg-blue-900/20"
          )}
        >
          {/* 图标 */}
          <div className={cn(
            "relative flex items-center justify-center w-6 h-6 rounded-full shrink-0 transition-all",
            actualCompleted 
              ? "bg-green-500 text-white" 
              : actualActive 
                ? "bg-blue-500 text-white ring-2 ring-blue-200 dark:ring-blue-800" 
                : "bg-gray-100 dark:bg-gray-800 text-gray-400"
          )}>
            {actualCompleted ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", duration: 0.3 }}
              >
                <CheckCircle className="h-4 w-4" />
              </motion.div>
            ) : (
              step.icon
            )}
            {actualActive && !actualCompleted && (
              <span className="absolute flex h-full w-full">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-50"></span>
              </span>
            )}
          </div>

          {/* 标签 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <span className={cn(
                "text-xs font-medium truncate",
                actualCompleted 
                  ? "text-green-600 dark:text-green-400" 
                  : actualActive 
                    ? "text-blue-600 dark:text-blue-400" 
                    : "text-gray-500 dark:text-gray-400"
              )}>
                {step.label}
              </span>
            </div>
            {step.subLabel && (
              <span className="text-[10px] text-gray-400 dark:text-gray-500 truncate block">
                {step.subLabel}
              </span>
            )}
          </div>
        </motion.div>
      </div>
    )
  }

  const completedCount = FLOW_STEPS.filter((_, index) => index < currentStepIndex).length
  const progressPercent = Math.round((completedCount / FLOW_STEPS.length) * 100)

  return (
    <div className={cn("bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden", className)}>
      {/* 可点击的标题栏 */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full p-3 flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
      >
        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shrink-0">
          <FileText className="h-3.5 w-3.5 text-white" />
        </div>
        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex-1 text-left">公积金提取流程</span>
        
        {/* 迷你进度指示 */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-400">{progressPercent}%</span>
          <div className="w-12 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
        
        <motion.div
          animate={{ rotate: isCollapsed ? 0 : 180 }}
          transition={{ duration: 0.2 }}
          className="shrink-0"
        >
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </motion.div>
      </button>
      
      {/* 可折叠的内容区域 */}
      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 border-t border-gray-100 dark:border-gray-800">
              <div className="space-y-1 pt-3">
                {FLOW_STEPS.map((step, index) => renderStep(step, index))}
              </div>
              
              {/* 底部进度条（详细） */}
              <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-800">
                <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1">
                  <span>办理进度</span>
                  <span>{completedCount}/{FLOW_STEPS.length} 步骤</span>
                </div>
                <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
