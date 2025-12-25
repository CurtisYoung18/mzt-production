"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  CheckCircle, 
  FileText, 
  Shield, 
  Star, 
  MessageCircle, 
  Loader2,
  QrCode,
  ScanFace,
  Send,
  Home,
  Clock,
  ArrowLeft,
  ChevronRight
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { AccountInfo } from "@/types/chat"

interface FinishCardProps {
  message: string
  accountInfo?: AccountInfo | null
  extractType?: string
  userId?: string  // 用户ID，用于调用 workflow API
  onViewRecords?: () => void
  onContinueChat?: () => void
  onEndChat?: (rating: number) => void
  onSubmitSuccess?: () => void // 提交成功回调
  onSendMessage?: (content: string) => void // 发送消息到聊天
  className?: string
}

type CardStage = "details" | "face_auth" | "verifying" | "success" | "records"

// 模拟提取记录数据
const mockRecords = [
  { id: "EXT202411270001", type: "租房提取", amount: "1,500.00", status: "pending", statusText: "审核中", date: "2024-11-27" },
  { id: "EXT202410150002", type: "租房提取", amount: "1,500.00", status: "success", statusText: "提取成功", date: "2024-10-15" },
  { id: "EXT202409120003", type: "租房提取", amount: "1,500.00", status: "success", statusText: "提取成功", date: "2024-09-12" },
  { id: "EXT202408080004", type: "购房提取", amount: "50,000.00", status: "success", statusText: "提取成功", date: "2024-08-08" },
]

