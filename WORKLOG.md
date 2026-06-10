# 运营简历精修工坊 — 工作日志

## 2026-06-09 工作记录

### 项目概述
构建"运营简历精修工坊"（Operation Resume Polisher），一个 AI 驱动的运营岗位简历优化 SPA 应用，并打包为 Android APK。

---

### 今日完成

#### 1. 项目初始化
- [x] Next.js 16 + TypeScript + TailwindCSS 项目搭建
- [x] 项目位置：`C:\mine\work-vault\resume-polisher`
- [x] 依赖安装：zustand、lucide-react、react-markdown、mammoth、diff、sharp

#### 2. 核心功能开发（左右分屏布局）

| 模块 | 文件 | 功能 |
|---|---|---|
| 左侧编辑器 | `ResumeEditor.tsx` | 文本编辑、粘贴、上传 .txt/.docx、localStorage 自动保存 |
| 数据仪表盘 | `DensityDashboard.tsx` | 实时统计字符/行数/数字密度，颜色警告 |
| 工具栏 | `Toolbar.tsx` | 运营方向选择、一键润色、语法纠错、动词强化、量化魔法棒、STAR扩展、残缺检测、面试模拟、导出、历史、撤销 |
| 润色建议 | `SuggestionPanel.tsx` | 可折叠卡片、逐条应用、全部应用 |
| 前后对比 | `DiffViewer.tsx` | 行级 diff 高亮、历史快照对比 |
| ATS 匹配 | `KeywordExtractor.tsx` | JD 关键词提取、匹配度评分、缺失关键词一键插入 |
| 深度检测 | `DetectPanel` | 链路过短检测、同质化评分 |
| 量化弹窗 | `QuantifyModal.tsx` | 5 字段填空 → 生成量化句子 → 应用到简历 |
| STAR 扩展 | `StarExpander.tsx` | 4 种运营情境 → S-T-A-R 四段式输出 |
| 面试模拟 | `InterviewPanel.tsx` | 9 道 AI 生成面试题，分类：数据追问/方法论/情境/细节 |

#### 3. 后端 API（后续改为离线模式）
- [x] 8 个 API 端点：`/api/polish/grammar`, `/api/polish/verbs`, `/api/polish/quantify`, `/api/polish/star`, `/api/ats/keywords`, `/api/ats/match`, `/api/detect/chain`, `/api/interview/questions`
- [x] Mock 数据完整覆盖所有功能

#### 4. Bug 修复
- [x] **重复润色词问题**：新增 `src/lib/dedup.ts` 防重复替换引擎
  - 替换前检查原文是否已不存在
  - 替换前检查替换结果是否已存在
  - 自引用词只替换第一次出现
  - 递归嵌套清理（`推动…实现显著推动…` → `推动…`）
  - 验证：第 2 次点击与第 1 次结果完全相同 ✅

#### 5. 导出功能
- [x] 导出弹窗左右分屏：格式选择 + 实时预览
- [x] PDF 简历模板：深蓝渐变横幅 + 卡片式布局 + 彩色技能标签 + 数字高亮
- [x] 重新润色按钮（导出前可再次润色）
- [x] 支持格式：PDF / Markdown / TXT / HTML

#### 6. PWA 配置
- [x] `public/manifest.json` — 应用名称、图标、全屏模式
- [x] `public/sw.js` — Service Worker 离线缓存
- [x] `public/icon-192.png`, `icon-512.png`, `icon-512-maskable.png` — PWA 图标
- [x] `src/app/layout.tsx` — PWA meta 标签 + SW 注册

#### 7. 离线化改造
- [x] Next.js 静态导出配置（`output: "export"`）
- [x] `src/lib/api-client.ts` — 离线 API 客户端，所有功能直接调用本地 mock，无需服务器
- [x] 所有组件改用 `api-client` 替代 `fetch()`

#### 8. 代码仓库
- [x] Git 初始化 + 提交
- [x] ~~Gitee~~ → **迁移至 GitHub**（Gitee 实名认证卡住，放弃该方案）
- [x] GitHub 仓库：`https://github.com/XuHengzhuo/resume-polisher`
  - `master` 分支：完整源码
  - `gh-pages` 分支：静态网站文件（`out/` 目录）
