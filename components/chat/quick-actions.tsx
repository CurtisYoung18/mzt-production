"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, FileText, Building2, Home, Briefcase, LogOut, Timer, ChevronRight, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface QuickActionsProps {
  onAccountQuery: () => void
  onExtraction: (type: string) => void
  className?: string
}

const extractionOptions = [
  { id: "rent", label: "租房提取", icon: Home, message: "我要租房提取" },
  { id: "commercial_loan", label: "偿还商业贷款提取", icon: Building2, message: "我要偿还商业贷款提取" },
  { id: "fund_loan", label: "偿还公积金或组合贷款提取", icon: FileText, message: "我要偿还公积金或组合贷款提取" },
  { id: "house_purchase", label: "购房提取（一、二手房）", icon: Home, message: "我要购房提取" },
  { id: "resignation", label: "离职提取（销户类）", icon: LogOut, message: "我要离职提取" },
  { id: "retirement", label: "正常退休提取（销户类）", icon: Timer, message: "我要正常退休提取" },
]

export default function QuickActions({ onAccountQuery, onExtraction, className }: QuickActionsProps) {
  const [showExtractionOptions, setShowExtractionOptions] = useState(false)

  return (
    <div className={cn("w-full max-w-2xl mx-auto", className)}>
      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 rounded-2xl border border-orange-200/50 dark:border-orange-800/30 shadow-lg shadow-orange-100/50 dark:shadow-orange-900/20 overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-orange-200/30 dark:border-orange-800/30 bg-gradient-to-r from-orange-100/50 to-amber-100/50 dark:from-orange-900/20 dark:to-amber-900/20">
          <h3 className="text-lg font-semibold text-orange-900 dark:text-orange-100 flex items-center gap-2">
            <span className="text-xl">🏠</span>
            快捷服务指南
          </h3>
          <p className="text-sm text-orange-700/70 dark:text-orange-300/70 mt-1">
            点击下方按钮快速办理公积金业务
          </p>
        </div>

        {/* Action Buttons */}
        <div className="p-6 space-y-4">
          {/* Account Query Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onAccountQuery}
            className="w-full flex items-center justify-between p-4 bg-white dark:bg-gray-800/50 rounded-xl border border-orange-200/50 dark:border-orange-700/30 hover:border-orange-400 dark:hover:border-orange-600 hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-200 dark:shadow-orange-900/30">
                <Search className="h-6 w-6 text-white" />
              </div>
              <div className="text-left">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100">公积金账户查询</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">查看账户余额、缴存明细等信息</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
          </motion.button>

          {/* Extraction Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowExtractionOptions(!showExtractionOptions)}
            className={cn(
              "w-full flex items-center justify-between p-4 bg-white dark:bg-gray-800/50 rounded-xl border transition-all group",
              showExtractionOptions
                ? "border-orange-400 dark:border-orange-600 shadow-md"
                : "border-orange-200/50 dark:border-orange-700/30 hover:border-orange-400 dark:hover:border-orange-600 hover:shadow-md"
            )}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-200 dark:shadow-blue-900/30">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div className="text-left">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100">公积金提取</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">租房、购房、还贷等多种提取方式</p>
              </div>
            </div>
            <motion.div
              animate={{ rotate: showExtractionOptions ? 90 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-orange-500 transition-colors" />
            </motion.div>
          </motion.button>

          {/* Extraction Options */}
          <AnimatePresence>
            {showExtractionOptions && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="pt-2 flex flex-wrap gap-2">
                  {extractionOptions.map((option, index) => (
                    <motion.button
                      key={option.id}
                      initial={{ opacity: 0, scale: 0.8, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.2 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        onExtraction(option.message)
                        setShowExtractionOptions(false)
                      }}
                      className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700 hover:border-orange-400 dark:hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/30 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-orange-700 dark:hover:text-orange-300 transition-all shadow-sm hover:shadow"
                    >
                      <option.icon className="h-4 w-4" />
                      {option.label}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}

