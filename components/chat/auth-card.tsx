"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Info, CheckSquare, Square, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import type { UserBasicInfo } from "@/types/chat"

interface AuthCardProps {
  userInfo: UserBasicInfo
  onConfirm: () => void
  className?: string
  // 是否是查询公积金的授权（processing_auth），授权后只显示"授权成功"
  isProcessingAuth?: boolean
  // 是否已完成授权（用于显示翻转后的卡片）
  authCompleted?: boolean
  // 可办理的提取类型（仅 auth 类型显示）
  permitExtractTypes?: string[]
  // 点击提取类型时的回调
  onSelectExtractType?: (type: string) => void
  // 是否是配偶授权
  isSpouse?: boolean
}

export default function AuthCard({ 
  userInfo, 
  onConfirm, 
  className,
  isProcessingAuth = false,
  authCompleted = false,
  permitExtractTypes = [],
  onSelectExtractType,
  isSpouse = false
}: AuthCardProps) {
  const personLabel = isSpouse ? "配偶" : "本人"
  const [agreed, setAgreed] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(authCompleted)

  // 当 authCompleted 变化时更新 showSuccess
  useEffect(() => {
    if (authCompleted) {
      setShowSuccess(true)
    }
  }, [authCompleted])

  // 获取当前日期
  const today = new Date()
  const signDate = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`

  const handleConfirm = async () => {
    if (!agreed || isSubmitting) return
    setIsSubmitting(true)
    await onConfirm()
    setIsSubmitting(false)
    setShowSuccess(true)
  }

  // 授权成功后的卡片
  if (showSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, rotateY: 90 }}
        animate={{ opacity: 1, rotateY: 0 }}
        transition={{ duration: 0.4 }}
        className={cn(
          "bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden max-w-lg",
          className
        )}
      >
        <div className="p-6 flex flex-col items-center justify-center min-h-[200px]">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
          </motion.div>
          <motion.h3
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-xl font-semibold text-gray-900 dark:text-gray-100"
          >
            授权成功！
          </motion.h3>
          
          {/* 只有非 processing_auth 类型才显示提取业务选项 */}
          {!isProcessingAuth && permitExtractTypes.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-6 w-full"
            >
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 text-center">
                您可办理以下提取业务：
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {permitExtractTypes.map((type) => (
                  <motion.button
                    key={type}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onSelectExtractType?.(`我要办理${type}提取`)}
                    className="px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-sm font-medium hover:bg-blue-100 dark:hover:bg-blue-800/50 transition-colors"
                  >
                    {type}提取
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    )
  }

  // 授权表单
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden max-w-lg",
        className
      )}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 text-center">
          {isSpouse ? "配偶" : ""}个人信息查询报送授权书
        </h3>
      </div>

      {/* 授权书内容 - 包含重要提示 */}
      <div className="px-4 py-4 max-h-[350px] overflow-y-auto">
        {/* 重要提示 */}
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
            <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
              <span className="font-semibold">重要提示：</span>
              为了维护您的权益，请在签署本授权书前，仔细阅读本授权书各条款（特别是黑体字条款），关注您在授权书中的权利、义务。
            </p>
          </div>
        </div>
        <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed space-y-3">
          <p className="font-medium text-gray-900 dark:text-gray-100">福建省直单位住房公积金中心：</p>
          
          <p>
            一、本人同意并不可撤销的授权：<span className="font-bold">按照国家相关规定，各商业银行、不动产登记和交易中心、民政局、公安等有权机构有权向贵中心提供本人的个人住房贷款还款明细、个人房产、婚姻、户籍等信息。</span>
          </p>
          
          <p>
            二、本人同意并不可撤销的授权：<span className="font-bold">贵中心根据国家有关规定，在办理涉及本人的公积金业务时，有权向各商业银行、不动产登记和交易中心、民政局、公安局等有权机构查询、打印、保存本人的个人住房贷款还款明细、个人房产、婚姻、户籍等信息，并用于下述用途：</span>
          </p>
          
          <div className="pl-4 space-y-1">
            <p>（一）审核本人公积金归集业务办理；</p>
            <p>（二）审核本人公积金提取业务办理；</p>
            <p>（三）审核本人（本人配偶、共同借款人、共同借款人配偶）贷款申请及贷后业务的办理；</p>
            <p>（四）其他与本人办理公积金业务相关需要查询、确认的个人信息。</p>
          </div>
          
          <p className="font-bold">
            若本人在贵中心业务未获批准办理，本人接受贵中心文件管理要求，将本人授权书及本人申请办理的公积金业务等资料留在贵中心留存，无须退回。
          </p>
          
          <p className="font-bold">本授权书有效期至本人业务办理结束或终止之日止。</p>
          
          <p className="font-bold">
            本人声明：本人已仔细阅读上述所有条款，并已特别注意字体加黑的内容。贵中心已应本人要求对相关条款予以明确说明。本人对所有条款的含义及相应的法律后果已全部知晓并充分理解，本人自愿作出上述授权、承诺和声明。
          </p>
        </div>
      </div>

      {/* 签名信息 */}
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800">
        <div className="space-y-2 text-sm">
          <div className="flex">
            <span className="text-gray-500 dark:text-gray-400 w-20">本人签名：</span>
            <span className="text-gray-900 dark:text-gray-100 font-medium">{userInfo.name}</span>
          </div>
          <div className="flex">
            <span className="text-gray-500 dark:text-gray-400 w-20">联系电话：</span>
            <span className="text-gray-900 dark:text-gray-100">{userInfo.phone}</span>
          </div>
          <div className="flex">
            <span className="text-gray-500 dark:text-gray-400 w-20">证件名称：</span>
            <span className="text-gray-900 dark:text-gray-100">{userInfo.idType}</span>
          </div>
          <div className="flex">
            <span className="text-gray-500 dark:text-gray-400 w-20">证件号码：</span>
            <span className="text-gray-900 dark:text-gray-100">{userInfo.idNumber}</span>
          </div>
          <div className="flex">
            <span className="text-gray-500 dark:text-gray-400 w-20">签署日期：</span>
            <span className="text-gray-900 dark:text-gray-100">{signDate}</span>
          </div>
        </div>
      </div>

      {/* 同意复选框 */}
      <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800">
        <button
          onClick={() => setAgreed(!agreed)}
          className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
        >
          {agreed ? (
            <CheckSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          ) : (
            <Square className="h-5 w-5 text-gray-400" />
          )}
          <span>以上内容阅读并理解，本人同意授权</span>
        </button>
      </div>

      {/* 确认按钮 */}
      <div className="px-4 pb-4">
        <button
          onClick={handleConfirm}
          disabled={!agreed || isSubmitting}
          className={cn(
            "w-full py-3 rounded-xl text-white font-medium transition-all",
            agreed && !isSubmitting
              ? "bg-blue-600 hover:bg-blue-700 active:scale-[0.98]"
              : "bg-gray-300 dark:bg-gray-600 cursor-not-allowed"
          )}
        >
          {isSubmitting ? "处理中..." : "同意"}
        </button>
      </div>
    </motion.div>
  )
}
