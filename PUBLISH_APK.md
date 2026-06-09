# 📱 发布 APK 安装包指南

运营简历精修工坊是一个 Next.js Web 应用，要打包为 Android APK 安装包，需要以下步骤。

---

## 方案对比

| 方案 | 难度 | 推荐场景 |
|---|---|---|
| **方案 A：PWA + TWA（推荐）** | ⭐⭐ | 快速出包，Google Play 上架 |
| **方案 B：Capacitor 打包** | ⭐⭐⭐ | 需要调用原生功能（推送/相机等） |
| **方案 C：直接部署 Web + 快捷方式** | ⭐ | 最简单，不需要 APK |

---

## 方案 A：PWA + Trusted Web Activity（推荐）

TWA 让你的 PWA 在 Android 上以全屏原生 App 的形式运行，并可上架 Google Play。

### 步骤 1：添加 PWA 支持

在 `resume-polisher` 项目根目录创建以下文件：

#### 1.1 创建 `public/manifest.json`

```json
{
  "name": "运营简历精修工坊",
  "short_name": "简历精修",
  "description": "AI 驱动的运营岗位简历优化工具",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#2563eb",
  "orientation": "any",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    },
    {
      "src": "/icon-512-maskable.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
```

#### 1.2 在 `src/app/layout.tsx` 中添加 manifest 引用

```tsx
// 在 metadata 中添加
export const metadata: Metadata = {
  title: "运营简历精修工坊",
  description: "AI-powered operation resume polishing tool",
  manifest: "/manifest.json",
  // ... 其他
};
```

#### 1.3 生成 PWA 图标

```bash
# 准备一张 512x512 的 PNG 图标（可以用 Figma/Canva 设计）
# 放到 public/ 目录下
# icon-192.png （192x192）
# icon-512.png （512x512）
# icon-512-maskable.png （512x512，带安全边距）
```

### 步骤 2：部署到公网

```bash
# 方式 1：部署到 Vercel（最简单，免费）
cd resume-polisher
npx vercel --prod

# 方式 2：部署到 Netlify
# 将项目 push 到 GitHub，在 Netlify 中连接仓库自动部署

# 方式 3：自己的服务器
npm run build
# 将 .next 文件夹部署到服务器，使用 pm2 运行
```

### 步骤 3：使用 PWABuilder 生成 APK

1. 打开 https://pwabuilder.com
2. 输入你的部署 URL（如 `https://resume-polisher.vercel.app`）
3. 点击 "Start" 进行 PWA 检测
4. 在 "Android" 卡片中点击 "Package"
5. 填写：
   - **App Name**: 运营简历精修工坊
   - **Package Name**: `com.yourname.respolisher`
   - **App Version**: `1.0.0`
   - **Signing Key**: 选择 "New"（自动生成签名密钥）
6. 下载生成的 `.aab`（Google Play）或 `.apk`（直接安装）

### 步骤 4（可选）：上架 Google Play

1. 注册 Google Play 开发者账号（$25 一次性费用）
2. 创建应用 → 上传 `.aab` 文件
3. 填写应用描述、截图、分类
4. 提交审核（通常 1-3 天）

---

## 方案 B：Capacitor 打包（更灵活）

适合需要调用系统功能或深度定制的场景。

### 步骤 1：安装 Capacitor

```bash
cd resume-polisher

# 安装 Capacitor CLI
npm install @capacitor/core @capacitor/cli @capacitor/android

# 初始化 Capacitor
npx cap init "运营简历精修工坊" "com.yourname.respolisher" --web-dir=out

# 添加 Android 平台
npx cap add android
```

### 步骤 2：构建并同步

```bash
# 先构建 Next.js 静态导出
# 在 next.config.ts 中添加: output: 'export'
npm run build

# 同步到 Android 项目
npx cap sync android
```

### 步骤 3：用 Android Studio 生成 APK

1. 打开 Android Studio
2. 选择 `Open Project` → 选择 `android/` 目录
3. 等待 Gradle 同步完成
4. 菜单：`Build` → `Build Bundle(s) / APK(s)` → `Build APK(s)`
5. APK 在 `android/app/build/outputs/apk/debug/` 下

### 步骤 4：签名发布

```bash
# 生成签名密钥
keytool -genkey -v -keystore resume-polisher.keystore \
  -alias resume-polisher -keyalg RSA -keysize 2048 -validity 10000

# 在 Android Studio 中配置签名
# Build → Generate Signed Bundle / APK → 选择 APK → 填写密钥信息
```

---

## 方案 C：简单 Web 快捷方式

如果不需要真正的 APK，可以直接教用户在手机上使用：

### iOS（添加到主屏幕）
1. Safari 打开网址
2. 点击底部分享按钮
3. 选择 "添加到主屏幕"

### Android（添加到主屏幕）
1. Chrome 打开网址
2. 点击菜单 → "添加到主屏幕"

PWA 配置好后，添加到主屏幕的 Web 应用会以全屏模式运行，体验接近原生 App。

---

## 推荐流程（最快速）

```
① 添加 PWA 支持（manifest.json + 图标）
   ↓
② 部署到 Vercel（npx vercel --prod）
   ↓
③ PWABuilder.com → 输入 URL → 下载 APK
   ↓
④ 发给用户安装测试
   ↓  （可选）
⑤ Google Play Console 上架
```

**总耗时：约 30 分钟**（不含 Google Play 审核时间）
