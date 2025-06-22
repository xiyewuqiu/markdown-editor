/*
 * 编辑器核心组件
 * 管理Markdown编辑器的核心功能
 */

import { EventEmitter } from '../../utils/event-utils.js';
import { $, addClass, removeClass } from '../../utils/dom-utils.js';
import { stateManager } from '../../core/state.js';
import { APP_CONFIG, EVENT_TYPES } from '../../core/config.js';
import { debounce, throttle } from '../../utils/event-utils.js';

export class EditorCore extends EventEmitter {
    constructor(container) {
        super();
        
        this.container = typeof container === 'string' ? $(container) : container;
        this.textarea = null;
        this.lineNumbers = null;
        
        // 编辑器状态
        this.isInitialized = false;
        this.isFocused = false;
        this.lastContent = '';
        this.lastCursorPosition = { line: 1, column: 1 };
        
        // 防抖和节流函数
        this.debouncedContentChange = debounce(this.handleContentChange.bind(this), 300);
        this.throttledScroll = throttle(this.handleScroll.bind(this), 16);
        this.throttledCursorChange = throttle(this.handleCursorChange.bind(this), 100);
        
        this.init();
    }
    
    // 初始化编辑器
    init() {
        if (!this.container) {
            console.error('Editor container not found');
            return;
        }
        
        this.createEditor();
        this.bindEvents();
        this.setupInitialContent();
        this.isInitialized = true;
        
        this.emit('editor:ready');
    }
    
    // 创建编辑器元素
    createEditor() {
        // 查找或创建textarea
        this.textarea = $('#editor', this.container);
        if (!this.textarea) {
            this.textarea = document.createElement('textarea');
            this.textarea.id = 'editor';
            this.container.appendChild(this.textarea);
        }
        
        // 设置编辑器属性
        this.setupEditorAttributes();
        
        // 查找行号容器
        this.lineNumbers = $('#line-numbers', this.container);
    }
    
    // 设置编辑器属性
    setupEditorAttributes() {
        const settings = stateManager.getState('settings');
        
        this.textarea.setAttribute('spellcheck', 'false');
        this.textarea.setAttribute('autocomplete', 'off');
        this.textarea.setAttribute('autocorrect', 'off');
        this.textarea.setAttribute('autocapitalize', 'off');
        this.textarea.setAttribute('wrap', settings.wordWrap ? 'soft' : 'off');
        this.textarea.placeholder = APP_CONFIG.editor.placeholder;
        
        // 设置样式
        this.textarea.style.fontSize = settings.fontSize + 'px';
        this.textarea.style.fontFamily = settings.fontFamily;
        this.textarea.style.tabSize = settings.tabSize;
    }
    
    // 绑定事件
    bindEvents() {
        if (!this.textarea) return;
        
        // 内容变化事件
        this.textarea.addEventListener('input', this.debouncedContentChange);
        this.textarea.addEventListener('paste', this.handlePaste.bind(this));
        
        // 光标和选择事件
        this.textarea.addEventListener('selectionchange', this.throttledCursorChange);
        this.textarea.addEventListener('keyup', this.throttledCursorChange);
        this.textarea.addEventListener('mouseup', this.throttledCursorChange);
        
        // 焦点事件
        this.textarea.addEventListener('focus', this.handleFocus.bind(this));
        this.textarea.addEventListener('blur', this.handleBlur.bind(this));
        
        // 滚动事件
        this.textarea.addEventListener('scroll', this.throttledScroll);
        
        // 键盘事件
        this.textarea.addEventListener('keydown', this.handleKeyDown.bind(this));
        
        // 拖拽事件
        this.textarea.addEventListener('dragover', this.handleDragOver.bind(this));
        this.textarea.addEventListener('drop', this.handleDrop.bind(this));
        
        // 状态管理器事件
        stateManager.on('state:editor.content', this.handleStateContentChange.bind(this));
        stateManager.on('state:settings', this.handleSettingsChange.bind(this));
        stateManager.on('state:view.lineNumbers', this.handleLineNumbersChange.bind(this));
    }
    
    // 设置初始内容
    setupInitialContent() {
        const content = stateManager.getState('editor.content') || '';
        this.setContent(content, false);
    }
    
