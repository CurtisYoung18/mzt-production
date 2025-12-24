"use client"

import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeRaw from "rehype-raw"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Download, ChevronDown, ChevronUp, Sparkles, Search } from "lucide-react"
import type { Message, LLMCardType, LLMResponse, UserBasicInfo, AccountInfo } from "@/types/chat"
import ThinkingProcess from "./thinking-process"
import AccountDetailsCard from "./account-details-card"
import LLMCard from "./llm-card"
import AuthCard from "./auth-card"
import SignCard from "./sign-card"
import FinishCard from "./finish-card"

// 业务卡片类型（根据 doc/提取流程 - 阶段字典.md）
const BUSINESS_CARD_TYPES = [
  "user_unauth",      // 用户未授权
  "account_info",     // 公积金账户信息
  "pf_list",          // 公积金类型选择
  "mate_sms",         // 配偶手机签约
  "mate_sign",        // 配偶授权
  "children_select",  // 多孩家庭选择
  "sms_sign",         // 本人手机签约
  "bank_sign",        // 本人银行卡签约
  "finish",           // 完成
  "history_list",     // 提取记录
  // 兼容旧类型
  "auth",
  "processing_auth",
  "gjj_details",
]

interface MessageCardProps {
  message: Message
  userId: string
  userInfo?: UserBasicInfo
  onBusinessCardAction?: (cardType: string, action: string, extraData?: { message?: string }) => void
  onViewRecords?: () => void
  onContinueChat?: () => void
  onEndChat?: (rating: number) => void
  onSendMessage?: (content: string) => void
}

// 从字符串中提取 JSON 对象
function extractJsonFromString(content: string): { json: Record<string, unknown>; startIndex: number; endIndex: number } | null {
  if (!content) return null
  
  // 查找所有可能的 JSON 起始位置
  let braceCount = 0
  let jsonStart = -1
  
  for (let i = 0; i < content.length; i++) {
    const char = content[i]
    
    if (char === '{') {
      if (braceCount === 0) {
        jsonStart = i
      }
      braceCount++
    } else if (char === '}') {
      braceCount--
      if (braceCount === 0 && jsonStart !== -1) {
        // 尝试解析从 jsonStart 到当前位置的字符串
        const potentialJson = content.substring(jsonStart, i + 1)
        try {
          const parsed = JSON.parse(potentialJson)
          if (typeof parsed === 'object' && parsed !== null) {
            return {
              json: parsed,
              startIndex: jsonStart,
              endIndex: i + 1
            }
          }
        } catch {
          // 继续查找下一个可能的 JSON
          jsonStart = -1
        }
      }
    }
  }
  
  return null
}

// 解析 LLM 返回的 JSON 格式内容（支持从混合文本中提取 JSON）
function parseLLMResponse(content: string): LLMResponse | null {
  if (!content) return null
  
  // 首先尝试整体解析（如果整个内容就是 JSON）
  const trimmed = content.trim()
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed)
      if ('content' in parsed) {
        return {
          card_type: parsed.card_type || null,
          card_message: parsed.card_message || '',
          content: parsed.content || ''
        }
      }
    } catch {
      // 继续尝试提取
    }
  }
  
  // 尝试从混合文本中提取 JSON
  const extracted = extractJsonFromString(content)
  if (extracted && 'content' in extracted.json) {
    return {
      card_type: (extracted.json.card_type as LLMCardType) || null,
      card_message: (extracted.json.card_message as string) || '',
      content: (extracted.json.content as string) || ''
    }
  }
  
  return null
}

