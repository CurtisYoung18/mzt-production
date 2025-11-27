"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle, FileText, Shield, Star, MessageCircle, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface FinishCardProps {
  message: string
  onViewRecords?: () => void
  onContinueChat?: () => void
  onEndChat?: (rating: number) => void
  className?: string
}

export default function FinishCard({ 
  message, 
  onViewRecords, 
  onContinueChat,
  onEndChat,
  className 
}: FinishCardProps) {
  const [showFollowUp, setShowFollowUp] = useState(false)
  const [showRating, setShowRating] = useState(false)
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [hasRated, setHasRated] = useState(false)

  // 3秒后显示后续提示气泡
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowFollowUp(true)
    }, 3000)
    return () => clearTimeout(timer)
  }, [])

  const handleEndChat = () => {
    setShowFollowUp(false)
    setShowRating(true)
  }

  const handleSubmitRating = () => {
    setHasRated(true)
    onEndChat?.(rating)
    // 1.5秒后关闭评分面板
    setTimeout(() => {
      setShowRating(false)
    }, 1500)
  }

  const suggestedQuestions = [
    "公积金提取需要多长时间到账？",
    "我还能申请其他提取类型吗？",
    "如何查询提取进度？",
  ]

  return (
    <div className={cn("space-y-3", className)}>
      {/* 成功卡片 */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="bg-gradient-to-b from-blue-50 to-white dark:from-blue-950/30 dark:to-gray-900 rounded-2xl border border-blue-100 dark:border-blue-900/50 shadow-lg overflow-hidden max-w-sm"
      >
        {/* 装饰背景 */}
        <div className="relative h-40 bg-gradient-to-br from-blue-100/80 via-blue-50 to-white dark:from-blue-900/40 dark:via-blue-950/30 dark:to-gray-900 overflow-hidden">
          {/* 云朵装饰 */}
          <motion.div
            animate={{ x: [0, 10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-4 right-8 w-16 h-8 bg-white/60 dark:bg-white/20 rounded-full blur-sm"
          />
          <motion.div
            animate={{ x: [0, -8, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-8 right-20 w-12 h-6 bg-white/40 dark:bg-white/10 rounded-full blur-sm"
          />
          <motion.div
            animate={{ x: [0, 6, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-12 left-6 w-10 h-5 bg-white/50 dark:bg-white/15 rounded-full blur-sm"
          />
          
          {/* 主图标 */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              {/* 文件图标 */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="relative"
              >
                <div className="w-20 h-24 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center">
                  <div className="w-12 h-1 bg-gray-200 dark:bg-gray-600 rounded mb-1.5" />
                  <div className="w-10 h-1 bg-gray-200 dark:bg-gray-600 rounded mb-1.5" />
                  <div className="w-12 h-1 bg-gray-200 dark:bg-gray-600 rounded mb-1.5" />
                  <div className="w-8 h-1 bg-gray-200 dark:bg-gray-600 rounded" />
                </div>
                {/* 折角 */}
                <div className="absolute -top-1 -left-1 w-6 h-6 bg-blue-200 dark:bg-blue-800 rounded-br-lg" />
              </motion.div>
              
              {/* 盾牌勾选图标 */}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.4, type: "spring" }}
                className="absolute -right-6 -bottom-2"
              >
                <div className="relative">
                  <Shield className="w-14 h-14 text-blue-500 fill-blue-500/20" />
                  <CheckCircle className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-white fill-blue-500" />
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="px-6 py-5 text-center">
          <motion.h3
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2"
          >
            提交成功
          </motion.h3>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed"
          >
            您已提交成功，提取金额和资金到账时间以审核结果为准
          </motion.p>
        </div>

        {/* 查看记录按钮 */}
        <div className="px-6 pb-6">
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onViewRecords}
            className="w-full py-3 rounded-xl border-2 border-amber-300 text-amber-600 dark:text-amber-400 font-medium transition-all hover:bg-amber-50 dark:hover:bg-amber-900/20 flex items-center justify-center gap-2"
          >
            <FileText className="w-4 h-4" />
            查看提取记录 &gt;
          </motion.button>
        </div>
      </motion.div>

      {/* 后续提示气泡 */}
      <AnimatePresence>
        {showFollowUp && !showRating && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden max-w-sm"
          >
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <MessageCircle className="w-5 h-5 text-blue-500" />
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  还可以问我这些问题
                </span>
              </div>
              
              <div className="space-y-2 mb-4">
                {suggestedQuestions.map((question, index) => (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => {
                      onContinueChat?.()
                      setShowFollowUp(false)
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    {question}
                  </motion.button>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowFollowUp(false)}
                  className="flex-1 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                >
                  继续对话
                </button>
                <button
                  onClick={handleEndChat}
                  className="flex-1 py-2 text-sm text-blue-600 dark:text-blue-400 font-medium hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                >
                  结束本次对话
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 评分面板 */}
      <AnimatePresence>
        {showRating && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden max-w-sm"
          >
            <div className="p-5 text-center">
              {!hasRated ? (
                <>
                  <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    为本次服务评分
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    您的反馈将帮助我们提供更好的服务
                  </p>
                  
                  {/* 星星评分 */}
                  <div className="flex justify-center gap-2 mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <motion.button
                        key={star}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="focus:outline-none"
                      >
                        <Star
                          className={cn(
                            "w-8 h-8 transition-colors",
                            (hoverRating || rating) >= star
                              ? "text-amber-400 fill-amber-400"
                              : "text-gray-300 dark:text-gray-600"
                          )}
                        />
                      </motion.button>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowRating(false)}
                      className="flex-1 py-2.5 text-sm text-gray-500 dark:text-gray-400 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      跳过
                    </button>
                    <button
                      onClick={handleSubmitRating}
                      disabled={rating === 0}
                      className={cn(
                        "flex-1 py-2.5 text-sm font-medium rounded-xl transition-all",
                        rating > 0
                          ? "bg-blue-500 text-white hover:bg-blue-600"
                          : "bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
                      )}
                    >
                      提交评分
                    </button>
                  </div>
                </>
              ) : (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="py-4"
                >
                  <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                  <p className="text-base font-medium text-gray-900 dark:text-gray-100">
                    感谢您的评价！
                  </p>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