- [x] GitHub Pages 部署：`https://xuhengzhuo.github.io/resume-polisher/`

#### 9. Capacitor Android 项目 + CI/CD
- [x] `@capacitor/core`, `@capacitor/cli`, `@capacitor/android` 已安装
- [x] `capacitor.config.ts` — 包名 `com.resume.polisher`
- [x] `android/` 项目已生成
- [x] GitHub Actions 工作流：`.github/workflows/build-apk.yml`（自动构建 APK）
- [x] 首版 APK 构建成功（`app-debug.apk`, 4.5MB）

---

### 待完成

- [ ] 接入真实 LLM API（替换 mock-ai.ts 中的 mock 函数）
- [ ] 用户可自行配置 API Key
- [ ] 更多简历模板风格
- [ ] 历史记录云端同步
- [ ] 发布 Release 版 APK（需签名密钥）

---

### 关键技术决策

| 决策 | 原因 |
|---|---|
| 静态导出（`output: "export"`） | APK 需要离线运行，不能依赖服务端 API |
| 离线 API 客户端（`api-client.ts`） | 所有 AI 逻辑在前端直接执行，无需网络 |
| 防重复替换引擎（`dedup.ts`） | 解决多次点击"一键润色"导致的递归嵌套 |
| ~~Gitee~~ → GitHub | Gitee 实名认证卡住；GitHub + SSH 方案可行 |
| GitHub Pages（国际 CDN） | 国内访问可能会有延迟，但可用 |
| Capacitor 打包 | 比 PWABuilder 的 TWA 更可靠，真正离线运行 |
| GitHub Actions CI | 自动构建 APK，无需本地 Android SDK |

---

### 文件清单

```
resume-polisher/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # PWA meta + SW 注册
│   │   ├── page.tsx            # 主页面（响应式：桌面左右分屏 / 移动端全屏+抽屉）
│   │   ├── globals.css
│   │   └── api/                # 8 个 API 路由（静态模式下不使用）
│   ├── components/
│   │   ├── ResumeEditor.tsx    # 左侧编辑器
│   │   ├── Toolbar.tsx         # 工具栏（桌面端：12 个功能按钮）
│   │   ├── MobileDrawer.tsx    # 移动端功能抽屉（汉堡菜单）  🆕
│   │   ├── BottomTabBar.tsx    # 移动端底部导航栏 🆕
│   │   ├── MobileBottomSheet.tsx# 移动端底部弹出面板 🆕
│   │   ├── SuggestionPanel.tsx # 润色建议
│   │   ├── DiffViewer.tsx      # 前后对比
│   │   ├── KeywordExtractor.tsx# ATS 匹配
│   │   ├── InterviewPanel.tsx  # 面试模拟
│   │   ├── QuantifyModal.tsx   # 量化魔法棒弹窗
│   │   ├── StarExpander.tsx    # STAR 扩展器弹窗
│   │   ├── ExportModal.tsx     # 导出弹窗（结构化PDF + 实时预览）
│   │   └── DensityDashboard.tsx# 数据密度仪表盘
│   ├── lib/
│   │   ├── api-client.ts       # 离线 API 客户端 ⭐
│   │   ├── mock-ai.ts          # Mock AI 响应
│   │   ├── dedup.ts            # 防重复替换引擎
│   │   ├── density.ts          # 数据密度计算
│   │   ├── defaults.ts         # 默认测试文本
│   │   └── resume-parser.ts    # 简历结构化解析引擎 🆕
│   ├── store/
│   │   └── useStore.ts         # Zustand 全局状态
│   └── types/
│       └── index.ts            # TypeScript 类型
├── public/
│   ├── manifest.json           # PWA 清单
│   ├── sw.js                   # Service Worker
│   ├── icon-192.png            # PWA 图标
│   ├── icon-512.png
│   └── icon-512-maskable.png
├── android/                    # Capacitor Android 项目
├── out/                        # 静态构建输出
├── .github/workflows/
│   └── build-apk.yml           # GitHub Actions APK 构建
├── capacitor.config.ts
├── next.config.ts              # output: "export"
└── WORKLOG.md                  # 本文件
```