export default function FinishCard({ 
  message, 
  accountInfo,
  extractType = "租房",
  userId,
  onViewRecords, 
  onContinueChat,
  onEndChat,
  onSubmitSuccess,
  onSendMessage,
  className 
}: FinishCardProps) {
  const [stage, setStage] = useState<CardStage>("details")
  const [verificationCode, setVerificationCode] = useState("")
  const [codeSent, setCodeSent] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [showFollowUp, setShowFollowUp] = useState(false)
  const [showRating, setShowRating] = useState(false)
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [hasRated, setHasRated] = useState(false)

  // Mock 数据
  const mockData = {
    gjjAccount: accountInfo?.personalAccount || "14**************021",
    accountType: accountInfo?.accountType || "住房公积金",
    name: "张*三",
    accountStatus: accountInfo?.accountStatus || "正常",
    balance: "72,000元",
    maritalStatus: accountInfo?.maritalStatus || "已婚",
    extractReason: `${extractType}提取`,
    bankName: accountInfo?.bankName || "中国工商银行",
    bankAccount: accountInfo?.bankAccount || "2889***8928",
    extractAmount: "1500元",
    signedPhone: accountInfo?.phone || "133****3355"
  }

  // 发送验证码倒计时
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  // 成功后 3 秒显示后续提示
  useEffect(() => {
    if (stage === "success") {
      const timer = setTimeout(() => setShowFollowUp(true), 3000)
      return () => clearTimeout(timer)
    }
  }, [stage])

  const handleSendCode = () => {
    setCodeSent(true)
    setCountdown(60)
  }

  const handleSubmit = () => {
    if (!verificationCode) return
    setStage("face_auth")
  }

  const handleFaceAuthComplete = async () => {
    setStage("verifying")
    
    // 调用 workflow type=1132 提交
    if (userId) {
      try {
        const response = await fetch("/api/workflow", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: 1132, // 提取提交
            userId: userId,
          }),
        })
        
        const result = await response.json()
        console.log("[FinishCard] 提取提交结果:", result)
        
        // 检查 success 字段判断是否成功
        if (result.success === true) {
          setStage("success")
          onSubmitSuccess?.() // 通知父组件提交成功
        } else {
          // 提交失败，显示错误并发送 userMessage 到聊天
          const errorMessage = result.userMessage || "提交失败，请重试"
          console.log("[FinishCard] 提交未通过:", errorMessage)
          
          // 发送 userMessage 到聊天
          if (onSendMessage && result.userMessage) {
            setTimeout(() => {
              onSendMessage(result.userMessage)
            }, 500)
          }
          
          // 回到详情页
          setStage("details")
        }
      } catch (error) {
        console.error("[FinishCard] 提交出错:", error)
        // 出错时发送错误消息
        if (onSendMessage) {
          setTimeout(() => {
            onSendMessage("提交过程中出现错误，请稍后重试")
          }, 500)
        }
        // 出错回到详情页
        setStage("details")
      }
    } else {
      // 没有 userId，无法提交
      console.error("[FinishCard] 没有 userId，无法提交")
      setStage("details")
    }
  }

  const handleEndChat = () => {
    setShowFollowUp(false)
    setShowRating(true)
  }

  const handleSubmitRating = () => {
    setHasRated(true)
    onEndChat?.(rating)
    setTimeout(() => setShowRating(false), 1500)
  }

  const suggestedQuestions = [
    "公积金提取需要多长时间到账？",
    "我还能申请其他提取类型吗？",
    "如何查询提取进度？",
  ]

  return (
    <div className={cn("space-y-3", className)}>
      <div style={{ perspective: "1000px" }}>
        <AnimatePresence mode="wait">
          {/* 第一层：提取详情确认 */}
          {stage === "details" && (
            <motion.div
              key="details"
              initial={{ opacity: 0, rotateY: -90 }}
              animate={{ opacity: 1, rotateY: 0 }}
              exit={{ opacity: 0, rotateY: 90 }}
              transition={{ duration: 0.4 }}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden max-w-md"
              style={{ transformStyle: "preserve-3d" }}
            >
              {/* 标题 */}
              <div className="px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-center">
                <h3 className="text-base font-semibold">公积金提取</h3>
              </div>

              {/* 个人基础信息 */}
              <div className="p-4 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1 h-4 bg-blue-500 rounded-full" />
                  <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">个人基础信息</span>
                </div>
                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">公积金账户</span>
                    <span className="text-gray-900 dark:text-gray-100">{mockData.gjjAccount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">账户类型</span>
                    <span className="text-gray-900 dark:text-gray-100">{mockData.accountType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">姓名</span>
                    <span className="text-gray-900 dark:text-gray-100">{mockData.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">账户状态</span>
                    <span className="text-green-600 dark:text-green-400">{mockData.accountStatus}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">账户余额</span>
                    <span className="text-gray-900 dark:text-gray-100">{mockData.balance}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">婚姻状况</span>
                    <span className="text-gray-900 dark:text-gray-100">{mockData.maritalStatus}</span>
                  </div>
                </div>
              </div>

              {/* 公积金提取信息 */}
              <div className="p-4 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1 h-4 bg-blue-500 rounded-full" />
                  <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">公积金提取信息</span>
                </div>
                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">提取原因</span>
                    <span className="text-gray-900 dark:text-gray-100">{mockData.extractReason}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">收款银行</span>
                    <span className="text-gray-900 dark:text-gray-100">{mockData.bankName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">收款银行账号</span>
                    <span className="text-gray-900 dark:text-gray-100">{mockData.bankAccount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">预计可提取金额</span>
                    <span className="text-xl font-bold text-orange-500">{mockData.extractAmount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">签约手机号</span>
                    <span className="text-gray-900 dark:text-gray-100">{mockData.signedPhone}</span>
                  </div>
                </div>
              </div>

              {/* 验证码 */}
              <div className="p-4 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500 dark:text-gray-400 shrink-0">验证码</span>
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="请输入验证码"
                    className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                    maxLength={6}
                  />
                  <button
                    onClick={handleSendCode}
                    disabled={countdown > 0}
                    className={cn(
                      "px-3 py-2 text-sm rounded-lg border transition-colors shrink-0",
                      countdown > 0
                        ? "border-gray-200 text-gray-400 cursor-not-allowed"
                        : "border-blue-500 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                    )}
                  >
                    {countdown > 0 ? `${countdown}s` : "发送验证码"}
                  </button>
                </div>
              </div>

              {/* 提交按钮 */}
              <div className="p-4">
                <button
                  onClick={handleSubmit}
                  disabled={!verificationCode}
                  className={cn(
                    "w-full py-3 rounded-xl text-white font-medium transition-all",
                    verificationCode
                      ? "bg-blue-500 hover:bg-blue-600 active:scale-[0.98]"
                      : "bg-gray-300 dark:bg-gray-600 cursor-not-allowed"
                  )}
                >
                  提交申请
                </button>
                <p className="mt-3 text-xs text-center text-gray-400">
                  服务由省直公积金中心提供<br />
                  咨询电话：12329
                </p>
              </div>
            </motion.div>
          )}

          {/* 第二层：人脸认证 */}
          {stage === "face_auth" && (
            <motion.div
              key="face_auth"
              initial={{ opacity: 0, rotateY: -90 }}
              animate={{ opacity: 1, rotateY: 0 }}
              exit={{ opacity: 0, rotateY: 90 }}
              transition={{ duration: 0.4 }}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden max-w-md"
              style={{ transformStyle: "preserve-3d" }}
            >
              {/* 标题 */}
              <div className="px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-center">
                <h3 className="text-base font-semibold">人脸认证</h3>
              </div>

              <div className="p-6 text-center">
                <div className="mb-4">
                  <ScanFace className="h-12 w-12 mx-auto text-purple-500 mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    请使用闽政通APP扫描下方二维码完成人脸认证
                  </p>
                </div>

                {/* Mock QR Code */}
                <div className="mx-auto w-48 h-48 bg-white p-3 rounded-xl shadow-lg border border-gray-200 mb-4">
                  <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center relative overflow-hidden">
                    {/* QR Code 模拟图案 */}
                    <div className="absolute inset-4 grid grid-cols-8 gap-0.5">
                      {Array.from({ length: 64 }).map((_, i) => (
                        <div
                          key={i}
                          className={cn(
                            "aspect-square rounded-sm",
                            Math.random() > 0.5 ? "bg-gray-800" : "bg-transparent"
                          )}
                        />
                      ))}
                    </div>
                    {/* 中间 Logo */}
                    <div className="absolute bg-white p-2 rounded-lg shadow">
                      <QrCode className="h-6 w-6 text-purple-500" />
                    </div>
                  </div>
                </div>

                <p className="text-xs text-gray-400 mb-6">
                  二维码有效期：5分钟
                </p>

                <button
                  onClick={handleFaceAuthComplete}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:opacity-90 active:scale-[0.98] transition-all"
                >
                  我已完成人脸认证
                </button>
              </div>
            </motion.div>
          )}

          {/* 第二层半：核对动画 */}
          {stage === "verifying" && (
            <motion.div
              key="verifying"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden max-w-md"
            >
              <div className="p-12 text-center">
                {/* 旋转图标容器 - 固定尺寸防止抖动 */}
                <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Loader2 className="h-16 w-16 text-blue-500 animate-spin" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  正在核对信息
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  请稍候，正在验证您的人脸认证结果...
                </p>
                {/* 进度条动画 */}
                <div className="mt-4 w-48 mx-auto">
                  <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ x: "-100%" }}
                      animate={{ x: "100%" }}
                      transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                      className="h-full w-1/2 bg-gradient-to-r from-transparent via-blue-500 to-transparent rounded-full"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* 第三层：成功 */}
          {stage === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="bg-gradient-to-b from-blue-50 to-white dark:from-blue-950/30 dark:to-gray-900 rounded-2xl border border-blue-100 dark:border-blue-900/50 shadow-lg overflow-hidden max-w-md"
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
                      <div className="absolute -top-1 -left-1 w-6 h-6 bg-blue-200 dark:bg-blue-800 rounded-br-lg" />
                    </motion.div>
                    
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
                  onClick={() => setStage("records")}
                  className="w-full py-3 rounded-xl border-2 border-amber-300 text-amber-600 dark:text-amber-400 font-medium transition-all hover:bg-amber-50 dark:hover:bg-amber-900/20 flex items-center justify-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  查看提取记录 &gt;
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* 提取记录页面 */}
          {stage === "records" && (
            <motion.div
              key="records"
              initial={{ opacity: 0, rotateY: -90 }}
              animate={{ opacity: 1, rotateY: 0 }}
              exit={{ opacity: 0, rotateY: 90 }}
              transition={{ duration: 0.4 }}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden max-w-md"
              style={{ transformStyle: "preserve-3d" }}
            >
              {/* 标题 */}
              <div className="px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white flex items-center gap-3">
                <button
                  onClick={() => setStage("success")}
                  className="p-1 rounded-full hover:bg-white/20 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <h3 className="text-base font-semibold flex-1">提取记录</h3>
              </div>

              {/* 统计 */}
              <div className="p-4 bg-gradient-to-b from-amber-50 to-white dark:from-amber-900/10 dark:to-gray-900">
                <div className="flex justify-between text-center">
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">¥54,500</p>
                    <p className="text-xs text-gray-500">累计提取</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">4</p>
                    <p className="text-xs text-gray-500">成功次数</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-amber-500">1</p>
                    <p className="text-xs text-gray-500">处理中</p>
                  </div>
                </div>
              </div>

              {/* 记录列表 */}
              <div className="p-4 max-h-64 overflow-y-auto">
                <div className="space-y-3">
                  {mockRecords.map((record, index) => (
                    <motion.div
                      key={record.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl"
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center",
                        record.status === "success" ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600" :
                        "bg-amber-100 dark:bg-amber-900/30 text-amber-600"
                      )}>
                        <Home className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm text-gray-900 dark:text-gray-100">{record.type}</span>
                          <span className="font-semibold text-gray-900 dark:text-gray-100">¥{record.amount}</span>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-gray-500">{record.date}</span>
                          <span className={cn(
                            "text-xs px-2 py-0.5 rounded-full",
                            record.status === "success" 
                              ? "bg-green-100 dark:bg-green-900/30 text-green-600" 
                              : "bg-amber-100 dark:bg-amber-900/30 text-amber-600"
                          )}>
                            {record.statusText}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* 返回按钮 */}
              <div className="p-4 border-t border-gray-100 dark:border-gray-800">
                <button
                  onClick={() => setStage("success")}
                  className="w-full py-2.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                >
                  返回
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 后续提示气泡 */}
      <AnimatePresence>
        {showFollowUp && !showRating && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden max-w-md"
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
            className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden max-w-md"
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