// 中文字段名到英文字段名的映射
const ACCOUNT_FIELD_MAP: Record<string, string> = {
  // 个人基础信息
  "个人账号": "personalAccount",
  "grzh": "personalAccount",
  "开户日期": "openDate",
  "khrq": "openDate",
  "缴至年月": "paidUntil",
  "JZNY": "paidUntil",
  "证件类型": "idType",
  "zjlx": "idType",
  "证件号码": "idNumber",
  "zjhm": "idNumber",
  "现户籍": "residence",
  "xhj": "residence",
  "婚姻状况": "maritalStatus",
  "hyzk": "maritalStatus",
  "手机号码": "phone",
  "sjhm": "phone",
  "受托银行名称": "bankName",
  "styhmc": "bankName",
  "银行卡号": "bankAccount",
  "yhzh": "bankAccount",
  // 公积金缴存信息
  "账户类型": "accountType",
  "zhlx": "accountType",
  "个人账户状态": "accountStatus",
  "grzhzt": "accountStatus",
  "封存日期": "sealDate",
  "fcrq": "sealDate",
  "个人缴存基数": "depositBase",
  "grjcjs": "depositBase",
  "个人缴存比例": "personalRate",
  "grjcbl": "personalRate",
  "个人月缴存额": "personalAmount",
  "gryjce": "personalAmount",
  "单位缴存比例": "companyRate",
  "dwjcbl": "companyRate",
  "单位月缴存额": "companyAmount",
  "dwyjce": "companyAmount",
  // 单位信息
  "单位名称": "companyName",
  "dwmc": "companyName",
  "单位账号": "companyAccount",
  "dwzh": "companyAccount",
  // 其他信息（用于显示）
  "姓名": "name",
  "xingming": "name",
  "账户余额": "totalBalance",
  "zhye": "totalBalance",
  "配偶姓名": "spouseName",
  "poxm": "spouseName",
  "配偶证件号码": "spouseIdNumber",
  "pozjhm": "spouseIdNumber",
  "家庭住址": "address",
  "jtzz": "address",
  "累计利息金额": "totalInterest",
  "ljlxje": "totalInterest",
  "封存状态": "sealStatus",
  "fczt": "sealStatus",
  "冻结状态": "freezeStatus",
  "djzt": "freezeStatus",
}

// 证件类型代码映射
const ID_TYPE_MAP: Record<string, string> = {
  "01": "居民身份证",
  "02": "军官证",
  "03": "护照",
  "04": "港澳居民来往内地通行证",
  "05": "台湾居民来往大陆通行证",
  "06": "外国人永久居留证",
}

// 账户状态代码映射
const ACCOUNT_STATUS_MAP: Record<string, string> = {
  "01": "正常",
  "02": "封存",
  "03": "冻结",
  "04": "销户",
}

// 婚姻状况代码映射
const MARITAL_STATUS_MAP: Record<string, string> = {
  "10": "未婚",
  "20": "已婚",
  "21": "初婚",
  "22": "再婚",
  "30": "丧偶",
  "40": "离婚",
  "90": "其他",
}

// 格式化日期：20020404000000 -> 2002-04-04
function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  // 处理格式: 20020404000000 或 20020404
  const cleaned = dateStr.replace(/\D/g, '')
  if (cleaned.length >= 8) {
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 6)}-${cleaned.slice(6, 8)}`
  }
  return dateStr
}

// 格式化缴至年月：200405 -> 2004-05
function formatYearMonth(ymStr: string): string {
  if (!ymStr) return ''
  const cleaned = ymStr.replace(/\D/g, '')
  if (cleaned.length >= 6) {
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 6)}`
  }
  return ymStr
}

