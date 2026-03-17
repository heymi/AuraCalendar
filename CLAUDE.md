# AuraCalendar — Claude Guidelines

## Project
极简任务日历 Web App。用户通过自然语言输入创建任务，AI（DeepSeek Chat）解析标题、日期和图标。Next.js 15 App Router + Tailwind CSS v4 + Framer Motion + SQLite。

## Design Context

### Brand Personality
**三个词：克制、呼吸、可信**

界面让人平静专注，而不是兴奋或焦虑。每个元素都有存在的理由，留白是设计的一部分。

### Aesthetic Direction
- 参考：iOS 原生日历、Apple Reminders、Fantastical
- 反参考：避免过艳渐变、避免信息密度过高（Jira 感）、避免游戏化视觉奖励
- 主题：浅色 + 深色双模式，跟随系统自动切换

### Design Principles

1. **空气感优先** — 宁可多留白，不堆砌信息。Day Block 要有呼吸空间。
2. **iOS 系统级质感** — 毛玻璃弹窗（backdrop-blur + 半透明）、语义化 Apple 配色、细描边而非重阴影。
3. **中性色主导，强调色点缀** — 背景/卡片保持中性，只在关键交互用强调色（今日、FAB、状态）。深色模式用 Apple 深灰系（#1c1c1e / #2c2c2e），非纯黑。
4. **有感情的微动效** — 每次交互都有响应但不打断思路。Spring 物理，150–300ms，弹而不夸张。
5. **细节即诚意** — 圆角一致（按钮 xl，卡片 2xl，弹窗 3xl），阴影只用于层次，不滥用。

### Color Tokens

**浅色模式**
- Background: `#f5f5f7` | Surface: `#ffffff` | Elevated: `rgba(255,255,255,0.85)`
- Border: `#e5e5ea` | Border-subtle: `rgba(0,0,0,0.06)`
- Text primary: `#1d1d1f` | Secondary: `#8e8e93` | Tertiary: `#c7c7cc`
- Accent: `#007aff` | Success: `#34c759` | Warning: `#ff9f0a` | Danger: `#ff3b30`

**深色模式**
- Background: `#000000` | Surface: `#1c1c1e` | Elevated: `rgba(44,44,46,0.92)`
- Border: `rgba(255,255,255,0.10)` | Border-subtle: `rgba(255,255,255,0.05)`
- Text primary: `#f5f5f7` | Secondary: `#8e8e93` | Tertiary: `#48484a`
- Accent: `#0a84ff` | Success: `#30d158` | Warning: `#ffd60a` | Danger: `#ff453a`

### Typography
- 字体：Geist + `-apple-system, "SF Pro Display"`
- 标题：`font-semibold tracking-tight`
- 正文：`font-medium`（任务标题）/ `font-normal`（描述）
- 次级：`text-muted`，绝不用纯灰

### Animation
- Spring 物理：`type: "spring", stiffness: 300–400, damping: 25–30`
- 交互微动：hover `scale(1.03)`，tap `scale(0.96)`
- 弹窗入场：`opacity + scale(0.95→1) + y(16→0)`
- 列表 stagger：`delay: i * 0.04`
- 状态过渡：只用颜色，不用位移

## Tech Notes
- DB 文件在 `/data/aura.db`（已 gitignore）
- API Key 在 `.env.local`（已 gitignore）
- `useTasks` 用乐观更新，不在 background fetch 时显示 loading spinner
- DeepSeek 返回任务数组，支持一次输入拆分多条