---

*日志生成时间：2026-06-09 | 项目：运营简历精修工坊*

---

## 2026-06-10 工作记录

### 今日完成

#### 1. GitHub 迁移
- [x] Gitee 实名认证卡住 → 放弃 Gitee，全面切回 GitHub
- [x] 仓库：`https://github.com/XuHengzhuo/resume-polisher`
- [x] GitHub Pages：`https://xuhengzhuo.github.io/resume-polisher/` ✅
- [x] SSH Key 配置 + `gh` CLI 认证

#### 2. APK 构建流水线
- [x] 修复 CI 工作流：Node.js 20→22、Java 17→21、Android SDK 配置
- [x] 4 轮调试后构建成功，GitHub Actions 自动出 APK
- [x] 首版 APK `app-debug.apk` (4.5MB) 下载成功

#### 3. 移动端响应式布局

| 组件 | 文件 | 说明 |
|---|---|---|
| 功能抽屉 | `MobileDrawer.tsx` | 左侧滑出，汉堡菜单触发，包含全部 12+ 功能按钮 |
| 底部 Tab | `BottomTabBar.tsx` | 5 个标签：润色/对比/ATS/检测/面试 |
| 弹出面板 | `MobileBottomSheet.tsx` | 85% 高度底部弹出，带拖拽条 |

| 屏幕 | 布局 |
|---|---|
| `< 768px` 手机 | 全屏编辑器 + ☰ 抽屉 + 底部 Tab + 弹出面板 |
| `>= 768px` 桌面 | 左右分屏 (55:45) + 顶部工具栏（保持原有体验） |

#### 4. PDF 导出结构化重构
- [x] 新增 `src/lib/resume-parser.ts` 简历解析引擎：
  - 自动识别姓名、手机号（含带横线格式）、邮箱、城市
  - 智能板块拆分：求职意向 / 教育背景 / 工作经历 / 项目经验 / 核心技能 / 自我评价
  - 条目分类：公司行 → `header`、长句描述 → `bullet`、含 `|` 行 → 结构化 header+subtitle
- [x] `ExportModal.tsx` 重写：
  - PDF 模板按板块分层次渲染（横幅 → 个人信息 → 板块标题 → 公司/角色/时间 → 要点列表）
  - 数字指标蓝色高亮、技能彩色标签
  - 预览即所得（PDF 预览同样使用解析后结构）
- [x] 修复移动端导出按钮无响应问题（ExportModal 改用 Zustand store 控制）

#### 5. 其他修复
- [x] Viewport 放开缩放限制（移除 `maximumScale: 1, userScalable: false`）
- [x] Google Fonts → 系统中文字体栈（避免中国网络构建失败）
- [x] 新增 `ParsedResume` / `ResumeSection` / `SectionItem` 类型定义

---

### 测试记录

**测试样例**：张三 — 运营专员简历（用户提供）

**解析结果**：
```
Header:  张三 | 📱13800001234 | 📧zhangsan@example.com | 📍上海
Section 1: 求职意向 → 运营专员 / 用户运营 / 内容运营
Section 2: 教育背景 → 上海大学 · 市场营销 · 本科 | 2019.09 – 2023.06
Section 3: 工作经历 → 上海云创科技 · 2023.07–至今 (3 bullets)
                   → 北京智行互动 · 2022.07–2022.12 (3 bullets)
Section 4: 项目经验 → 校园KOC孵化计划 | 2022.03–2022.08 (2 bullets)
Section 5: 核心技能 → 3 段技能描述
Section 6: 自我评价 → 3 段评价
```
✅ 全部板块正确识别，公司/角色/时间段正确拆分

---

### 明天继续

1. 真实手机上安装 APK 深度测试
2. 根据测试反馈进一步微调
3. 考虑接入真实 LLM API

---

*日志生成时间：2026-06-10 | 项目：运营简历精修工坊*