// 从 card_message 中解析账户信息（account_info / gjj_details 场景）
function parseAccountInfoFromCardMessage(cardMessage: string): AccountInfo | null {
  if (!cardMessage) return null
  
  // 先尝试 JSON 格式（旧格式兼容）
  const extracted = extractJsonFromString(cardMessage)
  if (extracted && extracted.json) {
    const info = extracted.json
    if ('personalAccount' in info) {
      return {
        personalAccount: String(info.personalAccount || ''),
        openDate: String(info.openDate || ''),
        paidUntil: String(info.paidUntil || ''),
        idType: String(info.idType || ''),
        idNumber: String(info.idNumber || ''),
        residence: String(info.residence || ''),
        maritalStatus: String(info.maritalStatus || ''),
        phone: String(info.phone || ''),
        bankName: String(info.bankName || ''),
        bankAccount: String(info.bankAccount || ''),
        accountType: String(info.accountType || ''),
        accountStatus: String(info.accountStatus || ''),
        sealDate: info.sealDate ? String(info.sealDate) : undefined,
        depositBase: Number(info.depositBase) || 0,
        personalRate: String(info.personalRate || ''),
        personalAmount: Number(info.personalAmount) || 0,
        companyRate: String(info.companyRate || ''),
        companyAmount: Number(info.companyAmount) || 0,
        companyName: String(info.companyName || ''),
        companyAccount: String(info.companyAccount || ''),
      } as AccountInfo
    }
  }
  
  // 解析中文字段格式：字段名：值\n字段名：值\n...
  const fields: Record<string, string> = {}
  const lines = cardMessage.split('\n')
  
  for (const line of lines) {
    const colonIndex = line.indexOf('：')
    if (colonIndex > 0) {
      const key = line.substring(0, colonIndex).trim()
      const value = line.substring(colonIndex + 1).trim()
      
      // 查找映射的英文字段名
      const englishKey = ACCOUNT_FIELD_MAP[key]
      if (englishKey) {
        fields[englishKey] = value
      }
    }
  }
  
  // 如果解析到了足够的字段，构建 AccountInfo
  if (Object.keys(fields).length > 0) {
    // 转换代码为可读文本
    const idType = fields.idType ? (ID_TYPE_MAP[fields.idType] || fields.idType) : '身份证'
    const accountStatus = fields.accountStatus ? (ACCOUNT_STATUS_MAP[fields.accountStatus] || fields.accountStatus) : ''
    const maritalStatus = fields.maritalStatus ? (MARITAL_STATUS_MAP[fields.maritalStatus] || fields.maritalStatus) : ''
    
    // 解析账户余额
    const totalBalance = parseFloat(fields.totalBalance || '0') || 0
    const totalInterest = parseFloat(fields.totalInterest || '0') || 0
    const personalAmount = parseFloat(fields.personalAmount || '0') || 0
    const companyAmount = parseFloat(fields.companyAmount || '0') || 0
    
    return {
      personalAccount: fields.personalAccount || '',
      openDate: formatDate(fields.openDate || ''),
      paidUntil: formatYearMonth(fields.paidUntil || ''),
      idType: idType,
      idNumber: fields.idNumber || '',
      residence: fields.residence === '1' ? '本地' : (fields.residence || ''),
      maritalStatus: maritalStatus,
      phone: fields.phone || '',
      bankName: fields.bankName || '',
      bankAccount: fields.bankAccount || '',
      accountType: fields.accountType === '01' ? '公积金账户' : (fields.accountType || '公积金账户'),
      accountStatus: accountStatus,
      sealDate: formatDate(fields.sealDate || ''),
      depositBase: parseFloat(fields.depositBase || '0') || 0,
      personalRate: fields.personalRate ? `${fields.personalRate}%` : '',
      personalAmount: personalAmount,
      companyRate: fields.companyRate ? `${fields.companyRate}%` : '',
      companyAmount: companyAmount,
      companyName: fields.companyName || '',
      companyAccount: fields.companyAccount || '',
      // 扩展字段
      name: fields.name || '',
      totalBalance: totalBalance,
      spouseName: fields.spouseName || '',
      spouseIdNumber: fields.spouseIdNumber || '',
      address: fields.address || '',
      totalInterest: totalInterest,
      monthlyDeposit: personalAmount + companyAmount,
    } as AccountInfo
  }
  
  return null
}

