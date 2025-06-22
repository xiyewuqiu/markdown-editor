/*
 * 主应用控制器
 * 整合所有模块，初始化应用
 */

import { APP_CONFIG, EVENT_TYPES } from './core/config.js';
import { stateManager } from './core/state.js';
import { keyboardManager, mouseManager } from './utils/event-utils.js';
import { $ } from './utils/dom-utils.js';
import { notifications } from './components/ui/notifications.js';

// 导入组件
import Navbar from './components/navigation/navbar.js';
import MenuHandler from './components/navigation/menu-handler.js';
import EditorCore from './components/editor/editor-core.js';
import LineNumbers from './components/editor/line-numbers.js';
import SyntaxHighlight from './components/editor/syntax-highlight.js';
import MarkdownRenderer from './components/preview/markdown-renderer.js';
import MathProcessor from './components/preview/math-processor.js';
import StatusBar from './components/ui/statusbar.js';

class MarkdownEditorApp {
    constructor() {
        this.components = {};
        this.isInitialized = false;
        
        this.init();
    }
    
    // 初始化应用
    async init() {
        try {
            console.log('🚀 初始化 Markdown 编辑器...');
            
            // 等待DOM加载完成
            await this.waitForDOM();
            
            // 初始化核心系统
            this.initializeCore();
            
            // 初始化组件
            await this.initializeComponents();
            
            // 绑定全局事件
            this.bindGlobalEvents();
            
            // 注册快捷键
            this.registerShortcuts();
            
            // 应用初始状态
            this.applyInitialState();
            
            // 标记为已初始化
            this.isInitialized = true;
            
            console.log('✅ Markdown 编辑器初始化完成');
            
            // 显示欢迎通知
            notifications.success('Markdown 编辑器已准备就绪！', '欢迎', {
                duration: 3000
            });
            
        } catch (error) {
            console.error('❌ 应用初始化失败:', error);
            notifications.error('应用初始化失败: ' + error.message, '错误');
        }
    }
    
