import {
  mockAuthenticateUser,
  mockGetUserById,
  mockGetAccountInfo,
  mockGetUserAttributes,
  type MockUserAttributes,
} from "./mock-db"

// 使用模拟数据库（生产版本使用 mock 数据）
console.log("🎭 Using mock database")

// 通过序号登录，不需要密码
export async function authenticateUser(loginCode: string) {
  return mockAuthenticateUser(loginCode)
}

export async function getUserById(userId: string) {
  return mockGetUserById(userId)
}

export async function getAccountInfo(userId: string) {
  return mockGetAccountInfo(userId)
}

export interface UserAttributes {
  user_id: string
  city: string
  phase: string
  is_auth: boolean // GPTBots 用户属性：是否已授权
  is_authenticated: boolean
  is_married: boolean
  spouse_authorized: boolean
  history_extract_types: string[]
  permit_extract_types: string[]
  can_extract: boolean
  cannot_extract_reason: string | null
  sms_signed: boolean
  bank_card_signed: boolean
  current_extract_type: string | null
  current_type_needs_auth: boolean
  current_type_authorized: boolean
  extract_verified: boolean
  extract_code_verified: boolean
}

export async function getUserAttributes(userId: string): Promise<UserAttributes | null> {
  return mockGetUserAttributes(userId) as UserAttributes | null
}

export async function updateUserAttribute(userId: string, attributeName: string, value: unknown) {
  // Mock 模式下不实际更新，只打印日志
  console.log(`[Mock] Would update ${attributeName} = ${value} for user ${userId}`)
  return
}
