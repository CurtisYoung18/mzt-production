/**
 * 本地模拟数据库 - 生产版本
 * 仅保留用户登录相关数据
 * 业务流程数据由 Agent 和 Workflow API 管理
 */

// 用户数据 - 通过序号登录
export const mockUsers = [
  {
    id: 1,
    user_id: "szsfpt020251223173845080a5245392",
    name: "测试用户1",
    id_card: "350102199001011234",
    phone: "13800138001",
    login_code: "1",
  },
  {
    id: 2,
    user_id: "szsfpt020251201144124394a0790181",
    name: "测试用户2",
    id_card: "350102199202022345",
    phone: "13800138002",
    login_code: "2",
  },
  {
    id: 3,
    user_id: "szsfpt020251223172644365a9395630",
    name: "测试用户3",
    id_card: "350102199303033456",
    phone: "13800138003",
    login_code: "3",
  },
  {
    id: 4,
    user_id: "szsfpt020251223154606140a5064417",
    name: "测试用户4",
    id_card: "350102199404044567",
    phone: "13800138004",
    login_code: "4",
  },
  {
    id: 5,
    user_id: "szsfpt020251215101659991a9205534",
    name: "测试用户5",
    id_card: "350102199505055678",
    phone: "13800138005",
    login_code: "5",
  },
]

// =====================================================
// 模拟数据库查询函数
// =====================================================

// 通过序号登录（不需要密码）
export function mockAuthenticateUser(loginCode: string, _password?: string) {
  const user = mockUsers.find((u) => u.login_code === loginCode)
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
