# 公积金智能助手演示项目

基于 GPTBots 的公积金业务办理智能助手 Demo。

## 技术栈

- Next.js 16 (Turbopack)
- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui
- Framer Motion

## 功能特性

- 多轮对话，支持流式响应
- 用户属性同步至 GPTBots
- 业务流程卡片交互（授权、签约、提取）
- 侧边栏流程图实时状态展示
- 本地 Mock 数据库，无需外部数据库依赖

## 环境配置

创建 `.env.local` 文件：

```
GPTBOTS_API_KEY=your_api_key
GPTBOTS_BASE_URL=https://your-gptbots-endpoint
USE_MOCK_DB=true
```

## 本地运行

```bash
npm install
npm run dev
```

访问 http://localhost:3000

## 测试账号

| 用户 | 账号 | 密码 | 初始阶段 |
|------|------|------|----------|
| 张三 | 13800138001 | admin123 | 未开始 (1000) |
| 李四 | 13800138002 | admin123 | 手机签约 (1015) |
| 王五 | 13800138003 | admin123 | 银行卡签约 (1018) |
| 赵六 | 13800138004 | admin123 | 满足提取 (1029) |

## 目录结构

```
app/                  # Next.js App Router
  api/                # API 路由
    chat/             # 对话相关 API
    user/             # 用户属性 API
    account/          # 账户信息 API
components/chat/      # 聊天组件
  chat-layout.tsx     # 主布局
  chat-main.tsx       # 聊天主界面
  chat-sidebar.tsx    # 侧边栏
  message-card.tsx    # 消息卡片
  auth-card.tsx       # 授权卡片
  sign-card.tsx       # 签约卡片
  finish-card.tsx     # 完成卡片
lib/
  gptbots.ts          # GPTBots API 客户端
  mock-db.ts          # 本地模拟数据库
doc/                  # 业务文档
```
