/**
 * 本地模拟数据库 - 生产版本
 * 仅保留用户登录相关数据
 * 业务流程数据由 Agent 和 Workflow API 管理
 */

// 用户数据 - 通过手机号+密码登录
export const mockUsers = [
  {
    id: 1,
    user_id: "szsfpt020251223173845080a5245392",
    name: "林零零",
    id_card: "350182198711181546",
    phone: "18371722591",
    password: "Abc@1288688",
  },
  {
    id: 2,
    user_id: "szsfpt020251215101659991a9205535",
    name: "賀零零",
    id_card: "35010219810929241X",
    phone: "15659996511",
    password: "Abc@1288688",
  },
  {
    id: 3,
    user_id: "szsfpt020251215101659991a9205536",
    name: "李五三",
    id_card: "350102198410172839",
    phone: "17859296215",
    password: "Abc@1288688",
  },
  {
    id: 4,
    user_id: "szsfpt020251215101659991a9205537",
    name: "叶九零",
    id_card: "350103198208113516",
    phone: "18650768288",
    password: "Abc@1288688",
  },
  {
    id: 5,
    user_id: "szsfpt020251215101659991a9205531",
    name: "叶六八",
    id_card: "352229198910290046",
    phone: "17724314617",
    password: "Abc@1288688",
  },
  {
    id: 6,
    user_id: "szsfpt020251201144124394a0790181",
    name: "林七零",
    id_card: "350128198710255816",
    phone: "15880113832",
    password: "Abc@1288688",
  },
  {
    id: 7,
    user_id: "szsfpt020251215101659991a9205538",
    name: "金六八",
    id_card: "370902197201280924",
    phone: "18259026925",
    password: "Abc@1288688",
  },
  {
    id: 8,
    user_id: "szsfpt020251215101659991a9205539",
    name: "金五三",
    id_card: "35010219850915194X",
    phone: "18649789698",
    password: "Abc@1288688",
  },
  {
    id: 9,
    user_id: "szsfpt020251215101659991a9205534",
    name: "林零零",
    id_card: "350102197710130855",
    phone: "17850807901",
    password: "Abc@1288688",
  },
]

// =====================================================
// 模拟数据库查询函数
// =====================================================

// 通过手机号+密码登录
export function mockAuthenticateUser(phone: string, password: string) {
  const user = mockUsers.find((u) => u.phone === phone && u.password === password)
  if (user) {
    return {
      id: user.id,
      user_id: user.user_id,
      name: user.name,
      id_card: user.id_card,
      phone: user.phone,
    }
  }
  return null
}

export function mockGetUserById(userId: string) {
  const user = mockUsers.find((u) => u.user_id === userId)
  if (user) {
    return {
      id: user.id,
      user_id: user.user_id,
      name: user.name,
      id_card: user.id_card,
      phone: user.phone,
    }
  }
  return null
}

// 以下接口保留但返回 null，实际数据由 Workflow API 提供
export function mockGetAccountInfo(_userId: string) {
  // 账户信息由 Workflow API (type: 100) 返回
  return null
}

export interface MockUserAttributes {
  user_id: string
  is_auth: boolean
}

export function mockGetUserAttributes(_userId: string): MockUserAttributes | null {
  // 用户属性由 Agent 管理
  return null
}

// 重置用户属性（生产版本不需要，保留空实现以兼容）
export function resetMockUserAttributes(_userId: string): boolean {
  // 生产版本不需要重置，属性由 Agent 管理
  return true
}
