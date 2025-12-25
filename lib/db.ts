import {
  mockAuthenticateUser,
  mockGetUserById,
} from "./mock-db"

// 使用模拟数据库（生产版本）
console.log("🎭 Using mock database")

// 通过手机号+密码登录
export async function authenticateUser(phone: string, password: string) {
  return mockAuthenticateUser(phone, password)
}

export async function getUserById(userId: string) {
  return mockGetUserById(userId)
}
