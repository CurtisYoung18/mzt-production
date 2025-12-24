import { NextResponse } from "next/server"
import { authenticateUser } from "@/lib/db"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  try {
    const { account, password } = await request.json()

    if (!account || !password) {
      return NextResponse.json({ error: "请输入账号和密码" }, { status: 400 })
    }

    const user = await authenticateUser(account, password)

    if (!user) {
      return NextResponse.json({ error: "账号或密码错误" }, { status: 401 })
    }

    // Set user session cookie
    const cookieStore = await cookies()
    cookieStore.set(
      "user_session",
      JSON.stringify({
        userId: user.user_id,
        name: user.name,
        phone: user.phone,
        idCard: user.id_card,
      }),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      },
    )

    return NextResponse.json({
      success: true,
      user: {
        userId: user.user_id,
        name: user.name,
        phone: user.phone.slice(0, 3) + "****" + user.phone.slice(7),
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    
    return NextResponse.json(
      { error: "登录失败，请稍后重试", details: process.env.NODE_ENV === "development" ? errorMessage : undefined },
      { status: 500 }
    )
  }
}
