// LLM 返回的结构化响应格式
// 通用提示卡片类型
export type LLMAlertCardType = "warning" | "success" | "info" | "error"
// 业务流程卡片类型
// processing_auth: 查询公积金时的授权（授权后只显示"授权成功"，不显示提取业务选项）
// auth: 提取流程中的授权（授权后显示可办理的提取业务）
export type LLMBusinessCardType = "auth" | "processing_auth" | "sms_sign" | "bank_sign" | "finish" | "gjj_details"
// 所有卡片类型
export type LLMCardType = LLMAlertCardType | LLMBusinessCardType | null

export interface LLMResponse {
  card_type?: LLMCardType
  card_message?: string
  content: string
}

// 用户基本信息（用于卡片显示）
export interface UserBasicInfo {
  name: string
  phone: string
  idType: string
  idNumber: string
}

export interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  cardData?: CardData
  thinking?: string // AI thinking process (from <think> tags)
  thinkingComplete?: boolean // Whether thinking process is complete
  accountInfo?: AccountInfo // Account details for account query
  isThinking?: boolean // Show thinking animation before content arrives
  isQuerying?: boolean // Show "正在为您查询信息" animation for data queries
  // LLM 结构化卡片
  llmCardType?: LLMCardType
  llmCardMessage?: string
  // 授权完成后显示可用的提取类型
  authCompleted?: boolean
  permitExtractTypes?: string[]
}

export interface AccountInfo {
  personalAccount: string
  openDate: string
  paidUntil: string
  idType: string
  idNumber: string
  residence: string
  maritalStatus: string
  phone: string
  bankName: string
  bankAccount: string
  accountType: string
  accountStatus: string
  sealDate?: string
  depositBase: number
  personalRate: string
  personalAmount: number
  companyRate: string
  companyAmount: number
  companyName: string
  companyAccount: string
}

export interface CardData {
  title: string
  tabs?: Tab[]
  action?: string
}

export interface Tab {
  key: string
  label: string
  items?: TabItem[]
}

export interface TabItem {
  text: string
  badge?: string
  downloadable?: boolean
}

export interface ChatSession {
  id: string
  title: string
  createdAt: Date
  messages: Message[]
}
