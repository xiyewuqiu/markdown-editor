# Markdown编辑器

一个功能完整、现代简洁的Markdown编辑器Web应用，支持实时预览、主题切换、文件操作、快捷键等，适合学习和日常使用。

## 功能特性
- 实时Markdown预览，支持常用语法和代码高亮
- 左右分栏/单栏/预览视图切换
- 浅色/深色主题一键切换
- 新建、保存、导出HTML、打开本地.md文件
- 自动保存和恢复内容，防止丢失
- 文件拖拽上传、撤销重做、Tab缩进
- 中文界面，支持中文Markdown内容
- 响应式设计，移动端自动上下布局

## 快捷键
- `Ctrl+S`：保存为Markdown文件
- `Ctrl+N`：新建文档
- `Tab`：插入缩进
- `Ctrl+Z`：撤销
- `Ctrl+Y` 或 `Ctrl+Shift+Z`：重做

## 使用方法
1. 直接双击`index.html`，用浏览器打开即可使用，无需安装任何依赖。
2. 编辑区输入Markdown，右侧实时预览。
3. 顶部工具栏可新建、保存、导出、切换主题和视图。
4. 支持拖拽本地`.md`文件到预览区打开。
5. 自动保存内容到浏览器本地存储，刷新页面内容不丢失。

## 依赖说明
- [marked.js](https://github.com/markedjs/marked)（CDN引入）
- [highlight.js](https://highlightjs.org/)（CDN引入）
- [Font Awesome](https://fontawesome.com/)（CDN引入）

## 目录结构
```
markdown-editor/
├── index.html              # 主页面文件
├── css/
│   └── style.css           # 样式文件
├── js/
│   ├── app.js              # 主应用逻辑
│   └── markdown-parser.js  # Markdown解析相关
└── README.md               # 项目说明文档
```

## 示例Markdown
可在编辑器中粘贴如下内容进行测试：

```
# Markdown编辑器示例

## 语法支持
- **粗体**、*斜体*、~~删除线~~
- `行内代码` 和
```
function hello() {
  console.log('代码块');
}
```
- 有序列表
1. 第一项
2. 第二项
- 无序列表
- 列表项A
- 列表项B
- [链接示例](https://www.example.com)
- ![图片示例](https://via.placeholder.com/80)
- 表格：

| 姓名 | 年龄 |
| ---- | ---- |
| 张三 | 18   |
| 李四 | 20   |

> 这是引用文本

---

字数统计、主题切换、视图切换、文件操作等功能请体验顶部工具栏。
```

## 离线使用
- 所有核心功能均可离线使用。
- 若需完全离线（包括依赖库），可将CDN资源下载到本地并修改`index.html`引用路径。

## 许可
MIT License，自由学习和修改。 