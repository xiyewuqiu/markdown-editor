/*
 * 行号管理组件
 * 管理编辑器的行号显示和同步
 */

import { EventEmitter } from '../../utils/event-utils.js';
import { $, addClass, removeClass, setStyle } from '../../utils/dom-utils.js';
import { stateManager } from '../../core/state.js';
import { throttle } from '../../utils/event-utils.js';

export class LineNumbers extends EventEmitter {
    constructor(container, editor) {
        super();
        
        this.container = typeof container === 'string' ? $(container) : container;
        this.editor = editor;
        this.lineNumbersElement = null;
        
        // 状态
        this.isVisible = true;
        this.lineCount = 1;
        this.currentLine = 1;
        
        // 节流函数
        this.throttledUpdate = throttle(this.updateLineNumbers.bind(this), 16);
        this.throttledScroll = throttle(this.syncScroll.bind(this), 16);
        
        this.init();
    }
    
    // 初始化行号组件
    init() {
        if (!this.container) {
            console.error('LineNumbers container not found');
            return;
        }
        
        this.createLineNumbers();
        this.bindEvents();
        this.updateLineNumbers();
        
        // 监听状态变化
        this.setupStateListeners();
    }
    
    // 创建行号元素
    createLineNumbers() {
        // 查找或创建行号容器
        this.lineNumbersElement = $('#line-numbers', this.container);
        
        if (!this.lineNumbersElement) {
            this.lineNumbersElement = document.createElement('div');
            this.lineNumbersElement.id = 'line-numbers';
            this.lineNumbersElement.className = 'line-numbers';
            
            // 插入到编辑器前面
            const editorWrapper = $('.editor-wrapper', this.container);
            if (editorWrapper) {
                editorWrapper.insertBefore(this.lineNumbersElement, editorWrapper.firstChild);
            } else {
                this.container.insertBefore(this.lineNumbersElement, this.container.firstChild);
            }
        }
        
        // 设置属性
        this.lineNumbersElement.setAttribute('aria-hidden', 'true');
        this.lineNumbersElement.setAttribute('role', 'presentation');
        
        // 设置初始可见性
        const lineNumbersVisible = stateManager.getState('view.lineNumbers');
        this.setVisibility(lineNumbersVisible);
    }
    
    // 绑定事件
    bindEvents() {
        if (!this.editor) return;
        
        // 监听编辑器内容变化
        this.editor.on('content:change', this.throttledUpdate);
        
        // 监听编辑器滚动
        this.editor.on('editor:scroll', this.throttledScroll);
        
        // 监听光标变化
        this.editor.on('cursor:change', this.handleCursorChange.bind(this));
        
        // 行号点击事件
        this.lineNumbersElement.addEventListener('click', this.handleLineClick.bind(this));
        
        // 行号悬停事件
        this.lineNumbersElement.addEventListener('mouseover', this.handleLineHover.bind(this));
        this.lineNumbersElement.addEventListener('mouseout', this.handleLineOut.bind(this));
    }
    
    // 设置状态监听器
    setupStateListeners() {
        // 监听行号显示设置
        stateManager.onStateChange('view.lineNumbers', (event) => {
            this.setVisibility(event.newValue);
        });
        
        // 监听编辑器设置变化
        stateManager.onStateChange('settings', (event) => {
            this.updateStyles(event.newValue);
        });
        
        // 监听主题变化
        stateManager.onStateChange('theme.current', () => {
            this.updateTheme();
        });
    }
    
    // 更新行号
    updateLineNumbers() {
        if (!this.lineNumbersElement || !this.isVisible) return;
        
        const content = this.editor ? this.editor.getContent() : '';
        const lines = content.split('\n');
        const newLineCount = lines.length;
        
        // 只在行数变化时更新
        if (newLineCount !== this.lineCount) {
            this.lineCount = newLineCount;
            this.renderLineNumbers();
        }
    }
    
    // 渲染行号
    renderLineNumbers() {
        if (!this.lineNumbersElement) return;
        
        // 创建行号内容
        const lineNumbers = [];
        for (let i = 1; i <= this.lineCount; i++) {
            lineNumbers.push(`<span class="line-number" data-line="${i}">${i}</span>`);
        }
        
        this.lineNumbersElement.innerHTML = lineNumbers.join('\n');
        
        // 高亮当前行
        this.highlightCurrentLine();
        
        this.emit('line-numbers:updated', { lineCount: this.lineCount });
    }
    
    // 同步滚动
    syncScroll(event) {
        if (!this.lineNumbersElement || !this.isVisible) return;
        
        const { scrollTop } = event;
        this.lineNumbersElement.scrollTop = scrollTop;
    }
    
    // 处理光标变化
    handleCursorChange(position) {
        if (position.line !== this.currentLine) {
            this.currentLine = position.line;
            this.highlightCurrentLine();
        }
    }
    
    // 高亮当前行
    highlightCurrentLine() {
        if (!this.lineNumbersElement) return;
        
        // 移除之前的高亮
        const previousHighlight = $('.line-number.current', this.lineNumbersElement);
        if (previousHighlight) {
            removeClass(previousHighlight, 'current');
        }
        
        // 添加新的高亮
        const currentLineElement = $(`.line-number[data-line="${this.currentLine}"]`, this.lineNumbersElement);
        if (currentLineElement) {
            addClass(currentLineElement, 'current');
        }
    }
    
