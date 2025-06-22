# ✨ 现代化 Markdown 编辑器

一个功能强大、界面精美的现代化 Markdown 编辑器，支持实时预览、代码高亮、数学公式等功能。

## 🚀 在线体验

访问：[https://your-site.pages.dev](https://your-site.pages.dev)

## ✨ 主要功能

- 📝 **实时预览** - 左右分栏，实时渲染 Markdown
- 🎨 **代码高亮** - 支持多种编程语言语法高亮
- 🧮 **数学公式** - 支持 LaTeX 数学公式渲染
- 📋 **任务列表** - 支持可交互的任务清单
- 🌙 **主题切换** - 浅色/深色主题自由切换
- 📱 **响应式设计** - 完美适配桌面和移动设备
- ⌨️ **快捷键支持** - 提高编辑效率
- 💾 **自动保存** - 本地存储，防止数据丢失
- 📤 **导出功能** - 支持导出 Markdown 和 HTML

## 🛠️ 技术栈

- **前端框架**: 原生 JavaScript (ES6+)
- **Markdown 解析**: Marked.js
- **代码高亮**: Highlight.js
- **数学公式**: KaTeX
- **图标库**: Font Awesome
- **部署平台**: Cloudflare Pages

## 📦 部署到 Cloudflare Pages

### 方法一：GitHub 连接（推荐）

1. 将代码推送到 GitHub 仓库
2. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
3. 进入 Pages 页面，点击 "Create a project"
4. 选择 "Connect to Git"，授权 GitHub
5. 选择你的仓库
6. 配置构建设置：
   - **构建命令**: 留空（无需构建）
   - **构建输出目录**: `/`（根目录）
7. 点击 "Save and Deploy"

### 方法二：直接上传

1. 将项目文件打包为 ZIP
2. 在 Cloudflare Pages 中选择 "Upload assets"
3. 上传 ZIP 文件并部署

## 🔧 本地开发

由于是纯静态项目，可以直接用浏览器打开 `index.html`，或使用简单的 HTTP 服务器：

```bash
# 使用 Python
python -m http.server 8000

# 使用 Node.js
npx serve .

# 使用 PHP
php -S localhost:8000
```

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！
