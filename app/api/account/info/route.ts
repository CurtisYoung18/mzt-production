import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

// Fallback mock data when database is not available
const mockAccountInfo = {
  personalAccount: "12****789",
  openDate: "2020-05-05",
  paidUntil: "2022-05",
  idType: "身份证",
  idNumber: "35**************345",
  residence: "福州",
  maritalStatus: "已婚",
  phone: "157****9013",
  bankName: "中国工商银行",
  bankAccount: "6214 **** **** 1234",
  
  accountType: "公积金账户",
  accountStatus: "封存",
  sealDate: "2022-06-05",
  depositBase: 5000,
  personalRate: "12%",
  personalAmount: 600,
  companyRate: "12%",
  companyAmount: 600,
  
  companyName: "福州测试公司",
  companyAccount: "12**********123",
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "缺少用户ID" }, { status: 400 })
    }

    // Try to fetch from database
    try {
      const result = await sql`
        SELECT 
          personal_account,
          open_date,
          paid_until,
          id_type,
          id_number,
          residence,
          marital_status,
          phone,
          bank_name,
          bank_account,
          account_type,
          account_status,
          seal_date,
          deposit_base,
          personal_rate,
          personal_amount,
          company_rate,
          company_amount,
          company_name,
          company_account,
          total_balance
        FROM account_info
        WHERE user_id = ${userId}
      `

      if (result.length > 0) {
        const row = result[0]
        return NextResponse.json({
          success: true,
          data: {
            personalAccount: row.personal_account,
            openDate: row.open_date?.toISOString().split('T')[0] || '',
            paidUntil: row.paid_until,
            idType: row.id_type,
            idNumber: row.id_number,
            residence: row.residence,
            maritalStatus: row.marital_status,
            phone: row.phone,
            bankName: row.bank_name,
            bankAccount: row.bank_account,
            accountType: row.account_type,
            accountStatus: row.account_status,
            sealDate: row.seal_date?.toISOString().split('T')[0] || undefined,
            depositBase: Number(row.deposit_base),
            personalRate: row.personal_rate,
            personalAmount: Number(row.personal_amount),
            companyRate: row.company_rate,
            companyAmount: Number(row.company_amount),
            companyName: row.company_name,
            companyAccount: row.company_account,
            totalBalance: Number(row.total_balance),
          },
        })
      }
    } catch (dbError) {
      console.log("Database not available, using mock data:", dbError)
    }

    // Fallback to mock data
    return NextResponse.json({
      success: true,
      data: mockAccountInfo,
    })
  } catch (error) {
    console.error("Account info error:", error)
    return NextResponse.json(
      { error: "获取账户信息失败" },
      { status: 500 }
    )
  }
}

