"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Loader2, Eye, EyeOff } from "lucide-react"

// 测试用户列表（手机号）
const TEST_USERS = [
  { phone: "18371722591", name: "林零零" },
  { phone: "15659996511", name: "賀零零" },
  { phone: "17859296215", name: "李五三" },
  { phone: "18650768288", name: "叶九零" },
  { phone: "17724314617", name: "叶六八" },
  { phone: "15880113832", name: "林七零" },
  { phone: "18259026925", name: "金六八" },
  { phone: "18649789698", name: "金五三" },
  { phone: "17850807901", name: "林零零" },
]

const DEFAULT_PASSWORD = "Abc@1288688"

export default function LoginPage() {
  const router = useRouter()
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
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
        body: JSON.stringify({ phone, password }),
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
  const handleQuickLogin = async (userPhone: string) => {
    setPhone(userPhone)
    setPassword(DEFAULT_PASSWORD)
    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: userPhone, password: DEFAULT_PASSWORD }),
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
              <Label htmlFor="phone">手机号</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="请输入手机号"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="bg-card"
                required
                maxLength={11}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="请输入密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-card pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
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
            <p className="text-xs text-muted-foreground mb-3">测试账号（点击快速登录）：</p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {TEST_USERS.map((user, index) => (
                <div 
                  key={user.phone}
                  className="flex items-center gap-2 text-xs"
                >
                  <button
                    type="button"
                    onClick={() => handleQuickLogin(user.phone)}
                    disabled={loading}
                    className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-left transition-colors disabled:opacity-50"
                  >
                    <span className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-[10px]">
                      {index + 1}
                    </span>
                    <span className="text-foreground font-medium">{user.name}</span>
                    <span className="text-muted-foreground font-mono ml-auto">
                      {user.phone}
                    </span>
                  </button>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground mt-3 text-center">
              默认密码：{DEFAULT_PASSWORD}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