export default function MessageCard({ 
  message, 
  userId, 
  userInfo, 
  onBusinessCardAction,
  onViewRecords,
  onContinueChat,
  onEndChat,
  onSendMessage
}: MessageCardProps) {
  const [expanded, setExpanded] = useState(true)

  // 解析消息内容，检查是否为 LLM 结构化响应
  const parsedResponse = useMemo(() => {
    // 优先使用消息中已解析的字段
    if (message.llmCardType !== undefined) {
      return {
        card_type: message.llmCardType,
        card_message: message.llmCardMessage || '',
        content: message.content
      } as LLMResponse
    }
    // 尝试从 content 中解析 JSON
    return parseLLMResponse(message.content)
  }, [message.content, message.llmCardType, message.llmCardMessage])
  
  // 检查是否为业务卡片类型
  const isBusinessCard = parsedResponse?.card_type && BUSINESS_CARD_TYPES.includes(parsedResponse.card_type)
  
  // 从 card_message 解析账户信息（用于 gjj_details / account_info 卡片）
  const parsedAccountInfo = useMemo(() => {
    if ((parsedResponse?.card_type === 'gjj_details' || parsedResponse?.card_type === 'account_info') && parsedResponse.card_message) {
      return parseAccountInfoFromCardMessage(parsedResponse.card_message)
    }
    return null
  }, [parsedResponse?.card_type, parsedResponse?.card_message])
  
  // 使用 message.accountInfo 或从 card_message 解析的账户信息
  const accountInfoToUse = message.accountInfo || parsedAccountInfo

  // Show querying animation for data queries (e.g., account info)
  if (message.isQuerying && !accountInfoToUse && !message.content) {
    return (
      <div className="bg-gradient-to-r from-blue-50/80 to-cyan-50/80 dark:from-blue-950/30 dark:to-cyan-950/30 border border-blue-200/60 dark:border-blue-800/50 px-4 py-3 rounded-2xl rounded-tl-sm">
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center">
            <Search className="h-4 w-4 text-blue-500 dark:text-blue-400 animate-pulse" />
            <span className="absolute flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            </span>
          </div>
          <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">正在为您查询信息...</span>
          <div className="flex gap-1 ml-1">
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
          </div>
        </div>
      </div>
    )
  }

  // Check if message has account info (from message or parsed from card_message) - render card and content together
  if (accountInfoToUse) {
    const contentToShow = parsedResponse?.content || message.content
    return (
      <div className="space-y-3">
        {/* AI 的 content 在最上面 */}
        {contentToShow && (
          <div className="bg-secondary/80 px-4 py-3 rounded-2xl rounded-tl-sm">
            <div className="prose prose-sm dark:prose-invert max-w-none text-foreground leading-relaxed">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
              >
                {contentToShow}
              </ReactMarkdown>
            </div>
          </div>
        )}
        
        {/* 账户详情卡片在中间 */}
      <AccountDetailsCard
        accountInfo={accountInfoToUse}
          className="w-full max-w-2xl"
        />
        
        {/* 可办理的提取业务气泡在最下面（gjj_details 后显示） */}
        {message.permitExtractTypes && message.permitExtractTypes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 border border-blue-200 dark:border-blue-800 rounded-2xl p-4 max-w-md"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">您可办理以下提取业务：</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {message.permitExtractTypes.map((type, index) => (
                <motion.button
                  key={type}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onSendMessage?.(`我要办理${type}提取`)}
                  className="px-4 py-2 bg-white dark:bg-gray-800 border border-blue-300 dark:border-blue-700 rounded-full text-sm font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 hover:border-blue-400 transition-all shadow-sm"
                >
                  {type}提取
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    )
  }

  // Check if message has structured card data
  if (message.cardData) {
    return (
      <Card className="w-full bg-card border-border shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {/* Card Title */}
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm text-foreground mb-2">{message.content}</p>
            <h3 className="font-semibold text-base">{message.cardData.title}</h3>
          </div>

          {/* Tabs */}
          <Tabs defaultValue={message.cardData.tabs?.[0]?.key || "guide"} className="w-full">
            <TabsList className="w-full justify-start gap-0 bg-secondary/50 p-0 h-auto rounded-none border-b border-border">
              {message.cardData.tabs?.map((tab) => (
                <TabsTrigger
                  key={tab.key}
                  value={tab.key}
                  className="flex-1 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
            {message.cardData.tabs?.map((tab) => (
              <TabsContent key={tab.key} value={tab.key} className="mt-0 p-4">
                {tab.items && (
                  <div className="space-y-0">
                    {/* Table header */}
                    <div className="flex items-center justify-between py-2 text-sm text-muted-foreground border-b border-border">
                      <span className="w-8">序</span>
                      <span className="flex-1">材料清单</span>
                      <span className="w-20 text-right">示例样表</span>
                    </div>
                    {/* Table rows */}
                    {tab.items.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between py-3 border-b border-border last:border-0"
                      >
                        <span className="w-8 text-sm text-muted-foreground">{index + 1}</span>
                        <div className="flex-1 flex items-center gap-2">
                          {item.badge && (
                            <span
                              className={`text-xs px-2 py-0.5 rounded ${
                                item.badge === "自备"
                                  ? "bg-primary/20 text-primary"
                                  : item.badge === "可免交"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-blue-100 text-blue-700"
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                          <span className="text-sm">{item.text}</span>
                        </div>
                        <div className="w-20 text-right">
                          {item.downloadable && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:text-primary/80">
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                    {tab.items.length > 3 && (
                      <button
                        onClick={() => setExpanded(!expanded)}
                        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mx-auto py-2"
                      >
                        {expanded ? (
                          <>
                            收起 <ChevronUp className="h-4 w-4" />
                          </>
                        ) : (
                          <>
                            展开更多 <ChevronDown className="h-4 w-4" />
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
          {message.cardData.action && (
            <div className="p-4 pt-0">
              <Button className="w-full bg-card border border-primary text-primary hover:bg-primary/10 h-11">
                {message.cardData.action}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // Show thinking animation when isThinking is true and no content yet
  if (message.isThinking && !message.content && !message.thinking) {
    return (
      <div className="bg-gradient-to-r from-orange-50/80 to-amber-50/80 dark:from-orange-950/30 dark:to-amber-950/30 border border-orange-200/60 dark:border-orange-800/50 px-4 py-3 rounded-2xl rounded-tl-sm">
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-orange-500 dark:text-orange-400" />
            <span className="absolute flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
            </span>
          </div>
          <span className="text-sm text-orange-700 dark:text-orange-300 font-medium">正在思考...</span>
          <div className="flex gap-1 ml-1">
            <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
            <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
            <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
          </div>
        </div>
      </div>
    )
  }

  // 获取要显示的内容（如果是 LLM 结构化响应，使用解析后的 content）
  const displayContent = parsedResponse ? parsedResponse.content : message.content
  const llmCardType = parsedResponse?.card_type
  const llmCardMessage = parsedResponse?.card_message

  // 检查是否为 JSON 格式响应（有 parsedResponse 但可能没有 card_type）
  const isJsonResponse = parsedResponse !== null
  const hasCardType = !!llmCardType

  // Regular text message with thinking process and LLM card
  return (
    <div className="max-w-full space-y-3">
      {/* Thinking Process Component */}
      {message.thinking && (
        <ThinkingProcess
          thinking={message.thinking}
          isComplete={message.thinkingComplete}
          className="mb-2"
        />
      )}
      
      {/* Place Holder - 当是 JSON 响应但没有 card_type 时显示 */}
      {isJsonResponse && !hasCardType && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-muted/50 border border-border rounded-2xl p-4 max-w-sm"
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-muted-foreground/40"></div>
            <span className="text-sm text-muted-foreground">Place Holder</span>
          </div>
        </motion.div>
      )}
      
      {/* Business Card - 授权卡片 (card_type: "auth") - 提取流程授权 */}
      {llmCardType === "auth" && userInfo && onBusinessCardAction && !message.authCompleted && (
        <AuthCard
          userInfo={userInfo}
          onConfirm={() => onBusinessCardAction("auth", "confirm")}
          isProcessingAuth={false}
          permitExtractTypes={message.permitExtractTypes}
          onSelectExtractType={onSendMessage}
        />
      )}
      
      {/* Business Card - 查询授权卡片 (card_type: "processing_auth") - 授权后只显示授权成功 */}
      {llmCardType === "processing_auth" && userInfo && onBusinessCardAction && (
        <AuthCard
          userInfo={userInfo}
          onConfirm={() => onBusinessCardAction("processing_auth", "confirm")}
          isProcessingAuth={true}
          authCompleted={message.authCompleted}
        />
      )}
      
      {/* 授权完成后显示可用的提取类型 (仅 auth 类型) */}
      {message.authCompleted && llmCardType === "auth" && message.permitExtractTypes && message.permitExtractTypes.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-200 dark:border-green-800 rounded-2xl p-4 max-w-md"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-sm font-medium text-green-700 dark:text-green-300">授权成功！您可办理以下提取业务：</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {message.permitExtractTypes.map((type, index) => (
              <motion.button
                key={type}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onSendMessage?.(`我要办理${type}提取`)}
                className="px-4 py-2 bg-white dark:bg-gray-800 border border-green-300 dark:border-green-700 rounded-full text-sm font-medium text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/50 hover:border-green-400 transition-all shadow-sm"
              >
                {type}提取
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}
      
      {/* Business Card - 手机签约卡片 (card_type: "sms_sign") */}
      {llmCardType === "sms_sign" && llmCardMessage && userInfo && onBusinessCardAction && (
        <SignCard
          message={llmCardMessage}
          userInfo={userInfo}
          signType="phone"
          onConfirm={() => onBusinessCardAction("sms_sign", "confirm")}
        />
      )}
      
      {/* Business Card - 银行卡签约卡片 (card_type: "bank_sign") */}
      {llmCardType === "bank_sign" && llmCardMessage && userInfo && onBusinessCardAction && (
        <SignCard
          message={llmCardMessage}
          userInfo={userInfo}
          signType="bank"
          onConfirm={() => onBusinessCardAction("bank_sign", "confirm")}
        />
      )}
      
      {/* Business Card - 完成卡片 (card_type: "finish") */}
      {llmCardType === "finish" && llmCardMessage && (
        <FinishCard
          message={llmCardMessage}
          accountInfo={message.accountInfo}
          onViewRecords={onViewRecords}
          onContinueChat={onContinueChat}
          onEndChat={onEndChat}
        />
      )}
      
      {/* Business Card - 用户未授权卡片 (card_type: "user_unauth") */}
      {llmCardType === "user_unauth" && userInfo && onBusinessCardAction && !message.authCompleted && (
        <AuthCard
          userInfo={userInfo}
          onConfirm={() => onBusinessCardAction("user_unauth", "confirm")}
          isProcessingAuth={false}
          permitExtractTypes={message.permitExtractTypes}
          onSelectExtractType={onSendMessage}
        />
      )}
      
      {/* Business Card - 配偶手机签约卡片 (card_type: "mate_sms") */}
      {llmCardType === "mate_sms" && llmCardMessage && userInfo && onBusinessCardAction && (
        <SignCard
          message={llmCardMessage}
          userInfo={userInfo}
          signType="phone"
          isSpouse={true}
          onConfirm={() => onBusinessCardAction("mate_sms", "confirm")}
        />
      )}
      
      {/* Business Card - 配偶授权卡片 (card_type: "mate_sign") */}
      {llmCardType === "mate_sign" && userInfo && onBusinessCardAction && !message.authCompleted && (
        <AuthCard
          userInfo={userInfo}
          onConfirm={() => onBusinessCardAction("mate_sign", "confirm")}
          isProcessingAuth={false}
          isSpouse={true}
        />
      )}
      
      {/* Business Card - 公积金类型选择列表 (card_type: "pf_list") */}
      {llmCardType === "pf_list" && llmCardMessage && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 border border-blue-200 dark:border-blue-800 rounded-2xl p-4 max-w-md"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">{llmCardMessage}</span>
          </div>
          {message.permitExtractTypes && message.permitExtractTypes.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {message.permitExtractTypes.map((type, index) => (
                <motion.button
                  key={type}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onSendMessage?.(`我要办理${type}提取`)}
                  className="px-4 py-2 bg-white dark:bg-gray-800 border border-blue-300 dark:border-blue-700 rounded-full text-sm font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 hover:border-blue-400 transition-all shadow-sm"
                >
                  {type}提取
                </motion.button>
              ))}
            </div>
          )}
        </motion.div>
      )}
      
      {/* Business Card - 多孩家庭选择 (card_type: "children_select") */}
      {llmCardType === "children_select" && llmCardMessage && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border border-purple-200 dark:border-purple-800 rounded-2xl p-4 max-w-md"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-purple-700 dark:text-purple-300">多孩家庭提示</span>
          </div>
          <p className="text-sm text-purple-600 dark:text-purple-400">{llmCardMessage}</p>
        </motion.div>
      )}
      
      {/* Business Card - 提取记录列表 (card_type: "history_list") */}
      {llmCardType === "history_list" && llmCardMessage && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-200 dark:border-green-800 rounded-2xl p-4 max-w-md"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-green-700 dark:text-green-300">提取成功</span>
          </div>
          <p className="text-sm text-green-600 dark:text-green-400 mb-3">{llmCardMessage}</p>
          <button
            onClick={onViewRecords}
            className="w-full px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            查看提取记录
          </button>
        </motion.div>
      )}
      
      {/* Fail Card (card_type: "fail") - 失败/校验不通过 */}
      {llmCardType === "fail" && llmCardMessage && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 border border-red-200 dark:border-red-800 rounded-2xl p-4 max-w-md"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-red-700 dark:text-red-300">无法办理</span>
          </div>
          <p className="text-sm text-red-600 dark:text-red-400">{llmCardMessage}</p>
        </motion.div>
      )}
      
      {/* LLM Alert Card (warning/success/info/error) */}
      {llmCardType && !isBusinessCard && llmCardType !== "fail" && llmCardMessage && (
        <LLMCard
          type={llmCardType}
          message={llmCardMessage}
          className="max-w-sm"
        />
      )}
      
      {/* Main Content with Markdown and HTML rendering */}
      {displayContent && (
        <div className="bg-secondary/80 px-4 py-3 rounded-2xl rounded-tl-sm">
          <div className="prose prose-sm dark:prose-invert max-w-none text-foreground leading-relaxed
            prose-p:my-2 prose-p:leading-relaxed
            prose-headings:text-foreground prose-headings:font-semibold prose-headings:mt-4 prose-headings:mb-2
            prose-h1:text-xl prose-h2:text-lg prose-h3:text-base
            prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5
            prose-code:bg-muted prose-code:text-foreground prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:before:content-none prose-code:after:content-none
            prose-pre:bg-muted prose-pre:text-foreground prose-pre:p-3 prose-pre:rounded-lg prose-pre:overflow-x-auto
            prose-a:text-primary prose-a:no-underline hover:prose-a:underline
            prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground prose-blockquote:italic
            prose-table:text-sm prose-th:bg-muted prose-th:px-3 prose-th:py-2 prose-td:px-3 prose-td:py-2 prose-td:border-border
            prose-strong:text-foreground prose-strong:font-semibold
            prose-hr:border-border
            [&_span]:inline">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]} 
              rehypePlugins={[rehypeRaw]}
            >
              {displayContent}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  )
}