    // 处理内容变化
    handleContentChange() {
        const content = this.textarea.value;
        
        if (content !== this.lastContent) {
            this.lastContent = content;
            stateManager.setContent(content);
            this.updateLineNumbers();
            this.emit('content:change', { content });
        }
    }
    
    // 处理状态内容变化
    handleStateContentChange(event) {
        const { newValue } = event;
        if (newValue !== this.textarea.value) {
            this.setContent(newValue, false);
        }
    }
    
    // 处理粘贴事件
    handlePaste(e) {
        // 检查是否粘贴文件
        const items = e.clipboardData?.items;
        if (items) {
            for (const item of items) {
                if (item.type.startsWith('image/')) {
                    e.preventDefault();
                    this.handleImagePaste(item);
                    return;
                }
            }
        }
        
        // 延迟处理文本粘贴
        setTimeout(() => {
            this.handleContentChange();
        }, 0);
    }
    
    // 处理图片粘贴
    handleImagePaste(item) {
        const file = item.getAsFile();
        if (file) {
            this.emit('image:paste', { file });
        }
    }
    
    // 处理光标变化
    handleCursorChange() {
        const position = this.getCursorPosition();
        
        if (
            position.line !== this.lastCursorPosition.line ||
            position.column !== this.lastCursorPosition.column
        ) {
            this.lastCursorPosition = position;
            stateManager.setCursorPosition(position.line, position.column);
            this.emit('cursor:change', position);
        }
        
        // 更新选择范围
        const selection = this.getSelection();
        stateManager.setSelection(selection.start, selection.end);
    }
    
    // 处理焦点事件
    handleFocus() {
        this.isFocused = true;
        addClass(this.container, 'focused');
        this.emit('editor:focus');
    }
    
    // 处理失焦事件
    handleBlur() {
        this.isFocused = false;
        removeClass(this.container, 'focused');
        this.emit('editor:blur');
    }
    
    // 处理滚动事件
    handleScroll() {
        if (this.lineNumbers) {
            this.lineNumbers.scrollTop = this.textarea.scrollTop;
        }
        
        this.emit('editor:scroll', {
            scrollTop: this.textarea.scrollTop,
            scrollLeft: this.textarea.scrollLeft
        });
    }
    
    // 处理键盘事件
    handleKeyDown(e) {
        // Tab键处理
        if (e.key === 'Tab') {
            e.preventDefault();
            this.handleTab(e.shiftKey);
            return;
        }
        
        // Enter键处理
        if (e.key === 'Enter') {
            this.handleEnter(e);
        }
        
        this.emit('editor:keydown', { event: e });
    }
    
    // 处理Tab键
    handleTab(isShift) {
        const settings = stateManager.getState('settings');
        const tabString = settings.insertSpaces ? 
            ' '.repeat(settings.tabSize) : '\t';
        
        if (isShift) {
            this.unindent();
        } else {
            this.indent(tabString);
        }
    }
    
    // 处理Enter键
    handleEnter(e) {
        if (APP_CONFIG.editor.autoIndent) {
            const currentLine = this.getCurrentLine();
            const indent = this.getLineIndent(currentLine);
            
            if (indent) {
                setTimeout(() => {
                    this.insertText(indent);
                }, 0);
            }
        }
    }
    
