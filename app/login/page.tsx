"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Loader2 } from "lucide-react"

// 测试用户列表
const TEST_USERS = [
  { code: "1", userId: "szsfpt020251223173845080a5245392" },
  { code: "2", userId: "szsfpt020251201144124394a0790181" },
  { code: "3", userId: "szsfpt020251223172644365a9395630" },
  { code: "4", userId: "szsfpt020251223154606140a5064417" },
  { code: "5", userId: "szsfpt020251215101659991a9205534" },
]

export default function LoginPage() {
  const router = useRouter()
  const [loginCode, setLoginCode] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account: loginCode }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "登录失败")
        return
      }

      window.location.href = "/chat"
    } catch {
      setError("网络错误，请稍后重试")
    } finally {
      setLoading(false)
    }
  }

  // 快速登录按钮
  const handleQuickLogin = async (code: string) => {
    setLoginCode(code)
    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account: code }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "登录失败")
        return
      }

      window.location.href = "/chat"
    } catch {
      setError("网络错误，请稍后重试")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary to-accent/30 p-4">
      <Card className="w-full max-w-md shadow-xl border-primary/20">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Building2 className="w-8 h-8 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-foreground">公积金边聊边办</CardTitle>
            <CardDescription className="text-muted-foreground mt-2">闽政通智能服务平台</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="loginCode">登录序号</Label>
              <Input
                id="loginCode"
                type="text"
                placeholder="请输入序号 (1-5)"
                value={loginCode}
                onChange={(e) => setLoginCode(e.target.value)}
                className="bg-card text-center text-lg"
                required
              />
            </div>
            {error && <p className="text-sm text-destructive text-center">{error}</p>}
            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  登录中...
                </>
              ) : (
                "登录"
              )}
            </Button>
          </form>
          
          {/* 测试账号列表 */}
          <div className="mt-6 p-4 bg-secondary/50 rounded-lg">
            <p className="text-xs text-muted-foreground mb-3">测试账号（点击序号快速登录）：</p>
            <div className="space-y-2">
              {TEST_USERS.map((user) => (
                <div 
                  key={user.code}
                  className="flex items-center gap-2 text-xs"
                >
                  <button
                    type="button"
                    onClick={() => handleQuickLogin(user.code)}
                    disabled={loading}
                    className="w-8 h-8 rounded-full bg-primary/20 hover:bg-primary/30 text-primary font-semibold transition-colors disabled:opacity-50"
                  >
                    {user.code}
                  </button>
                  <span className="text-muted-foreground font-mono text-[10px] truncate">
                    {user.userId}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
