/**
 * 本地模拟数据库 - 用于本地演示部署
 * 无需连接真实数据库
 */

// 用户数据
export const mockUsers = [
  {
    id: 1,
    user_id: "U001",
    name: "张三",
    id_card: "350102199001011234",
    phone: "13800138001",
    password: "admin123",
  },
  {
    id: 2,
    user_id: "U002",
    name: "李四",
    id_card: "350102199202022345",
    phone: "13800138002",
    password: "admin123",
  },
  {
    id: 3,
    user_id: "U003",
    name: "王五",
    id_card: "350102199303033456",
    phone: "13800138003",
    password: "admin123",
  },
  {
    id: 4,
    user_id: "U004",
    name: "赵六",
    id_card: "350102199404044567",
    phone: "13800138004",
    password: "admin123",
  },
]

// 公积金账户信息
export const mockAccountInfo = [
  {
    user_id: "U001",
    personal_account: "12****789",
    open_date: "2020-05-05",
    paid_until: "2022-05",
    id_type: "身份证",
    id_number: "35**************345",
    residence: "福州",
    marital_status: "已婚",
    phone: "157****9013",
    bank_name: "中国工商银行",
    bank_account: "6214 **** **** 1234",
    account_type: "公积金账户",
    account_status: "封存",
    seal_date: "2022-06-05",
    deposit_base: 5000.0,
    personal_rate: "12%",
    personal_amount: 600.0,
    company_rate: "12%",
    company_amount: 600.0,
    company_name: "福州测试公司",
    company_account: "12**********123",
    total_balance: 72000.0,
  },
  {
    user_id: "U002",
    personal_account: "12****456",
    open_date: "2019-03-15",
    paid_until: "2024-11",
    id_type: "身份证",
    id_number: "35**************678",
    residence: "厦门",
    marital_status: "未婚",
    phone: "138****2002",
    bank_name: "中国建设银行",
    bank_account: "6227 **** **** 5678",
    account_type: "公积金账户",
    account_status: "正常",
    seal_date: null,
    deposit_base: 8000.0,
    personal_rate: "12%",
    personal_amount: 960.0,
    company_rate: "12%",
    company_amount: 960.0,
    company_name: "厦门科技有限公司",
    company_account: "35**********456",
    total_balance: 138240.0,
  },
  {
    user_id: "U003",
    personal_account: "12****321",
    open_date: "2021-08-20",
    paid_until: "2024-11",
    id_type: "身份证",
    id_number: "35**************901",
    residence: "泉州",
    marital_status: "已婚",
    phone: "159****3003",
    bank_name: "中国农业银行",
    bank_account: "6228 **** **** 9012",
    account_type: "公积金账户",
    account_status: "正常",
    seal_date: null,
    deposit_base: 6500.0,
    personal_rate: "10%",
    personal_amount: 650.0,
    company_rate: "10%",
    company_amount: 650.0,
    company_name: "泉州贸易有限公司",
    company_account: "35**********789",
    total_balance: 50700.0,
  },
  {
    user_id: "U004",
    personal_account: "12****654",
    open_date: "2018-01-10",
    paid_until: "2023-08",
    id_type: "身份证",
    id_number: "35**************234",
    residence: "漳州",
    marital_status: "离异",
    phone: "186****4004",
    bank_name: "招商银行",
    bank_account: "6225 **** **** 3456",
    account_type: "公积金账户",
    account_status: "封存",
    seal_date: "2023-09-01",
    deposit_base: 4500.0,
    personal_rate: "8%",
    personal_amount: 360.0,
    company_rate: "8%",
    company_amount: 360.0,
    company_name: "漳州物流有限公司",
    company_account: "35**********012",
    total_balance: 48960.0,
  },
]

// 用户属性数据
// Phase 字典（新版 1000-1031 线性递增）：
// 1000: 未开始 | 1001: 开始办理
// 1005: 未检验婚姻 | 1006: 未婚 | 1007: 已婚
// 1015: 本人未手机签约 | 1016: 完成手机签约 | 1017: 已手机签约
// 1018: 本人未银行卡签约 | 1019: 完成银行卡签约 | 1020: 已银行卡签约
// 1021-1028: 后续校验（多孩、缴存、房产、贷款）
// 1029: 满足租房提取条件 | 1030: 人脸识别 | 1031: 提交成功

