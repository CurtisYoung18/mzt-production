export interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  cardData?: CardData
  thinking?: string // AI thinking process (from <think> tags)
  thinkingComplete?: boolean // Whether thinking process is complete
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
