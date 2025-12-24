import {
  mockAuthenticateUser,
  mockGetUserById,
} from "./mock-db"

// 使用模拟数据库（生产版本）
console.log("🎭 Using mock database")

// 通过序号登录，不需要密码
export async function authenticateUser(loginCode: string) {
  return mockAuthenticateUser(loginCode)
}

export async function getUserById(userId: string) {
  return mockGetUserById(userId)
}
