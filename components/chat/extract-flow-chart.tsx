"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  CheckCircle, 
  Circle, 
  FileCheck, 
  Home, 
  CreditCard, 
  Phone, 
  Users, 
  Baby, 
  Wallet, 
  Building, 
  Landmark, 
  FileText, 
  PartyPopper,
  ChevronDown,
  ChevronRight
} from "lucide-react"
import { cn } from "@/lib/utils"

interface UserAttributes {
  is_auth: boolean
  is_married: boolean
  permit_extract_types: string[]
  phase: string
}

interface ExtractFlowChartProps {
  userAttributes: UserAttributes | null
  selectedExtractType: string | null
  isFinished: boolean
  onSelectExtractType?: (type: string) => void
  className?: string
}

interface FlowStep {
  id: string
  label: string
  icon: React.ReactNode
  isActive: boolean
  isCompleted: boolean
  subLabel?: string
  children?: FlowStep[]
  clickable?: boolean
  onClick?: () => void
}

export default function ExtractFlowChart({
  userAttributes,
  selectedExtractType,
  isFinished,
  onSelectExtractType,
  className
}: ExtractFlowChartProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set()) // 签约状态默认收起

  if (!userAttributes) {
    return null
  }

  const { is_auth, is_married, permit_extract_types, phase } = userAttributes
  const phaseNum = parseInt(phase) || 1000

  // 判断各步骤的完成状态
  // Phase 字典（新版 1000-1031 线性递增，可直接用大小比较）：
  // 1000: 未开始 | 1001: 开始办理
  // 1005: 未检验婚姻 | 1006: 未婚 | 1007: 已婚
  // 1015: 本人未手机签约 | 1016: 完成手机签约 | 1017: 已手机签约
  // 1018: 本人未银行卡签约 | 1019: 完成银行卡签约 | 1020: 已银行卡签约
  // 1021: 多孩家庭 | 1022: 非多孩家庭
  // 1023: 提取/缴纳不通过 | 1024: 提取/缴纳通过
  // 1025: 缴存地无房产 | 1026: 缴存地有房产
  // 1027: 无未结清贷款 | 1028: 有未结清贷款
  // 1029: 满足租房提取条件 | 1030: 人脸识别 | 1031: 提交成功
  
  const isAuthCompleted = is_auth
  const isExtractTypeSelected = !!selectedExtractType || phaseNum >= 1005
  const isMarriageChecked = phaseNum >= 1007 || phaseNum >= 1015 // 已婚/未婚后进入签约
  const isSmsSignCompleted = phaseNum >= 1018 // 进入银行卡签约阶段
  const isBankSignCompleted = phaseNum >= 1021 // 进入后续校验阶段
  const isSigningCompleted = isSmsSignCompleted && isBankSignCompleted
  const isMultiChildChecked = phaseNum >= 1022 // 非多孩家庭
  const isDepositChecked = phaseNum >= 1024 // 提取/缴纳通过
  const isPropertyChecked = phaseNum >= 1025 // 缴存地无房产
  const isLoanChecked = phaseNum >= 1027 // 无未结清贷款
  const isExtractDetailsReady = phaseNum >= 1029 // 满足提取条件
  const isSubmitted = isFinished

  // 判断当前激活步骤
  const getCurrentStep = () => {
    if (!is_auth) return "auth"
    if (!isExtractTypeSelected) return "extract_type"
    if (!isMarriageChecked) return "marriage"
    if (!isSmsSignCompleted) return "sms_sign"
    if (!isBankSignCompleted) return "bank_sign"
    if (!isMultiChildChecked) return "multi_child"
    if (!isDepositChecked) return "deposit"
    if (!isPropertyChecked) return "property"
    if (!isLoanChecked) return "loan"
    if (!isExtractDetailsReady) return "extract_details"
    if (!isSubmitted) return "submit"
    return "done"
  }

  const currentStep = getCurrentStep()

  const toggleExpand = (stepId: string) => {
    const newExpanded = new Set(expandedSteps)
    if (newExpanded.has(stepId)) {
      newExpanded.delete(stepId)
    } else {
      newExpanded.add(stepId)
    }
    setExpandedSteps(newExpanded)
  }

  // 流程步骤配置
  const flowSteps: FlowStep[] = [
    {
      id: "auth",
      label: "信息授权",
      icon: <FileCheck className="h-4 w-4" />,
      isActive: currentStep === "auth",
      isCompleted: isAuthCompleted,
      subLabel: isAuthCompleted ? "已授权" : "待授权"
    },
    {
      id: "extract_type",
      label: "提取原因",
      icon: <Home className="h-4 w-4" />,
      isActive: currentStep === "extract_type" && isAuthCompleted,
      isCompleted: isExtractTypeSelected,
      subLabel: selectedExtractType ? `${selectedExtractType}提取` : "请选择",
      clickable: isAuthCompleted && !isExtractTypeSelected,
      children: isAuthCompleted && !isExtractTypeSelected ? permit_extract_types.map(type => ({
        id: `extract_${type}`,
        label: `${type}提取`,
        icon: <Circle className="h-3 w-3" />,
        isActive: false,
        isCompleted: false,
        clickable: true,
        onClick: () => onSelectExtractType?.(`我要办理${type}提取`)
      })) : undefined
    },
    {
      id: "marriage",
      label: "婚姻状态",
      icon: <Users className="h-4 w-4" />,
      isActive: currentStep === "marriage",
      isCompleted: isMarriageChecked || isExtractTypeSelected,
      subLabel: is_married ? "已婚" : "未婚"
    },
    {
      id: "signing",
      label: "签约状态",
      icon: <CreditCard className="h-4 w-4" />,
      isActive: currentStep === "sms_sign" || currentStep === "bank_sign",
      isCompleted: isSigningCompleted,
      children: [
        {
          id: "sms_sign",
          label: "手机签约",
          icon: <Phone className="h-3 w-3" />,
          isActive: currentStep === "sms_sign",
          isCompleted: isSmsSignCompleted,
          subLabel: isSmsSignCompleted ? "已签约" : "待签约"
        },
        {
          id: "bank_sign",
          label: "银行卡签约",
          icon: <CreditCard className="h-3 w-3" />,
          isActive: currentStep === "bank_sign",
          isCompleted: isBankSignCompleted,
          subLabel: isBankSignCompleted ? "已签约" : "待签约"
        }
      ]
    },
    {
      id: "multi_child",
      label: "多孩家庭提额",
      icon: <Baby className="h-4 w-4" />,
      isActive: false,
      isCompleted: isMultiChildChecked,
      subLabel: isMultiChildChecked ? "满足" : undefined // 未完成时不显示
    },
    {
      id: "deposit",
      label: "缴存提取状况",
      icon: <Wallet className="h-4 w-4" />,
      isActive: false,
      isCompleted: isDepositChecked,
      subLabel: isDepositChecked ? "满足" : undefined // 未完成时不显示
    },
    {
      id: "property",
      label: "缴存地房产状况",
      icon: <Building className="h-4 w-4" />,
      isActive: false,
      isCompleted: isPropertyChecked,
      subLabel: isPropertyChecked ? "满足" : undefined // 未完成时不显示
    },
    {
      id: "loan",
      label: "家庭贷款情况",
      icon: <Landmark className="h-4 w-4" />,
      isActive: false,
      isCompleted: isLoanChecked,
      subLabel: isLoanChecked ? "满足" : undefined // 未完成时不显示
    },
    {
      id: "extract_details",
      label: "提取详情",
      icon: <FileText className="h-4 w-4" />,
      isActive: currentStep === "extract_details",
      isCompleted: isExtractDetailsReady,
    },
    {
      id: "submit",
      label: "提交成功",
      icon: <PartyPopper className="h-4 w-4" />,
      isActive: currentStep === "submit",
      isCompleted: isSubmitted,
    }
  ]

  const renderStep = (step: FlowStep, index: number, isChild = false, isLastChild = false) => {
    const hasChildren = step.children && step.children.length > 0
    const isExpanded = expandedSteps.has(step.id)

    return (
      <div key={step.id} className={cn("relative", isChild && "ml-6")}>
        {/* 连接线 */}
        {!isChild && index > 0 && (
          <div className={cn(
            "absolute left-[11px] -top-3 w-0.5 h-3",
            step.isCompleted || step.isActive ? "bg-green-400" : "bg-gray-200 dark:bg-gray-700"
          )} />
        )}
        
        {/* 子节点连接线 */}
        {isChild && (
          <>
            <div className={cn(
              "absolute left-[-12px] top-3 w-3 h-0.5",
              step.isCompleted ? "bg-green-400" : "bg-gray-200 dark:bg-gray-700"
            )} />
            {!isLastChild && (
              <div className={cn(
                "absolute left-[-12px] top-3 w-0.5 h-full",
                "bg-gray-200 dark:bg-gray-700"
              )} />
            )}
          </>
        )}

        {/* 步骤内容 */}
        <motion.div
          initial={false}
          animate={{ 
            scale: step.isActive ? 1.02 : 1,
          }}
          className={cn(
            "flex items-center gap-2 py-1.5 px-2 rounded-lg transition-colors",
            step.isActive && "bg-blue-50 dark:bg-blue-900/20",
            step.clickable && "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
          )}
          onClick={() => {
            if (hasChildren) {
              toggleExpand(step.id)
            } else if (step.onClick) {
              step.onClick()
            }
          }}
        >
          {/* 图标 */}
          <div className={cn(
            "relative flex items-center justify-center w-6 h-6 rounded-full shrink-0 transition-all",
            step.isCompleted 
              ? "bg-green-500 text-white" 
              : step.isActive 
                ? "bg-blue-500 text-white ring-2 ring-blue-200 dark:ring-blue-800" 
                : "bg-gray-100 dark:bg-gray-800 text-gray-400"
          )}>
            {step.isCompleted ? (
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
            {step.isActive && !step.isCompleted && (
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
                step.isCompleted 
                  ? "text-green-600 dark:text-green-400" 
                  : step.isActive 
                    ? "text-blue-600 dark:text-blue-400" 
                    : "text-gray-500 dark:text-gray-400"
              )}>
                {step.label}
              </span>
              {hasChildren && (
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="h-3 w-3 text-gray-400" />
                </motion.div>
              )}
            </div>
            {step.subLabel && (
              <span className="text-[10px] text-gray-400 dark:text-gray-500 truncate block">
                {step.subLabel}
              </span>
            )}
          </div>
        </motion.div>

        {/* 子步骤 */}
        <AnimatePresence>
          {hasChildren && isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="relative ml-3 mt-1 pl-3 border-l-2 border-gray-200 dark:border-gray-700">
                {step.children?.map((child, childIndex) => 
                  renderStep(child, childIndex, true, childIndex === (step.children?.length || 0) - 1)
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 可选提取类型 */}
        {step.id === "extract_type" && step.clickable && step.children && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="ml-8 mt-1 flex flex-wrap gap-1"
          >
            {step.children.map((child) => (
              <motion.button
                key={child.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={child.onClick}
                className="px-2 py-1 text-[10px] bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full hover:bg-blue-100 dark:hover:bg-blue-800/50 transition-colors"
              >
                {child.label}
              </motion.button>
            ))}
          </motion.div>
        )}
      </div>
    )
  }

  const completedCount = flowSteps.filter(s => s.isCompleted).length
  const progressPercent = Math.round((completedCount / flowSteps.length) * 100)

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
                {flowSteps.map((step, index) => renderStep(step, index))}
              </div>
              
              {/* 底部进度条（详细） */}
              <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-800">
                <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1">
                  <span>办理进度</span>
                  <span>{completedCount}/{flowSteps.length} 步骤</span>
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

