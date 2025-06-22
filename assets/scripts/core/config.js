/*
 * 应用配置模块
 * 定义全局配置、常量、默认设置等
 */

// 应用基础配置
export const APP_CONFIG = {
    name: 'Markdown Editor',
    version: '2.0.0',
    author: 'Your Name',
    description: '现代化的Markdown编辑器',
    
    // 默认设置
    defaults: {
        theme: 'light',
        view: 'split',
        filename: 'untitled.md',
        autoSave: true,
        autoSaveInterval: 30000, // 30秒
        lineNumbers: true,
        wordWrap: true,
        fontSize: 16,
        fontFamily: 'JetBrains Mono',
        tabSize: 4,
        insertSpaces: true
    },
    
    // 编辑器配置
    editor: {
        placeholder: '# 开始编写你的Markdown文档...\n\n在这里输入内容，右侧将实时预览渲染效果。\n\n支持的功能：\n- **粗体** 和 *斜体*\n- [链接](https://example.com)\n- `行内代码` 和代码块\n- 数学公式 $E=mc^2$\n- 表格、列表、引用等\n\n快捷键：\n- Ctrl+B: 粗体\n- Ctrl+I: 斜体\n- Ctrl+K: 插入链接\n- Ctrl+S: 保存文档\n- F11: 全屏模式',
        maxLength: 1000000, // 最大字符数
        historySize: 50, // 撤销历史大小
        autoIndent: true,
        bracketMatching: true,
        highlightActiveLine: true
    },
    
    // 预览配置
    preview: {
        sanitize: true,
        breaks: true,
        linkify: true,
        typographer: true,
        highlight: true,
        mathSupport: true,
        mermaidSupport: false,
        tableSupport: true
    },
    
    // 文件操作配置
    file: {
        supportedFormats: ['.md', '.markdown', '.txt'],
        maxFileSize: 10 * 1024 * 1024, // 10MB
        encoding: 'utf-8',
        autoDetectEncoding: true,
        backupEnabled: true,
        backupInterval: 300000 // 5分钟
    },
    
    // 导出配置
    export: {
        html: {
            includeCSS: true,
            standalone: true,
            template: 'github',
            highlightTheme: 'github'
        },
        pdf: {
            format: 'A4',
            margin: '1in',
            orientation: 'portrait',
            quality: 'high'
        }
    },
    
    // UI配置
    ui: {
        animations: true,
        transitions: true,
        notifications: true,
        contextMenu: true,
        statusBar: true,
        toolbar: true,
        menuDelay: 300, // 菜单延迟关闭时间(ms)
        notificationDuration: 5000, // 通知显示时间(ms)
        tooltipDelay: 500 // 工具提示延迟时间(ms)
    },
    
    // 快捷键配置
    shortcuts: {
        // 文件操作
        'Ctrl+N': 'new',
        'Ctrl+O': 'open',
        'Ctrl+S': 'save',
        'Ctrl+Shift+S': 'saveAs',
        'Ctrl+E': 'export',
        
        // 编辑操作
        'Ctrl+Z': 'undo',
        'Ctrl+Y': 'redo',
        'Ctrl+Shift+Z': 'redo',
        'Ctrl+A': 'selectAll',
        'Ctrl+C': 'copy',
        'Ctrl+X': 'cut',
        'Ctrl+V': 'paste',
        'Ctrl+F': 'find',
        'Ctrl+H': 'replace',
        
        // 格式化
        'Ctrl+B': 'bold',
        'Ctrl+I': 'italic',
        'Ctrl+U': 'underline',
        'Ctrl+Shift+S': 'strikethrough',
        'Ctrl+K': 'link',
        'Ctrl+Shift+I': 'image',
        'Ctrl+Shift+C': 'code',
        'Ctrl+Shift+K': 'codeBlock',
        'Ctrl+Q': 'quote',
        'Ctrl+L': 'list',
        'Ctrl+Shift+L': 'orderedList',
        'Ctrl+H': 'heading',
        'Ctrl+R': 'hr',
        'Ctrl+M': 'math',
        'Ctrl+T': 'table',
        
        // 视图操作
        'F11': 'fullscreen',
        'Ctrl+1': 'viewEditor',
        'Ctrl+2': 'viewSplit',
        'Ctrl+3': 'viewPreview',
        'Ctrl+D': 'toggleTheme',
        'Ctrl+Shift+N': 'toggleLineNumbers',
        
        // 其他
        'Escape': 'escape',
        'Ctrl+/': 'toggleComment'
    },
    
    // 主题配置
    themes: {
        light: {
            name: '浅色主题',
            icon: 'fa-sun',
            primary: '#667eea',
            background: '#f8fafc',
            foreground: '#1e293b'
        },
        dark: {
            name: '深色主题',
            icon: 'fa-moon',
            primary: '#818cf8',
            background: '#0f172a',
            foreground: '#f1f5f9'
        }
    },
    
    // 语言配置
    languages: {
        default: 'zh-CN',
        supported: ['zh-CN', 'en-US'],
        fallback: 'en-US'
    },
    
    // 存储配置
    storage: {
        prefix: 'markdown-editor-',
        version: '2.0',
        keys: {
            settings: 'settings',
            content: 'content',
            history: 'history',
            theme: 'theme',
            view: 'view',
            position: 'position'
        },
        compression: false,
        encryption: false
    },
    
    // 网络配置
    network: {
        timeout: 10000,
        retries: 3,
        retryDelay: 1000
    },
    
    // 调试配置
    debug: {
        enabled: false,
        level: 'info', // error, warn, info, debug
        console: true,
        storage: false,
        performance: false
    }
};

