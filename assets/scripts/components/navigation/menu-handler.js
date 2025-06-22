/*
 * 菜单处理器
 * 处理导航菜单的各种动作和命令
 */

import { EventEmitter } from '../../utils/event-utils.js';
import { stateManager } from '../../core/state.js';
import { EVENT_TYPES } from '../../core/config.js';

export class MenuHandler extends EventEmitter {
    constructor() {
        super();
        
        // 动作处理器映射
        this.actionHandlers = new Map();
        
        this.init();
    }
    
    // 初始化菜单处理器
    init() {
        this.registerDefaultHandlers();
        this.bindEvents();
    }
    
    // 绑定事件
    bindEvents() {
        // 监听菜单动作事件
        document.addEventListener('menu:action', (e) => {
            this.handleAction(e.detail.action, e.detail.event);
        });
    }
    
    // 注册默认处理器
    registerDefaultHandlers() {
        // 文件菜单处理器
        this.registerHandler('new', this.handleNew.bind(this));
        this.registerHandler('open', this.handleOpen.bind(this));
        this.registerHandler('save', this.handleSave.bind(this));
        this.registerHandler('export-html', this.handleExportHtml.bind(this));
        this.registerHandler('export-pdf', this.handleExportPdf.bind(this));
        
        // 编辑菜单处理器
        this.registerHandler('select-all', this.handleSelectAll.bind(this));
        this.registerHandler('copy', this.handleCopy.bind(this));
        this.registerHandler('cut', this.handleCut.bind(this));
        this.registerHandler('paste', this.handlePaste.bind(this));
        this.registerHandler('undo', this.handleUndo.bind(this));
        this.registerHandler('redo', this.handleRedo.bind(this));
        
        // 格式菜单处理器
        this.registerHandler('bold', this.handleBold.bind(this));
        this.registerHandler('italic', this.handleItalic.bind(this));
        this.registerHandler('strikethrough', this.handleStrikethrough.bind(this));
        this.registerHandler('code', this.handleCode.bind(this));
        this.registerHandler('codeblock', this.handleCodeBlock.bind(this));
        this.registerHandler('clear-format', this.handleClearFormat.bind(this));
        
        // 插入菜单处理器
        this.registerHandler('heading', this.handleHeading.bind(this));
        this.registerHandler('heading-1', () => this.handleSpecificHeading(1));
        this.registerHandler('heading-2', () => this.handleSpecificHeading(2));
        this.registerHandler('heading-3', () => this.handleSpecificHeading(3));
        this.registerHandler('heading-4', () => this.handleSpecificHeading(4));
        this.registerHandler('heading-5', () => this.handleSpecificHeading(5));
        this.registerHandler('heading-6', () => this.handleSpecificHeading(6));
        this.registerHandler('link', this.handleLink.bind(this));
        this.registerHandler('image', this.handleImage.bind(this));
        this.registerHandler('math', this.handleMath.bind(this));
        this.registerHandler('table', this.handleTable.bind(this));
        this.registerHandler('list-ordered', this.handleOrderedList.bind(this));
        this.registerHandler('list-unordered', this.handleUnorderedList.bind(this));
        this.registerHandler('quote', this.handleQuote.bind(this));
        this.registerHandler('hr', this.handleHorizontalRule.bind(this));
        
        // 视图菜单处理器
        this.registerHandler('fullscreen', this.handleFullscreen.bind(this));
        this.registerHandler('view-split', () => this.handleViewChange('split'));
        this.registerHandler('view-editor', () => this.handleViewChange('editor'));
        this.registerHandler('view-preview', () => this.handleViewChange('preview'));
        this.registerHandler('theme-toggle', this.handleThemeToggle.bind(this));
        this.registerHandler('line-numbers', this.handleLineNumbers.bind(this));
    }
    
    // 注册动作处理器
    registerHandler(action, handler) {
        this.actionHandlers.set(action, handler);
    }
    
    // 注销动作处理器
    unregisterHandler(action) {
        this.actionHandlers.delete(action);
    }
    
    // 处理动作
    handleAction(action, event) {
        const handler = this.actionHandlers.get(action);
        
        if (handler) {
            try {
                handler(event);
                this.emit('action:executed', { action, event });
            } catch (error) {
                console.error(`Error executing action '${action}':`, error);
                this.emit('action:error', { action, error, event });
            }
        } else {
            console.warn(`No handler found for action: ${action}`);
            this.emit('action:unknown', { action, event });
        }
    }
    
    // ===== 文件菜单处理器 =====
    
    handleNew() {
        this.emit('file:new');
    }
    
    handleOpen() {
        this.emit('file:open');
    }
    
    handleSave() {
        this.emit('file:save');
    }
    
