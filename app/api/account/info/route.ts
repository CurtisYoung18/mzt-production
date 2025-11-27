import { NextResponse } from "next/server"
import { getAccountInfo } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "缺少用户ID" }, { status: 400 })
    }

    const row = await getAccountInfo(userId)

    if (row) {
      // 处理日期字段（可能是字符串或 Date 对象）
      const formatDate = (date: unknown) => {
        if (!date) return undefined
        if (typeof date === 'string') return date
        if (date instanceof Date) return date.toISOString().split('T')[0]
        return String(date)
      }

        return NextResponse.json({
          success: true,
          data: {
            personalAccount: row.personal_account,
          openDate: formatDate(row.open_date),
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
          sealDate: formatDate(row.seal_date),
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

    return NextResponse.json({ error: "未找到账户信息" }, { status: 404 })
  } catch (error) {
    console.error("Account info error:", error)
    return NextResponse.json(
      { error: "获取账户信息失败" },
      { status: 500 }
    )
  }
}
