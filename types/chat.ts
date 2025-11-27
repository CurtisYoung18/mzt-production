export interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  cardData?: CardData
  thinking?: string // AI thinking process (from <think> tags)
  thinkingComplete?: boolean // Whether thinking process is complete
  accountInfo?: AccountInfo // Account details for account query
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