    // 等待DOM加载完成
    waitForDOM() {
        return new Promise((resolve) => {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', resolve);
            } else {
                resolve();
            }
        });
    }
    
    // 初始化核心系统
    initializeCore() {
        console.log('🔧 初始化核心系统...');
        
        // 状态管理器已在导入时初始化
        
        // 设置全局错误处理
        window.addEventListener('error', this.handleGlobalError.bind(this));
        window.addEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this));
        
        // 设置页面可见性变化处理
        document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
        
        // 设置页面卸载处理
        window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));
    }
    
    // 初始化组件
    async initializeComponents() {
        console.log('🧩 初始化组件...');
        
        try {
            // 初始化导航栏
            const navbarContainer = $('.navbar');
            if (navbarContainer) {
                this.components.navbar = new Navbar(navbarContainer);
                this.components.menuHandler = new MenuHandler();
                console.log('✅ 导航栏组件初始化完成');
            }
            
            // 初始化编辑器
            const editorContainer = $('.editor-panel');
            if (editorContainer) {
                this.components.editor = new EditorCore(editorContainer);
                
                // 初始化行号
                this.components.lineNumbers = new LineNumbers(editorContainer, this.components.editor);
                
                // 初始化语法高亮
                this.components.syntaxHighlight = new SyntaxHighlight(this.components.editor);
                
                console.log('✅ 编辑器组件初始化完成');
            }
            
            // 初始化预览
            const previewContainer = $('.preview-panel');
            if (previewContainer) {
                this.components.renderer = new MarkdownRenderer(previewContainer);
                this.components.mathProcessor = new MathProcessor();
                console.log('✅ 预览组件初始化完成');
            }
            
            // 初始化状态栏
            const statusbarContainer = $('.statusbar');
            if (statusbarContainer) {
                this.components.statusbar = new StatusBar(statusbarContainer);
                console.log('✅ 状态栏组件初始化完成');
            }
            
            // 连接组件
            this.connectComponents();
            
        } catch (error) {
            console.error('❌ 组件初始化失败:', error);
            throw error;
        }
    }
    
    // 连接组件
    connectComponents() {
        console.log('🔗 连接组件...');
        
        // 连接菜单处理器和编辑器
        if (this.components.menuHandler && this.components.editor) {
            // 文件操作
            this.components.menuHandler.on('file:new', () => this.newFile());
            this.components.menuHandler.on('file:open', () => this.openFile());
            this.components.menuHandler.on('file:save', () => this.saveFile());
            this.components.menuHandler.on('file:export', (data) => this.exportFile(data.format));
            
            // 编辑操作
            this.components.menuHandler.on('editor:select-all', () => this.selectAll());
            this.components.menuHandler.on('editor:copy', () => this.copy());
            this.components.menuHandler.on('editor:cut', () => this.cut());
            this.components.menuHandler.on('editor:paste', () => this.paste());
            
            // 格式化操作
            this.components.menuHandler.on('format:bold', () => this.formatBold());
            this.components.menuHandler.on('format:italic', () => this.formatItalic());
            this.components.menuHandler.on('format:code', () => this.formatCode());
            
            // 插入操作
            this.components.menuHandler.on('insert:link', () => this.insertLink());
            this.components.menuHandler.on('insert:image', () => this.insertImage());
            this.components.menuHandler.on('insert:math', () => this.insertMath());
            this.components.menuHandler.on('insert:table', () => this.insertTable());
        }
        
        // 连接状态栏和编辑器
        if (this.components.statusbar && this.components.editor) {
            this.components.statusbar.on('goto-line', (data) => {
                if (this.components.lineNumbers) {
                    this.components.lineNumbers.goToLine(data.line);
                }
            });
        }
        
        // 连接数学处理器和编辑器
        if (this.components.mathProcessor && this.components.editor) {
            this.components.mathProcessor.on('math:insert-type', (data) => {
                this.components.editor.insertText(data.placeholder);
            });
        }
    }
    
    // 绑定全局事件
    bindGlobalEvents() {
        console.log('🌐 绑定全局事件...');
        
        // 监听状态变化
        stateManager.on(EVENT_TYPES.THEME_CHANGE, this.handleThemeChange.bind(this));
        stateManager.on(EVENT_TYPES.VIEW_CHANGE, this.handleViewChange.bind(this));
        stateManager.on(EVENT_TYPES.FULLSCREEN_CHANGE, this.handleFullscreenChange.bind(this));
        
        // 监听文件拖拽
        document.addEventListener('dragover', this.handleDragOver.bind(this));
        document.addEventListener('drop', this.handleFileDrop.bind(this));
    }
    
    // 注册快捷键
    registerShortcuts() {
        console.log('⌨️ 注册快捷键...');
        
        const shortcuts = APP_CONFIG.shortcuts;
        
        Object.entries(shortcuts).forEach(([key, action]) => {
            keyboardManager.register(key, () => {
                if (this.components.menuHandler) {
                    this.components.menuHandler.handleAction(action);
                }
            }, `快捷键: ${action}`);
        });
    }
    
    // 应用初始状态
    applyInitialState() {
        console.log('🎨 应用初始状态...');
        
        // 应用主题
        const theme = stateManager.getState('theme.current');
        this.applyTheme(theme);
        
        // 应用视图模式
        const viewMode = stateManager.getState('view.mode');
        this.applyViewMode(viewMode);
        
        // 应用全屏状态
        const fullscreen = stateManager.getState('view.fullscreen');
        if (fullscreen) {
            this.enterFullscreen();
        }
    }
    
    // ===== 文件操作 =====
    
    newFile() {
        if (!stateManager.getState('file.saved')) {
            const confirmed = confirm('当前文档未保存，确定要新建文档吗？');
            if (!confirmed) return;
        }
        
        stateManager.reset();
        notifications.info('已创建新文档');
    }
    
    openFile() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.md,.markdown,.txt';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                this.loadFile(file);
            }
        };
        
        input.click();
    }
    
    async loadFile(file) {
        try {
            const content = await this.readFileContent(file);
            
            stateManager.setContent(content);
            stateManager.setFile(file.name, null, file.size);
            
            notifications.success(`已打开文件: ${file.name}`);
            
        } catch (error) {
            console.error('文件加载失败:', error);
            notifications.error('文件加载失败: ' + error.message);
        }
    }
    
    readFileContent(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('文件读取失败'));
            reader.readAsText(file);
        });
    }
    
    saveFile() {
        const content = stateManager.getState('editor.content');
        const filename = stateManager.getState('file.name');
        
        this.downloadFile(content, filename, 'text/markdown');
        stateManager.setState('file.saved', true);
        
        notifications.success('文件已保存');
    }
    
    exportFile(format) {
        const content = stateManager.getState('editor.content');
        const filename = stateManager.getState('file.name').replace(/\.[^/.]+$/, '');
        
        switch (format) {
            case 'html':
                this.exportAsHTML(content, filename);
                break;
            case 'pdf':
                this.exportAsPDF(content, filename);
                break;
            default:
                notifications.warning('不支持的导出格式');
        }
    }
    
    exportAsHTML(content, filename) {
        if (this.components.renderer) {
            const html = this.components.renderer.parseMarkdown(content);
            const fullHTML = this.createHTMLDocument(html);
            this.downloadFile(fullHTML, `${filename}.html`, 'text/html');
            notifications.success('已导出为 HTML');
        }
    }
    
    exportAsPDF(content, filename) {
        notifications.info('PDF 导出功能开发中...');
    }
    
    createHTMLDocument(content) {
        return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Markdown Export</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        .markdown-body { max-width: 800px; margin: 0 auto; padding: 2rem; }
    </style>
</head>
<body>
    <div class="markdown-body">
        ${content}
    </div>
</body>
</html>`;
    }
    
    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        
        URL.revokeObjectURL(url);
    }
    
    // ===== 编辑操作 =====
    
    selectAll() {
        if (this.components.editor) {
            const content = this.components.editor.getContent();
            this.components.editor.setSelection(0, content.length);
        }
    }
    
    copy() {
        document.execCommand('copy');
    }
    
    cut() {
        document.execCommand('cut');
    }
    
    paste() {
        document.execCommand('paste');
    }
    
    // ===== 格式化操作 =====
    
    formatBold() {
        this.wrapSelection('**', '**');
    }
    
    formatItalic() {
        this.wrapSelection('*', '*');
    }
    
    formatCode() {
        this.wrapSelection('`', '`');
    }
    
    wrapSelection(before, after) {
        if (this.components.editor) {
            const selection = this.components.editor.getSelection();
            const wrapped = before + selection.text + after;
            this.components.editor.replaceSelection(wrapped);
        }
    }
    
    // ===== 插入操作 =====
    
    insertLink() {
        const url = prompt('请输入链接地址:');
        if (url) {
            const text = prompt('请输入链接文本:', url);
            const link = `[${text || url}](${url})`;
            if (this.components.editor) {
                this.components.editor.insertText(link);
            }
        }
    }
    
    insertImage() {
        const url = prompt('请输入图片地址:');
        if (url) {
            const alt = prompt('请输入图片描述:', '');
            const image = `![${alt}](${url})`;
            if (this.components.editor) {
                this.components.editor.insertText(image);
            }
        }
    }
    
    insertMath() {
        if (this.components.mathProcessor) {
            this.components.mathProcessor.insertMath();
        }
    }
    
    insertTable() {
        const table = `| 列1 | 列2 | 列3 |
|-----|-----|-----|
| 内容 | 内容 | 内容 |
| 内容 | 内容 | 内容 |`;
        
        if (this.components.editor) {
            this.components.editor.insertText(table);
        }
    }
    
    // ===== 事件处理 =====
    
    handleThemeChange(event) {
        this.applyTheme(event.theme);
    }
    
    handleViewChange(event) {
        this.applyViewMode(event.mode);
    }
    
    handleFullscreenChange(event) {
        if (event.fullscreen) {
            this.enterFullscreen();
        } else {
            this.exitFullscreen();
        }
    }
    
    handleDragOver(e) {
        e.preventDefault();
    }
    
    handleFileDrop(e) {
        e.preventDefault();
        
        const files = Array.from(e.dataTransfer.files);
        const markdownFile = files.find(file => 
            file.name.endsWith('.md') || 
            file.name.endsWith('.markdown') || 
            file.name.endsWith('.txt')
        );
        
        if (markdownFile) {
            this.loadFile(markdownFile);
        }
    }
    
    handleGlobalError(event) {
        console.error('全局错误:', event.error);
        notifications.error('发生了一个错误: ' + event.error.message);
    }
    
    handleUnhandledRejection(event) {
        console.error('未处理的Promise拒绝:', event.reason);
        notifications.error('操作失败: ' + event.reason);
    }
    
    handleVisibilityChange() {
        if (document.hidden) {
            // 页面隐藏时自动保存
            stateManager.saveToStorage();
        }
    }
    
    handleBeforeUnload(event) {
        if (!stateManager.getState('file.saved')) {
            event.preventDefault();
            event.returnValue = '您有未保存的更改，确定要离开吗？';
        }
    }
    
    // ===== 主题和视图 =====
    
    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
    }
    
    applyViewMode(mode) {
        const container = $('.app-container');
        if (container) {
            container.className = container.className.replace(/view-\w+/g, '');
            container.classList.add(`view-${mode}`);
        }
    }
    
    enterFullscreen() {
        document.documentElement.requestFullscreen?.();
        document.body.classList.add('fullscreen');
    }
    
    exitFullscreen() {
        document.exitFullscreen?.();
        document.body.classList.remove('fullscreen');
    }
    
    // ===== 销毁 =====
    
    destroy() {
        // 销毁所有组件
        Object.values(this.components).forEach(component => {
            if (component && typeof component.destroy === 'function') {
                component.destroy();
            }
        });
        
        // 清理全局事件
        keyboardManager.removeAllListeners();
        mouseManager.removeAllListeners();
        
        console.log('应用已销毁');
    }
}

// 创建并启动应用
const app = new MarkdownEditorApp();

// 导出应用实例
export default app;
