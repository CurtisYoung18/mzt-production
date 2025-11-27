"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Phone, CreditCard, CheckCircle, Loader2, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { UserBasicInfo } from "@/types/chat"

interface SignCardProps {
  message: string
  userInfo: UserBasicInfo
  onConfirm: () => void
  className?: string
}

// 判断是手机签约还是银行卡签约
function getSignType(message: string): "phone" | "bank" {
  if (message.includes("手机") || message.includes("电话")) {
    return "phone"
  }
  return "bank"
}

export default function SignCard({ message, userInfo, onConfirm, className }: SignCardProps) {
  const [isFlipped, setIsFlipped] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [agreed, setAgreed] = useState(false)

  const signType = getSignType(message)
  const isPhone = signType === "phone"

  const handleGoSign = () => {
    setIsFlipped(true)
  }

  const handleConfirmSign = async () => {
    if (!agreed || isSubmitting) return
    setIsSubmitting(true)
    
    // 模拟签约过程
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    setIsComplete(true)
    
    // 等待动画后调用回调
    setTimeout(() => {
      onConfirm()
    }, 1000)
  }

  return (
    <div className={cn("perspective-1000", className)} style={{ perspective: "1000px" }}>
      <AnimatePresence mode="wait">
        {!isFlipped ? (
          // 正面 - 提示卡片
          <motion.div
            key="front"
            initial={{ rotateY: 0 }}
            exit={{ rotateY: -90 }}
            transition={{ duration: 0.3 }}
            className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden max-w-sm"
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* 标题 */}
            <div className="px-6 py-4 text-center border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                提示
              </h3>
            </div>

            {/* 消息内容 */}
            <div className="px-6 py-6 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {message}
              </p>
            </div>

            {/* 去签约按钮 */}
            <div className="px-6 pb-6">
              <motion.button
                whileHover={{ scale: 1.02, boxShadow: "0 4px 20px rgba(234, 179, 8, 0.3)" }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGoSign}
                className="w-full py-3 rounded-xl border-2 border-amber-400 text-amber-600 dark:text-amber-400 font-medium transition-all hover:bg-amber-50 dark:hover:bg-amber-900/20 flex items-center justify-center gap-2"
              >
                去签约
                <ArrowRight className="h-4 w-4" />
              </motion.button>
            </div>
          </motion.div>
        ) : (
          // 背面 - 签约页面
          <motion.div
            key="back"
            initial={{ rotateY: 90 }}
            animate={{ rotateY: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl overflow-hidden max-w-md"
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* 头部 */}
            <div className={cn(
              "px-6 py-4 text-center text-white",
              isPhone 
                ? "bg-gradient-to-r from-blue-500 to-cyan-500" 
                : "bg-gradient-to-r from-purple-500 to-pink-500"
            )}>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="w-16 h-16 mx-auto mb-3 rounded-full bg-white/20 flex items-center justify-center"
              >
                {isPhone ? (
                  <Phone className="h-8 w-8 text-white" />
                ) : (
                  <CreditCard className="h-8 w-8 text-white" />
                )}
              </motion.div>
              <h3 className="text-lg font-semibold">
                {isPhone ? "手机号签约" : "银行卡签约"}
              </h3>
              <p className="text-sm text-white/80 mt-1">
                {isPhone ? "绑定您的手机号码以接收通知" : "绑定您的银行卡以接收提取款项"}
              </p>
            </div>

            {/* 签约信息 */}
            <div className="px-6 py-5">
              <div className="space-y-4">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl"
                >
                  <span className="text-sm text-gray-500 dark:text-gray-400">姓名</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{userInfo.name}</span>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl"
                >
                  <span className="text-sm text-gray-500 dark:text-gray-400">证件号码</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{userInfo.idNumber}</span>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl"
                >
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {isPhone ? "手机号码" : "银行卡号"}
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {isPhone ? userInfo.phone : "6214 **** **** 1234"}
                  </span>
                </motion.div>
              </div>

              {/* 协议 */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-5"
              >
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                    我已阅读并同意《{isPhone ? "手机号签约" : "银行卡签约"}服务协议》，
                    确认以上信息无误
                  </span>
                </label>
              </motion.div>
            </div>

            {/* 确认按钮 */}
            <div className="px-6 pb-6">
              <AnimatePresence mode="wait">
                {isComplete ? (
                  <motion.div
                    key="complete"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex items-center justify-center gap-2 py-3 rounded-xl bg-green-500 text-white font-medium"
                  >
                    <CheckCircle className="h-5 w-5" />
                    签约成功
                  </motion.div>
                ) : (
                  <motion.button
                    key="button"
                    whileHover={{ scale: agreed ? 1.02 : 1 }}
                    whileTap={{ scale: agreed ? 0.98 : 1 }}
                    onClick={handleConfirmSign}
                    disabled={!agreed || isSubmitting}
                    className={cn(
                      "w-full py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2",
                      agreed && !isSubmitting
                        ? isPhone
                          ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:shadow-lg"
                          : "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg"
                        : "bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
                    )}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        签约中...
                      </>
                    ) : (
                      "确认签约"
                    )}
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