// 初始用户属性配置（用于重置）
const INITIAL_USER_ATTRIBUTES: Record<string, {
  city: string
  phase: string
  is_auth: boolean
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
}> = {
  "U001": {
    city: "福州",
    phase: "1000", // 未开始 - 演示完整流程
    is_auth: false,
    is_authenticated: true,
    is_married: true,
    spouse_authorized: true,
    history_extract_types: ["租房"],
    permit_extract_types: ["租房", "购房", "公积金贷款", "组合贷款"],
    can_extract: true,
    cannot_extract_reason: null,
    sms_signed: false,
    bank_card_signed: true,
    current_extract_type: null,
    current_type_needs_auth: false,
    current_type_authorized: false,
    extract_verified: false,
    extract_code_verified: false,
  },
  "U002": {
    city: "泉州",
    phase: "1015", // 本人未手机签约 - 演示手机签约流程
    is_auth: true,
    is_authenticated: false,
    is_married: false,
    spouse_authorized: false,
    history_extract_types: [],
    permit_extract_types: ["租房", "购房", "公积金贷款", "组合贷款", "离职", "退休"],
    can_extract: true,
    cannot_extract_reason: null,
    sms_signed: false,
    bank_card_signed: false,
    current_extract_type: null,
    current_type_needs_auth: false,
    current_type_authorized: false,
    extract_verified: false,
    extract_code_verified: false,
  },
  "U003": {
    city: "厦门",
    phase: "1018", // 本人未银行卡签约 - 演示银行卡签约流程
    is_auth: true,
    is_authenticated: true,
    is_married: false,
    spouse_authorized: false,
    history_extract_types: ["购房"],
    permit_extract_types: ["购房", "公积金贷款", "组合贷款"],
    can_extract: true,
    cannot_extract_reason: null,
    sms_signed: true,
    bank_card_signed: false,
    current_extract_type: null,
    current_type_needs_auth: false,
    current_type_authorized: false,
    extract_verified: false,
    extract_code_verified: false,
  },
  "U004": {
    city: "漳州",
    phase: "1029", // 满足租房提取条件 - 演示提取流程
    is_auth: true,
    is_authenticated: true,
    is_married: true,
    spouse_authorized: true,
    history_extract_types: ["租房", "购房"],
    permit_extract_types: ["租房", "购房", "公积金贷款", "组合贷款"],
    can_extract: true,
    cannot_extract_reason: null,
    sms_signed: true,
    bank_card_signed: true,
    current_extract_type: null,
    current_type_needs_auth: false,
    current_type_authorized: false,
    extract_verified: false,
    extract_code_verified: false,
  }
}

// Phase 字典（新版 1000-1031 线性递增）：
// 1000: 未开始
// 1001: 开始办理
// 1005: 未检验婚姻 -> 1006: 未婚, 1007: 已婚
// 1015: 本人未手机签约 -> 1016: 完成手机签约, 1017: 已手机签约
// 1018: 本人未银行卡签约 -> 1019: 完成银行卡签约, 1020: 已银行卡签约
// 1021-1028: 后续校验
// 1029: 满足租房提取条件
// 1030: 人脸识别
// 1031: 提交成功