    // 处理行号点击
    handleLineClick(event) {
        const lineElement = event.target.closest('.line-number');
        if (!lineElement) return;
        
        const lineNumber = parseInt(lineElement.getAttribute('data-line'));
        if (lineNumber && this.editor) {
            // 跳转到指定行
            this.editor.setCursorPosition(lineNumber, 1);
            this.editor.focus();
            
            this.emit('line:click', { line: lineNumber });
        }
    }
    
    // 处理行号悬停
    handleLineHover(event) {
        const lineElement = event.target.closest('.line-number');
        if (!lineElement) return;
        
        addClass(lineElement, 'hover');
        
        const lineNumber = parseInt(lineElement.getAttribute('data-line'));
        this.emit('line:hover', { line: lineNumber });
    }
    
    // 处理行号离开
    handleLineOut(event) {
        const lineElement = event.target.closest('.line-number');
        if (!lineElement) return;
        
        removeClass(lineElement, 'hover');
    }
    
    // 设置可见性
    setVisibility(visible) {
        this.isVisible = visible;
        
        if (this.lineNumbersElement) {
            setStyle(this.lineNumbersElement, {
                display: visible ? 'block' : 'none'
            });
        }
        
        // 更新容器类名
        if (this.container) {
            if (visible) {
                addClass(this.container, 'line-numbers-visible');
                removeClass(this.container, 'line-numbers-hidden');
            } else {
                addClass(this.container, 'line-numbers-hidden');
                removeClass(this.container, 'line-numbers-visible');
            }
        }
        
        this.emit('visibility:change', { visible });
    }
    
    // 更新样式
    updateStyles(settings) {
        if (!this.lineNumbersElement) return;
        
        setStyle(this.lineNumbersElement, {
            fontSize: settings.fontSize + 'px',
            fontFamily: settings.fontFamily,
            lineHeight: '1.8'
        });
    }
    
    // 更新主题
    updateTheme() {
        // 主题样式通过CSS处理，这里可以添加特殊逻辑
        this.emit('theme:updated');
    }
    
    // 跳转到指定行
    goToLine(lineNumber) {
        if (!this.editor) return;
        
        const maxLine = this.lineCount;
        const targetLine = Math.max(1, Math.min(lineNumber, maxLine));
        
        this.editor.setCursorPosition(targetLine, 1);
        this.editor.focus();
        
        // 滚动到可见区域
        this.scrollToLine(targetLine);
        
        this.emit('line:goto', { line: targetLine });
    }
    
    // 滚动到指定行
    scrollToLine(lineNumber) {
        if (!this.lineNumbersElement || !this.editor) return;
        
        const lineElement = $(`.line-number[data-line="${lineNumber}"]`, this.lineNumbersElement);
        if (lineElement) {
            lineElement.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    }
    
    // 获取行数
    getLineCount() {
        return this.lineCount;
    }
    
    // 获取当前行
    getCurrentLine() {
        return this.currentLine;
    }
    
    // 是否可见
    isLineNumbersVisible() {
        return this.isVisible;
    }
    
    // 切换可见性
    toggle() {
        this.setVisibility(!this.isVisible);
        stateManager.setState('view.lineNumbers', this.isVisible);
    }
    
    // 添加行标记
    addLineMarker(lineNumber, className, title = '') {
        const lineElement = $(`.line-number[data-line="${lineNumber}"]`, this.lineNumbersElement);
        if (lineElement) {
            addClass(lineElement, className);
            if (title) {
                lineElement.setAttribute('title', title);
            }
        }
    }
    
    // 移除行标记
    removeLineMarker(lineNumber, className) {
        const lineElement = $(`.line-number[data-line="${lineNumber}"]`, this.lineNumbersElement);
        if (lineElement) {
            removeClass(lineElement, className);
            lineElement.removeAttribute('title');
        }
    }
    
    // 清除所有标记
    clearAllMarkers() {
        const lineElements = $$('.line-number', this.lineNumbersElement);
        lineElements.forEach(element => {
            element.className = 'line-number';
            element.removeAttribute('title');
        });
    }
    
    // 获取可见行范围
    getVisibleRange() {
        if (!this.lineNumbersElement) return { start: 1, end: 1 };
        
        const containerRect = this.lineNumbersElement.getBoundingClientRect();
        const lineHeight = parseFloat(getComputedStyle(this.lineNumbersElement).lineHeight);
        
        const start = Math.floor(this.lineNumbersElement.scrollTop / lineHeight) + 1;
        const visibleLines = Math.ceil(containerRect.height / lineHeight);
        const end = Math.min(start + visibleLines, this.lineCount);
        
        return { start, end };
    }
    
    // 销毁组件
    destroy() {
        if (this.editor) {
            this.editor.off('content:change', this.throttledUpdate);
            this.editor.off('editor:scroll', this.throttledScroll);
            this.editor.off('cursor:change', this.handleCursorChange);
        }
        
        if (this.lineNumbersElement) {
            this.lineNumbersElement.removeEventListener('click', this.handleLineClick);
            this.lineNumbersElement.removeEventListener('mouseover', this.handleLineHover);
            this.lineNumbersElement.removeEventListener('mouseout', this.handleLineOut);
        }
        
        this.removeAllListeners();
    }
}

// 默认导出
export default LineNumbers;