    // 处理拖拽悬停
    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        addClass(this.container, 'drag-over');
    }
    
    // 处理文件拖拽
    handleDrop(e) {
        e.preventDefault();
        removeClass(this.container, 'drag-over');
        
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            this.emit('files:drop', { files });
        }
    }
    
    // 处理设置变化
    handleSettingsChange(event) {
        const { newValue } = event;
        this.setupEditorAttributes();
        
        if (newValue.fontSize !== this.lastSettings?.fontSize) {
            this.textarea.style.fontSize = newValue.fontSize + 'px';
        }
        
        if (newValue.fontFamily !== this.lastSettings?.fontFamily) {
            this.textarea.style.fontFamily = newValue.fontFamily;
        }
        
        this.lastSettings = { ...newValue };
    }
    
    // 处理行号显示变化
    handleLineNumbersChange(event) {
        const { newValue } = event;
        if (this.lineNumbers) {
            this.lineNumbers.style.display = newValue ? 'block' : 'none';
        }
    }
    
    // ===== 公共方法 =====
    
    // 设置内容
    setContent(content, updateState = true) {
        if (this.textarea.value !== content) {
            this.textarea.value = content;
            this.lastContent = content;
            
            if (updateState) {
                stateManager.setContent(content);
            }
            
            this.updateLineNumbers();
        }
    }
    
    // 获取内容
    getContent() {
        return this.textarea.value;
    }
    
    // 获取选择范围
    getSelection() {
        return {
            start: this.textarea.selectionStart,
            end: this.textarea.selectionEnd,
            text: this.textarea.value.substring(
                this.textarea.selectionStart,
                this.textarea.selectionEnd
            )
        };
    }
    
    // 设置选择范围
    setSelection(start, end = start) {
        this.textarea.setSelectionRange(start, end);
        this.textarea.focus();
    }
    
    // 获取光标位置
    getCursorPosition() {
        const content = this.textarea.value;
        const cursorPos = this.textarea.selectionStart;
        
        const lines = content.substring(0, cursorPos).split('\n');
        const line = lines.length;
        const column = lines[lines.length - 1].length + 1;
        
        return { line, column };
    }
    
    // 设置光标位置
    setCursorPosition(line, column) {
        const lines = this.textarea.value.split('\n');
        let position = 0;
        
        for (let i = 0; i < Math.min(line - 1, lines.length); i++) {
            position += lines[i].length + 1; // +1 for newline
        }
        
        position += Math.min(column - 1, lines[line - 1]?.length || 0);
        this.setSelection(position);
    }
    
    // 插入文本
    insertText(text) {
        const start = this.textarea.selectionStart;
        const end = this.textarea.selectionEnd;
        const value = this.textarea.value;
        
        const newValue = value.substring(0, start) + text + value.substring(end);
        this.setContent(newValue);
        
        const newCursorPos = start + text.length;
        this.setSelection(newCursorPos);
    }
    
    // 替换选中文本
    replaceSelection(text) {
        this.insertText(text);
    }
    
    // 获取当前行
    getCurrentLine() {
        const cursorPos = this.textarea.selectionStart;
        const content = this.textarea.value;
        
        const lineStart = content.lastIndexOf('\n', cursorPos - 1) + 1;
        const lineEnd = content.indexOf('\n', cursorPos);
        
        return content.substring(lineStart, lineEnd === -1 ? content.length : lineEnd);
    }
    
    // 获取行缩进
    getLineIndent(line) {
        const match = line.match(/^(\s*)/);
        return match ? match[1] : '';
    }
    
    // 缩进
    indent(tabString = '\t') {
        const selection = this.getSelection();
        const lines = selection.text.split('\n');
        const indentedLines = lines.map(line => tabString + line);
        
        this.replaceSelection(indentedLines.join('\n'));
    }
    
    // 取消缩进
    unindent() {
        const settings = stateManager.getState('settings');
        const tabString = settings.insertSpaces ? 
            ' '.repeat(settings.tabSize) : '\t';
        
        const selection = this.getSelection();
        const lines = selection.text.split('\n');
        const unindentedLines = lines.map(line => {
            if (line.startsWith(tabString)) {
                return line.substring(tabString.length);
            }
            return line;
        });
        
        this.replaceSelection(unindentedLines.join('\n'));
    }
    
    // 更新行号
    updateLineNumbers() {
        if (!this.lineNumbers) return;
        
        const content = this.textarea.value;
        const lineCount = content.split('\n').length;
        
        let lineNumbersHtml = '';
        for (let i = 1; i <= lineCount; i++) {
            lineNumbersHtml += i + '\n';
        }
        
        this.lineNumbers.textContent = lineNumbersHtml;
    }
    
    // 聚焦编辑器
    focus() {
        this.textarea.focus();
    }
    
    // 失焦编辑器
    blur() {
        this.textarea.blur();
    }
    
    // 销毁编辑器
    destroy() {
        if (this.textarea) {
            this.textarea.removeEventListener('input', this.debouncedContentChange);
            this.textarea.removeEventListener('paste', this.handlePaste);
            // ... 移除其他事件监听器
        }
        
        stateManager.off('state:editor.content', this.handleStateContentChange);
        stateManager.off('state:settings', this.handleSettingsChange);
        stateManager.off('state:view.lineNumbers', this.handleLineNumbersChange);
        
        this.removeAllListeners();
    }
}

// 默认导出
export default EditorCore;
