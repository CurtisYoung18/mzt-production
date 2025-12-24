// LLM 返回的结构化响应格式
// 通用提示卡片类型
export type LLMAlertCardType = "warning" | "success" | "info" | "error" | "fail"

// 业务流程卡片类型（根据 doc/提取流程 - 阶段字典.md）
// user_unauth: 用户未授权，需要进行授权
// account_info: 公积金账户信息查询结果
// pf_list: 公积金类型列表选择
// mate_sms: 配偶手机签约
// mate_sign: 配偶授权
// children_select: 多孩家庭选择
// sms_sign: 本人手机签约
// bank_sign: 本人银行卡签约
// finish: 满足提取条件，展示可提取信息
// history_list: 提取记录列表
export type LLMBusinessCardType = 
  | "user_unauth"      // 用户未授权
  | "account_info"     // 公积金账户信息
  | "pf_list"          // 公积金类型选择
  | "mate_sms"         // 配偶手机签约
  | "mate_sign"        // 配偶授权
  | "children_select"  // 多孩家庭选择
  | "sms_sign"         // 本人手机签约
  | "bank_sign"        // 本人银行卡签约
  | "finish"           // 完成/满足提取条件
  | "history_list"     // 提取记录
  // 兼容旧类型
  | "auth"             // 授权（兼容）
  | "processing_auth"  // 查询授权（兼容）
  | "gjj_details"      // 公积金详情（兼容）

// 所有卡片类型
export type LLMCardType = LLMAlertCardType | LLMBusinessCardType | null

// 公积金类型选项（用于 pf_list 卡片）
export interface PfListItem {
  pf_id: string
  pf_name: string
}

export interface LLMResponse {
  card_type?: LLMCardType
  card_message?: string
  content: string
  pf_list?: PfListItem[]  // 公积金类型列表（仅 pf_list 卡片使用）
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
  // 扩展字段（从 workflow API 获取的额外信息）
  name?: string              // 姓名
  totalBalance?: number      // 账户余额
  spouseName?: string        // 配偶姓名
  spouseIdNumber?: string    // 配偶证件号码
  address?: string           // 家庭住址
  totalInterest?: number     // 累计利息金额
  monthlyDeposit?: number    // 月缴存额（个人+单位）
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
