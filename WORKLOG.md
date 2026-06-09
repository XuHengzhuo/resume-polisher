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
- [x] SSH Key 生成并配置到 Gitee
- [x] 推送至 Gitee：`git@gitee.com:xuhzgitee/resume-polisher.git`
  - `master` 分支：完整源码
  - `gh-pages` 分支：静态网站文件（`out/` 目录）

#### 9. Capacitor Android 项目
- [x] `@capacitor/core`, `@capacitor/cli`, `@capacitor/android` 已安装
- [x] `capacitor.config.ts` — 包名 `com.resume.polisher`
- [x] `android/` 项目已生成
- [x] GitHub Actions 工作流：`.github/workflows/build-apk.yml`（自动构建 APK）

---

### 待完成

#### 阻塞项
- [ ] **Gitee 实名认证审核** — 已提交，等待系统审核通过
- [ ] **启用 Gitee Pages** — 审核通过后，在 `https://gitee.com/xuhzgitee/resume-polisher/pages` 选择 `gh-pages` 分支启动
- [ ] **生成 APK** — Pages 部署完成后，用 PWABuilder（`https://www.pwabuilder.com`）输入 Gitee Pages URL 生成 APK

#### 后续优化（非阻塞）
- [ ] 接入真实 LLM API（替换 mock-ai.ts 中的 mock 函数）
- [ ] 用户可自行配置 API Key
- [ ] 更多简历模板风格
- [ ] 历史记录云端同步

---

### 关键技术决策

| 决策 | 原因 |
|---|---|
| 静态导出（`output: "export"`） | APK 需要离线运行，不能依赖服务端 API |
| 离线 API 客户端（`api-client.ts`） | 所有 AI 逻辑在前端直接执行，无需网络 |
| 防重复替换引擎（`dedup.ts`） | 解决多次点击"一键润色"导致的递归嵌套 |
| Gitee 替代 GitHub | GitHub 在国内访问不稳定，Gitee 是国产替代 |
| Gitee Pages（国内服务器） | Vercel/Netlify 在国内被墙或速度慢 |
| Capacitor 打包 | 比 PWABuilder 的 TWA 更可靠，真正离线运行 |

---

### 文件清单

```
resume-polisher/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # PWA meta + SW 注册
│   │   ├── page.tsx            # 主页面（左右分屏 + 5 个标签页）
│   │   ├── globals.css
│   │   └── api/                # 8 个 API 路由（静态模式下不使用）
│   ├── components/
│   │   ├── ResumeEditor.tsx    # 左侧编辑器
│   │   ├── Toolbar.tsx         # 工具栏（12 个功能按钮）
│   │   ├── SuggestionPanel.tsx # 润色建议
│   │   ├── DiffViewer.tsx      # 前后对比
│   │   ├── KeywordExtractor.tsx# ATS 匹配
│   │   ├── InterviewPanel.tsx  # 面试模拟
│   │   ├── QuantifyModal.tsx   # 量化魔法棒弹窗
│   │   ├── StarExpander.tsx    # STAR 扩展器弹窗
│   │   ├── ExportModal.tsx     # 导出弹窗（左右分屏+预览+PDF模板）
│   │   └── DensityDashboard.tsx# 数据密度仪表盘
│   ├── lib/
│   │   ├── api-client.ts       # 离线 API 客户端 ⭐
│   │   ├── mock-ai.ts          # Mock AI 响应
│   │   ├── dedup.ts            # 防重复替换引擎
│   │   ├── density.ts          # 数据密度计算
│   │   └── defaults.ts         # 默认测试文本
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
├── PUBLISH_APK.md              # APK 发布指南
└── WORKLOG.md                  # 本文件
```

---

### 明天继续

1. 检查 Gitee 实名认证是否通过
2. 通过后在 Gitee 仓库启用 Pages（选择 `gh-pages` 分支）
3. 验证 `https://xuhzgitee.gitee.io/resume-polisher` 可访问
4. 用 PWABuilder 生成 APK
5. 安装测试

---

*日志生成时间：2026-06-09 | 项目：运营简历精修工坊*