    handleExportHtml() {
        this.emit('file:export', { format: 'html' });
    }
    
    handleExportPdf() {
        this.emit('file:export', { format: 'pdf' });
    }
    
    // ===== 编辑菜单处理器 =====
    
    handleSelectAll() {
        this.emit('editor:select-all');
    }
    
    handleCopy() {
        this.emit('editor:copy');
    }
    
    handleCut() {
        this.emit('editor:cut');
    }
    
    handlePaste() {
        this.emit('editor:paste');
    }
    
    handleUndo() {
        const success = stateManager.undo();
        if (success) {
            this.emit('editor:undo');
        }
    }
    
    handleRedo() {
        const success = stateManager.redo();
        if (success) {
            this.emit('editor:redo');
        }
    }
    
    // ===== 格式菜单处理器 =====
    
    handleBold() {
        this.emit('format:bold');
    }
    
    handleItalic() {
        this.emit('format:italic');
    }
    
    handleStrikethrough() {
        this.emit('format:strikethrough');
    }
    
    handleCode() {
        this.emit('format:code');
    }
    
    handleCodeBlock() {
        this.emit('format:codeblock');
    }
    
    handleClearFormat() {
        this.emit('format:clear');
    }
    
    // ===== 插入菜单处理器 =====
    
    handleHeading() {
        this.emit('insert:heading');
    }
    
    handleSpecificHeading(level) {
        this.emit('insert:heading', { level });
    }
    
    handleLink() {
        this.emit('insert:link');
    }
    
    handleImage() {
        this.emit('insert:image');
    }
    
    handleMath() {
        this.emit('insert:math');
    }
    
    handleTable() {
        this.emit('insert:table');
    }
    
    handleOrderedList() {
        this.emit('insert:list', { type: 'ordered' });
    }
    
    handleUnorderedList() {
        this.emit('insert:list', { type: 'unordered' });
    }
    
    handleQuote() {
        this.emit('insert:quote');
    }
    
    handleHorizontalRule() {
        this.emit('insert:hr');
    }
    
    // ===== 视图菜单处理器 =====
    
    handleFullscreen() {
        stateManager.toggleFullscreen();
        this.emit('view:fullscreen');
    }
    
    handleViewChange(mode) {
        stateManager.setViewMode(mode);
        this.emit('view:change', { mode });
    }
    
    handleThemeToggle() {
        stateManager.toggleTheme();
        this.emit('theme:toggle');
    }
    
    handleLineNumbers() {
        stateManager.toggleLineNumbers();
        this.emit('view:line-numbers');
    }
    
    // ===== 工具方法 =====
    
    // 获取当前编辑器实例
    getEditor() {
        return document.getElementById('editor');
    }
    
    // 获取选中的文本
    getSelectedText() {
        const editor = this.getEditor();
        if (!editor) return '';
        
        const start = editor.selectionStart;
        const end = editor.selectionEnd;
        
        return editor.value.substring(start, end);
    }
    
    // 替换选中的文本
    replaceSelectedText(replacement) {
        const editor = this.getEditor();
        if (!editor) return;
        
        const start = editor.selectionStart;
        const end = editor.selectionEnd;
        const value = editor.value;
        
        const newValue = value.substring(0, start) + replacement + value.substring(end);
        
        // 更新编辑器内容
        editor.value = newValue;
        stateManager.setContent(newValue);
        
        // 设置新的光标位置
        const newCursorPos = start + replacement.length;
        editor.setSelectionRange(newCursorPos, newCursorPos);
        editor.focus();
    }
    
    // 在行首插入文本
    insertAtLineStart(prefix) {
        const editor = this.getEditor();
        if (!editor) return;
        
        const start = editor.selectionStart;
        const value = editor.value;
        
        // 找到当前行的开始位置
        const lineStart = value.lastIndexOf('\n', start - 1) + 1;
        
        // 插入前缀
        const newValue = value.substring(0, lineStart) + prefix + value.substring(lineStart);
        
        editor.value = newValue;
        stateManager.setContent(newValue);
        
        // 设置光标位置
        const newCursorPos = start + prefix.length;
        editor.setSelectionRange(newCursorPos, newCursorPos);
        editor.focus();
    }
    
    // 包装选中的文本
    wrapSelectedText(before, after = '') {
        const selected = this.getSelectedText();
        const replacement = before + selected + after;
        this.replaceSelectedText(replacement);
    }
    
    // 显示通知
    showNotification(message, type = 'info') {
        stateManager.addNotification({
            message,
            type,
            duration: 3000
        });
    }
    
    // 销毁处理器
    destroy() {
        this.actionHandlers.clear();
        this.removeAllListeners();
    }
}

// 默认导出
export default MenuHandler;
