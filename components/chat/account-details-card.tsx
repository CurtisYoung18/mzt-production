"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Wallet, ChevronRight, ChevronDown, User, Building2, CreditCard } from "lucide-react"
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
  
  // 计算月缴存额
  const monthlyDeposit = accountInfo.monthlyDeposit || 
    (accountInfo.personalAmount + accountInfo.companyAmount)
  
  // 格式化金额显示
  const formatAmount = (amount: number | undefined) => {
    if (amount === undefined || amount === null) return '0.00'
    return amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const Section = ({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) => (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-orange-600 dark:text-orange-400 flex items-center gap-2 border-l-4 border-orange-500 pl-3">
        {icon}
        {title}
      </h4>
      <div className="space-y-0 pl-1">
        {children}
      </div>
    </div>
  )

  const InfoRow = ({ 
    label, 
    value, 
    highlight,
    action 
  }: { 
    label: string
    value: string | number | undefined
    highlight?: boolean
    action?: () => void 
  }) => {
    if (value === undefined || value === null || value === '') return null
    
    return (
      <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
        <span className="text-sm text-gray-500 dark:text-gray-400 min-w-[90px]">{label}</span>
        <div className="flex items-center gap-2">
          <span className={cn(
            "text-sm font-medium",
            highlight 
              ? "text-orange-600 dark:text-orange-400" 
              : "text-gray-900 dark:text-gray-100"
          )}>
            {value}
          </span>
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
  }

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
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Wallet className="h-5 w-5" />
            </div>
            <div className="text-left">
              <h3 className="text-lg font-semibold">
                {accountInfo.name || '公积金账户'}
              </h3>
              <p className="text-sm text-white/80">
                账号：{accountInfo.personalAccount || '-'}
              </p>
            </div>
          </div>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="h-5 w-5" />
          </motion.div>
        </div>
        
        {/* 账户余额概览 */}
        {accountInfo.totalBalance !== undefined && (
          <div className="mt-4 pt-3 border-t border-white/20">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-xs text-white/70">账户余额</p>
                <p className="text-2xl font-bold">¥ {formatAmount(accountInfo.totalBalance)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-white/70">月缴存额</p>
                <p className="text-lg font-semibold">¥ {formatAmount(monthlyDeposit)}</p>
              </div>
            </div>
          </div>
        )}
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
            <div className="p-5 space-y-5 max-h-[400px] overflow-y-auto custom-scrollbar">
              {/* 账户概况 */}
              <Section title="账户概况" icon={<CreditCard className="h-4 w-4" />}>
                <InfoRow label="账户状态" value={accountInfo.accountStatus} highlight />
                <InfoRow label="账户类型" value={accountInfo.accountType} />
                <InfoRow label="开户日期" value={accountInfo.openDate} />
                <InfoRow label="缴至年月" value={accountInfo.paidUntil} />
                {accountInfo.sealDate && <InfoRow label="封存日期" value={accountInfo.sealDate} />}
                {accountInfo.totalInterest !== undefined && accountInfo.totalInterest > 0 && (
                  <InfoRow label="累计利息" value={`¥ ${formatAmount(accountInfo.totalInterest)}`} />
                )}
              </Section>

              {/* 个人信息 */}
              <Section title="个人信息" icon={<User className="h-4 w-4" />}>
                {accountInfo.name && <InfoRow label="姓名" value={accountInfo.name} />}
                <InfoRow label="证件类型" value={accountInfo.idType} />
                <InfoRow label="证件号码" value={accountInfo.idNumber} />
                <InfoRow label="婚姻状况" value={accountInfo.maritalStatus} />
                {accountInfo.spouseName && <InfoRow label="配偶姓名" value={accountInfo.spouseName} />}
                {accountInfo.spouseIdNumber && <InfoRow label="配偶证件号" value={accountInfo.spouseIdNumber} />}
                <InfoRow label="手机号码" value={accountInfo.phone} action={onChangePhone} />
                {accountInfo.address && <InfoRow label="家庭住址" value={accountInfo.address} />}
                <InfoRow label="现户籍" value={accountInfo.residence} />
              </Section>

              {/* 缴存信息 */}
              <Section title="缴存信息" icon={<Wallet className="h-4 w-4" />}>
                <InfoRow label="缴存基数" value={`¥ ${formatAmount(accountInfo.depositBase)}`} />
                <InfoRow label="个人比例" value={accountInfo.personalRate} />
                <InfoRow label="个人月缴" value={`¥ ${formatAmount(accountInfo.personalAmount)}`} />
                <InfoRow label="单位比例" value={accountInfo.companyRate} />
                <InfoRow label="单位月缴" value={`¥ ${formatAmount(accountInfo.companyAmount)}`} />
              </Section>

              {/* 单位信息 */}
              <Section title="单位信息" icon={<Building2 className="h-4 w-4" />}>
                <InfoRow label="单位名称" value={accountInfo.companyName} />
                <InfoRow label="单位账号" value={accountInfo.companyAccount} />
              </Section>

              {/* 银行信息 */}
              {(accountInfo.bankName || accountInfo.bankAccount) && (
                <Section title="银行信息" icon={<CreditCard className="h-4 w-4" />}>
                  <InfoRow label="签约银行" value={accountInfo.bankName} />
                  <InfoRow label="银行卡号" value={accountInfo.bankAccount} action={onChangeBankAccount} />
                </Section>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