// 视图模式常量
export const VIEW_MODES = {
    EDITOR: 'editor',
    PREVIEW: 'preview',
    SPLIT: 'split'
};

// 主题常量
export const THEMES = {
    LIGHT: 'light',
    DARK: 'dark'
};

// 文件类型常量
export const FILE_TYPES = {
    MARKDOWN: 'markdown',
    TEXT: 'text',
    HTML: 'html',
    PDF: 'pdf'
};

// 事件类型常量
export const EVENT_TYPES = {
    // 文件事件
    FILE_NEW: 'file:new',
    FILE_OPEN: 'file:open',
    FILE_SAVE: 'file:save',
    FILE_EXPORT: 'file:export',
    
    // 编辑事件
    CONTENT_CHANGE: 'content:change',
    SELECTION_CHANGE: 'selection:change',
    CURSOR_CHANGE: 'cursor:change',
    
    // 视图事件
    VIEW_CHANGE: 'view:change',
    THEME_CHANGE: 'theme:change',
    FULLSCREEN_CHANGE: 'fullscreen:change',
    
    // UI事件
    MENU_OPEN: 'menu:open',
    MENU_CLOSE: 'menu:close',
    NOTIFICATION_SHOW: 'notification:show',
    NOTIFICATION_HIDE: 'notification:hide',
    
    // 系统事件
    APP_READY: 'app:ready',
    APP_ERROR: 'app:error',
    SETTINGS_CHANGE: 'settings:change'
};

// 错误代码常量
export const ERROR_CODES = {
    FILE_NOT_FOUND: 'FILE_NOT_FOUND',
    FILE_TOO_LARGE: 'FILE_TOO_LARGE',
    INVALID_FORMAT: 'INVALID_FORMAT',
    SAVE_FAILED: 'SAVE_FAILED',
    EXPORT_FAILED: 'EXPORT_FAILED',
    NETWORK_ERROR: 'NETWORK_ERROR',
    PERMISSION_DENIED: 'PERMISSION_DENIED',
    UNKNOWN_ERROR: 'UNKNOWN_ERROR'
};

// 状态常量
export const STATUS = {
    IDLE: 'idle',
    LOADING: 'loading',
    SAVING: 'saving',
    ERROR: 'error',
    SUCCESS: 'success'
};

// 正则表达式常量
export const REGEX = {
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    URL: /^https?:\/\/.+/,
    MARKDOWN_LINK: /\[([^\]]+)\]\(([^)]+)\)/g,
    MARKDOWN_IMAGE: /!\[([^\]]*)\]\(([^)]+)\)/g,
    MARKDOWN_CODE: /`([^`]+)`/g,
    MARKDOWN_BOLD: /\*\*([^*]+)\*\*/g,
    MARKDOWN_ITALIC: /\*([^*]+)\*/g,
    MARKDOWN_HEADING: /^(#{1,6})\s+(.+)$/gm,
    WHITESPACE: /\s+/g,
    LINE_BREAK: /\r?\n/g
};

// 默认导出配置对象
export default APP_CONFIG;
