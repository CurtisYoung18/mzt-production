"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Wallet, ChevronRight, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import type { AccountInfo } from "@/types/chat"

export type { AccountInfo }

interface AccountDetailsCardProps {
  accountInfo: AccountInfo
  className?: string
  onChangePhone?: () => void
  onChangeBankAccount?: () => void
}

export default function AccountDetailsCard({ 
  accountInfo, 
  className,
  onChangePhone,
  onChangeBankAccount 
}: AccountDetailsCardProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="space-y-3">
      <h4 className="text-base font-semibold text-orange-600 dark:text-orange-400 flex items-center gap-2 border-l-4 border-orange-500 pl-3">
        {title}
      </h4>
      <div className="space-y-2.5 pl-1">
        {children}
      </div>
    </div>
  )

  const InfoRow = ({ 
    label, 
    value, 
    action 
  }: { 
    label: string
    value: string | number
    action?: () => void 
  }) => (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <span className="text-sm text-gray-500 dark:text-gray-400 min-w-[100px]">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{value}</span>
        {action && (
          <button
            onClick={action}
            className="text-xs text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 flex items-center gap-0.5 transition-colors"
          >
            变更
            <ChevronRight className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "bg-white dark:bg-gray-900 rounded-2xl border border-orange-200/50 dark:border-orange-800/30 shadow-lg overflow-hidden",
        className
      )}
    >
      {/* Header - Clickable to toggle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-5 py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600 transition-all"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            账户详情
          </h3>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="h-5 w-5" />
          </motion.div>
        </div>
      </button>

      {/* Content - Collapsible */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="p-5 space-y-6 max-h-[400px] overflow-y-auto custom-scrollbar">
              {/* 个人基础信息 */}
              <Section title="个人基础信息">
                <InfoRow label="个人账户" value={accountInfo.personalAccount} />
                <InfoRow label="开户日期" value={accountInfo.openDate} />
                <InfoRow label="缴至年月" value={accountInfo.paidUntil} />
                <InfoRow label="证件类型" value={accountInfo.idType} />
                <InfoRow label="证件号码" value={accountInfo.idNumber} />
                <InfoRow label="现户籍" value={accountInfo.residence} />
                <InfoRow label="婚姻状况" value={accountInfo.maritalStatus} />
                <InfoRow label="手机号码" value={accountInfo.phone} action={onChangePhone} />
                <InfoRow label="签约银行" value={accountInfo.bankName} />
                <InfoRow label="银行卡号" value={accountInfo.bankAccount} action={onChangeBankAccount} />
              </Section>

              {/* 公积金缴存信息 */}
              <Section title="公积金缴存信息">
                <InfoRow label="账户类型" value={accountInfo.accountType} />
                <InfoRow label="账户状态" value={accountInfo.accountStatus} />
                {accountInfo.sealDate && <InfoRow label="封存日期" value={accountInfo.sealDate} />}
                <InfoRow label="个人缴存基数" value={accountInfo.depositBase} />
                <InfoRow label="个人缴存比例" value={accountInfo.personalRate} />
                <InfoRow label="个人缴存金额" value={accountInfo.personalAmount} />
                <InfoRow label="单位缴存比例" value={accountInfo.companyRate} />
                <InfoRow label="单位缴存金额" value={accountInfo.companyAmount} />
              </Section>

              {/* 单位信息 */}
              <Section title="单位信息">
                <InfoRow label="单位名称" value={accountInfo.companyName} />
                <InfoRow label="单位账号" value={accountInfo.companyAccount} />
              </Section>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