export const mockUserAttributes = [
  {
    user_id: "U001",
    city: "福州",
    phase: "1000", // 未开始 - 演示完整流程
    is_auth: false, // GPTBots 用户属性：是否已授权（用于触发授权卡片）
    is_authenticated: true,
    is_married: true,
    spouse_authorized: true,
    history_extract_types: ["租房"],
    permit_extract_types: ["租房", "购房", "公积金贷款", "组合贷款"],
    can_extract: true,
    cannot_extract_reason: null,
    sms_signed: false,
    bank_card_signed: false,
    current_extract_type: null,
    current_type_needs_auth: false,
    current_type_authorized: false,
    extract_verified: false,
    extract_code_verified: false,
  },
  {
    user_id: "U002",
    city: "泉州",
    phase: "1015", // 本人未手机签约 - 演示手机签约流程
    is_auth: true, // 已授权
    is_authenticated: false,
    is_married: false,
    spouse_authorized: false,
    history_extract_types: [],
    permit_extract_types: ["租房", "购房", "公积金贷款", "组合贷款", "离职", "退休"],
    can_extract: true,
    cannot_extract_reason: null,
    sms_signed: false,
    bank_card_signed: false,
    current_extract_type: null,
    current_type_needs_auth: false,
    current_type_authorized: false,
    extract_verified: false,
    extract_code_verified: false,
  },
  {
    user_id: "U003",
    city: "厦门",
    phase: "1018", // 本人未银行卡签约 - 演示银行卡签约流程
    is_auth: true, // 已授权
    is_authenticated: true,
    is_married: false,
    spouse_authorized: false,
    history_extract_types: ["购房"],
    permit_extract_types: ["购房", "公积金贷款", "组合贷款"],
    can_extract: true,
    cannot_extract_reason: null,
    sms_signed: true,
    bank_card_signed: false,
    current_extract_type: null,
    current_type_needs_auth: false,
    current_type_authorized: false,
    extract_verified: false,
    extract_code_verified: false,
  },
  {
    user_id: "U004",
    city: "莆田",
    phase: "1029", // 满足租房提取条件 - 演示提取流程
    is_auth: true, // 已授权
    is_authenticated: true,
    is_married: true,
    spouse_authorized: false,
    history_extract_types: [],
    permit_extract_types: ["租房", "购房"],
    can_extract: true,
    cannot_extract_reason: null,
    sms_signed: true,
    bank_card_signed: true,
    current_extract_type: null,
    current_type_needs_auth: false,
    current_type_authorized: false,
    extract_verified: false,
    extract_code_verified: false,
  },
]

// =====================================================
// 模拟数据库查询函数
// =====================================================

export function mockAuthenticateUser(account: string, password: string) {
  const user = mockUsers.find(
    (u) => (u.id_card === account || u.phone === account) && u.password === password
  )
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

export function mockGetAccountInfo(userId: string) {
  return mockAccountInfo.find((a) => a.user_id === userId) || null
}

export interface MockUserAttributes {
  user_id: string
  city: string
  phase: string
  is_auth: boolean // GPTBots 用户属性
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

export function mockGetUserAttributes(userId: string): MockUserAttributes | null {
  return mockUserAttributes.find((a) => a.user_id === userId) || null
}

// 重置用户属性到初始状态（用于新会话开始时）
export function resetMockUserAttributes(userId: string): boolean {
  const userAttr = mockUserAttributes.find((a) => a.user_id === userId)
  const initialAttr = INITIAL_USER_ATTRIBUTES[userId]
  
  if (userAttr && initialAttr) {
    console.log(`[Mock DB] ========== RESET START ==========`)
    console.log(`[Mock DB] User: ${userId}`)
    console.log(`[Mock DB] BEFORE reset:`)
    console.log(`[Mock DB]   - phase: ${userAttr.phase}`)
    console.log(`[Mock DB]   - is_auth: ${userAttr.is_auth}`)
    console.log(`[Mock DB]   - sms_signed: ${userAttr.sms_signed}`)
    console.log(`[Mock DB]   - bank_card_signed: ${userAttr.bank_card_signed}`)
    
    Object.assign(userAttr, { ...initialAttr, user_id: userId })
    
    console.log(`[Mock DB] AFTER reset:`)
    console.log(`[Mock DB]   - phase: ${userAttr.phase}`)
    console.log(`[Mock DB]   - is_auth: ${userAttr.is_auth}`)
    console.log(`[Mock DB]   - sms_signed: ${userAttr.sms_signed}`)
    console.log(`[Mock DB]   - bank_card_signed: ${userAttr.bank_card_signed}`)
    console.log(`[Mock DB] ========== RESET COMPLETE ==========`)
    return true
  }
  console.log(`[Mock DB] ❌ Reset failed - user ${userId} not found or no initial config`)
  return false
}

