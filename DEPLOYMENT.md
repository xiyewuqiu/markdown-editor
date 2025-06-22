# 🚀 Cloudflare Pages 部署指南

## 📋 部署前准备

### 1. 项目检查
- ✅ 项目为纯静态网站（HTML/CSS/JS）
- ✅ 无需构建工具
- ✅ 所有依赖通过CDN加载
- ✅ 已添加必要的配置文件

### 2. 文件结构确认
```
markdown-editor/
├── index.html          # 主页面
├── css/
│   └── style.css       # 样式文件
├── js/
│   ├── app.js          # 主应用逻辑
│   └── markdown-parser.js # Markdown解析器
├── manifest.json       # PWA配置
├── _headers           # Cloudflare头部配置
├── _redirects         # 重定向配置
├── README.md          # 项目说明
└── .gitignore         # Git忽略文件
```

## 🌐 方法一：GitHub 连接部署（推荐）

### 步骤 1: 推送到 GitHub

1. **初始化 Git 仓库**（如果还没有）：
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Modern Markdown Editor"
   ```

2. **创建 GitHub 仓库**：
   - 访问 [GitHub](https://github.com)
   - 点击 "New repository"
   - 仓库名建议：`markdown-editor`
   - 设为 Public（免费用户）
   - 不要初始化 README（我们已经有了）

3. **推送代码**：
   ```bash
   git remote add origin https://github.com/你的用户名/markdown-editor.git
   git branch -M main
   git push -u origin main
   ```

### 步骤 2: 连接 Cloudflare Pages

1. **登录 Cloudflare**：
   - 访问 [Cloudflare Dashboard](https://dash.cloudflare.com/)
   - 如果没有账号，免费注册一个

2. **创建 Pages 项目**：
   - 在左侧菜单选择 "Pages"
   - 点击 "Create a project"
   - 选择 "Connect to Git"

3. **授权 GitHub**：
   - 点击 "Connect GitHub"
   - 授权 Cloudflare 访问你的 GitHub
   - 选择 "All repositories" 或指定仓库

4. **选择仓库**：
   - 在列表中找到你的 `markdown-editor` 仓库
   - 点击 "Begin setup"

### 步骤 3: 配置构建设置

**重要配置**：
- **Project name**: `markdown-editor`（或你喜欢的名字）
- **Production branch**: `main`
- **Build command**: **留空**（无需构建）
- **Build output directory**: `/`（根目录）

### 步骤 4: 部署

1. 点击 "Save and Deploy"
2. 等待部署完成（通常1-2分钟）
3. 获得你的网站地址：`https://markdown-editor-xxx.pages.dev`

## 📤 方法二：直接上传部署

### 适用场景
- 不想使用 Git
- 快速测试部署
- 一次性部署

### 步骤

1. **准备文件**：
   - 将所有项目文件选中
   - 压缩为 ZIP 文件

2. **上传部署**：
   - 在 Cloudflare Pages 中点击 "Create a project"
   - 选择 "Upload assets"
   - 拖拽或选择你的 ZIP 文件
   - 设置项目名称
   - 点击 "Deploy site"

## ⚙️ 高级配置

### 自定义域名

1. 在 Pages 项目中点击 "Custom domains"
2. 点击 "Set up a custom domain"
3. 输入你的域名（如：`editor.yourdomain.com`）
4. 按照提示配置 DNS 记录

### 环境变量

由于是纯前端项目，通常不需要环境变量。如果需要：

1. 在项目设置中找到 "Environment variables"
2. 添加变量（格式：`KEY=VALUE`）

### 构建钩子

可以设置 Webhook 来触发自动部署：

1. 在项目设置中找到 "Build hooks"
2. 创建新的 hook
3. 复制 URL 用于外部触发

## 🔧 部署后验证

### 功能检查清单

- [ ] 页面正常加载
- [ ] 编辑器可以输入文本
- [ ] 实时预览正常工作
- [ ] 代码高亮显示正确
- [ ] 数学公式渲染正常
- [ ] 主题切换功能正常
- [ ] 文件导入/导出功能正常
- [ ] 响应式布局在移动端正常
- [ ] PWA 功能正常（可安装）

### 性能检查

使用以下工具检查网站性能：
- [PageSpeed Insights](https://pagespeed.web.dev/)
- [GTmetrix](https://gtmetrix.com/)
- [WebPageTest](https://www.webpagetest.org/)

## 🚨 常见问题

### Q: 部署后页面空白
**A**: 检查浏览器控制台是否有 JavaScript 错误，通常是 CDN 资源加载问题。

### Q: 数学公式不显示
**A**: 确保 KaTeX CDN 正常加载，检查网络连接。

### Q: 移动端显示异常
**A**: 检查 CSS 媒体查询和响应式设计。

### Q: 自定义域名不生效
**A**: 确保 DNS 记录正确配置，等待 DNS 传播（最多24小时）。

## 📞 获取帮助

- [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)
- [Cloudflare 社区](https://community.cloudflare.com/)
- [GitHub Issues](https://github.com/你的用户名/markdown-editor/issues)

---

🎉 **恭喜！你的 Markdown 编辑器现在已经成功部署到 Cloudflare Pages！**
