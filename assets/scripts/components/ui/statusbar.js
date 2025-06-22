/*
 * 状态栏组件
 * 显示编辑器状态信息
 */

import { EventEmitter } from '../../utils/event-utils.js';
import { $, $$, addClass, removeClass, text } from '../../utils/dom-utils.js';
import { stateManager } from '../../core/state.js';

export class StatusBar extends EventEmitter {
    constructor(container) {
        super();
        
        this.container = typeof container === 'string' ? $(container) : container;
        this.elements = {};
        
        this.init();
    }
    
    // 初始化状态栏
    init() {
        if (!this.container) {
            console.error('StatusBar container not found');
            return;
        }
        
        this.findElements();
        this.bindEvents();
        this.updateAll();
    }
    
    // 查找状态栏元素
    findElements() {
        this.elements = {
            filename: $('#status-filename', this.container),
            cursor: $('#status-cursor', this.container),
            text: $('#status-text', this.container),
            words: $('#status-words', this.container),
            lines: $('#status-lines', this.container)
        };
    }
    
    // 绑定事件
    bindEvents() {
        // 监听状态变化
        stateManager.onStateChange('file.name', this.updateFilename.bind(this));
        stateManager.onStateChange('editor.cursor', this.updateCursor.bind(this));
        stateManager.onStateChange('editor.charCount', this.updateCharCount.bind(this));
        stateManager.onStateChange('editor.wordCount', this.updateWordCount.bind(this));
        stateManager.onStateChange('editor.lineCount', this.updateLineCount.bind(this));
        stateManager.onStateChange('file.saved', this.updateSaveStatus.bind(this));
        
        // 状态栏项点击事件
        this.bindClickEvents();
    }
    
    // 绑定点击事件
    bindClickEvents() {
        // 文件名点击 - 显示文件信息
        if (this.elements.filename) {
            this.elements.filename.addEventListener('click', () => {
                this.showFileInfo();
            });
        }
        
        // 光标位置点击 - 跳转到行
        if (this.elements.cursor) {
            this.elements.cursor.addEventListener('click', () => {
                this.showGoToLineDialog();
            });
        }
        
        // 统计信息点击 - 显示详细统计
        [this.elements.text, this.elements.words, this.elements.lines].forEach(element => {
            if (element) {
                element.addEventListener('click', () => {
                    this.showDetailedStats();
                });
            }
        });
    }
    
    // 更新所有状态
    updateAll() {
        this.updateFilename();
        this.updateCursor();
        this.updateCharCount();
        this.updateWordCount();
        this.updateLineCount();
        this.updateSaveStatus();
    }
    
    // 更新文件名
    updateFilename() {
        const filename = stateManager.getState('file.name') || 'untitled.md';
        const saved = stateManager.getState('file.saved');
        
        if (this.elements.filename) {
            const displayName = saved ? filename : `${filename} *`;
            text(this.elements.filename, displayName);
            
            // 更新样式
            if (saved) {
                removeClass(this.elements.filename, 'modified');
            } else {
                addClass(this.elements.filename, 'modified');
            }
            
            // 更新工具提示
            const path = stateManager.getState('file.path');
            const tooltip = path ? `${path}/${filename}` : filename;
            this.elements.filename.setAttribute('title', tooltip);
        }
    }
    
    // 更新光标位置
    updateCursor() {
        const cursor = stateManager.getState('editor.cursor') || { line: 1, column: 1 };
        
        if (this.elements.cursor) {
            text(this.elements.cursor, `${cursor.line}:${cursor.column}`);
            this.elements.cursor.setAttribute('title', `行 ${cursor.line}, 列 ${cursor.column}`);
        }
    }
    
    // 更新字符数
    updateCharCount() {
        const charCount = stateManager.getState('editor.charCount') || 0;
        
        if (this.elements.text) {
            text(this.elements.text, `${charCount} 字符`);
            this.elements.text.setAttribute('title', `总字符数: ${charCount}`);
        }
    }
    
    // 更新单词数
    updateWordCount() {
        const wordCount = stateManager.getState('editor.wordCount') || 0;
        
        if (this.elements.words) {
            text(this.elements.words, `${wordCount} 单词`);
            this.elements.words.setAttribute('title', `总单词数: ${wordCount}`);
        }
    }
    
    // 更新行数
    updateLineCount() {
        const lineCount = stateManager.getState('editor.lineCount') || 1;
        
        if (this.elements.lines) {
            text(this.elements.lines, `${lineCount} 行`);
            this.elements.lines.setAttribute('title', `总行数: ${lineCount}`);
        }
    }
    
    // 更新保存状态
    updateSaveStatus() {
        const saved = stateManager.getState('file.saved');
        
        // 更新容器类名
        if (saved) {
            removeClass(this.container, 'unsaved');
            addClass(this.container, 'saved');
        } else {
            removeClass(this.container, 'saved');
            addClass(this.container, 'unsaved');
        }
    }
    
    // 显示文件信息
    showFileInfo() {
        const fileState = stateManager.getState('file');
        const editorState = stateManager.getState('editor');
        
        const info = {
            name: fileState.name,
            path: fileState.path,
            size: fileState.size,
            lastModified: fileState.lastModified,
            encoding: fileState.encoding,
            saved: fileState.saved,
            charCount: editorState.charCount,
            wordCount: editorState.wordCount,
            lineCount: editorState.lineCount
        };
        
        this.emit('file-info:show', info);
        
        // 显示通知
        const message = `文件: ${info.name}\n字符: ${info.charCount}\n单词: ${info.wordCount}\n行数: ${info.lineCount}`;
        stateManager.addNotification({
            title: '文件信息',
            message,
            type: 'info',
            duration: 5000
        });
    }
    
    // 显示跳转到行对话框
    showGoToLineDialog() {
        const currentLine = stateManager.getState('editor.cursor.line') || 1;
        const maxLine = stateManager.getState('editor.lineCount') || 1;
        
        const lineNumber = prompt(`跳转到行 (1-${maxLine}):`, currentLine);
        
        if (lineNumber !== null) {
            const targetLine = parseInt(lineNumber);
            
            if (isNaN(targetLine) || targetLine < 1 || targetLine > maxLine) {
                stateManager.addNotification({
                    message: `请输入有效的行号 (1-${maxLine})`,
                    type: 'error',
                    duration: 3000
                });
                return;
            }
            
            this.emit('goto-line', { line: targetLine });
        }
    }
    
    // 显示详细统计
    showDetailedStats() {
        const content = stateManager.getState('editor.content') || '';
        const stats = this.calculateDetailedStats(content);
        
        this.emit('stats:show', stats);
        
        // 显示详细统计通知
        const message = `
字符数: ${stats.characters}
字符数(不含空格): ${stats.charactersNoSpaces}
单词数: ${stats.words}
行数: ${stats.lines}
段落数: ${stats.paragraphs}
阅读时间: ${stats.readingTime}
        `.trim();
        
        stateManager.addNotification({
            title: '详细统计',
            message,
            type: 'info',
            duration: 8000
        });
    }
    
    // 计算详细统计
    calculateDetailedStats(content) {
        const lines = content.split('\n');
        const words = content.trim() ? content.trim().split(/\s+/) : [];
        const charactersNoSpaces = content.replace(/\s/g, '').length;
        const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim()).length;
        
        // 估算阅读时间（假设每分钟200字）
        const readingTimeMinutes = Math.ceil(words.length / 200);
        const readingTime = readingTimeMinutes < 1 ? '< 1 分钟' : `${readingTimeMinutes} 分钟`;
        
        return {
            characters: content.length,
            charactersNoSpaces,
            words: words.length,
            lines: lines.length,
            paragraphs,
            readingTime,
            sentences: this.countSentences(content),
            averageWordsPerSentence: this.calculateAverageWordsPerSentence(content)
        };
    }
    
    // 计算句子数
    countSentences(content) {
        const sentences = content.split(/[.!?]+/).filter(s => s.trim());
        return sentences.length;
    }
    
    // 计算平均每句单词数
    calculateAverageWordsPerSentence(content) {
        const sentences = this.countSentences(content);
        const words = content.trim() ? content.trim().split(/\s+/).length : 0;
        
        return sentences > 0 ? Math.round(words / sentences) : 0;
    }
    
    // 添加状态指示器
    addStatusIndicator(id, config) {
        const indicator = document.createElement('span');
        indicator.id = `status-${id}`;
        indicator.className = `status-indicator ${config.type || 'info'}`;
        indicator.textContent = config.text || '';
        indicator.title = config.title || '';
        
        // 添加到状态栏
        this.container.appendChild(indicator);
        
        // 如果有持续时间，自动移除
        if (config.duration) {
            setTimeout(() => {
                this.removeStatusIndicator(id);
            }, config.duration);
        }
        
        return indicator;
    }
    
    // 移除状态指示器
    removeStatusIndicator(id) {
        const indicator = $(`#status-${id}`, this.container);
        if (indicator) {
            indicator.remove();
        }
    }
    
    // 更新状态指示器
    updateStatusIndicator(id, config) {
        const indicator = $(`#status-${id}`, this.container);
        if (indicator) {
            if (config.text !== undefined) {
                indicator.textContent = config.text;
            }
            if (config.title !== undefined) {
                indicator.title = config.title;
            }
            if (config.type !== undefined) {
                indicator.className = `status-indicator ${config.type}`;
            }
        }
    }
    
    // 显示临时消息
    showTemporaryMessage(message, duration = 3000) {
        const messageId = 'temp-' + Date.now();
        
        this.addStatusIndicator(messageId, {
            text: message,
            type: 'info',
            duration
        });
        
        return messageId;
    }
    
    // 显示进度
    showProgress(text, progress = 0) {
        const progressId = 'progress-' + Date.now();
        
        const indicator = this.addStatusIndicator(progressId, {
            text: `${text} ${progress}%`,
            type: 'info'
        });
        
        // 添加进度条样式
        addClass(indicator, 'progress-indicator');
        indicator.style.background = `linear-gradient(to right, var(--color-primary-solid) ${progress}%, transparent ${progress}%)`;
        
        return progressId;
    }
    
    // 更新进度
    updateProgress(progressId, progress, text) {
        const indicator = $(`#status-${progressId}`, this.container);
        if (indicator) {
            indicator.textContent = `${text} ${progress}%`;
            indicator.style.background = `linear-gradient(to right, var(--color-primary-solid) ${progress}%, transparent ${progress}%)`;
        }
    }
    
    // 隐藏进度
    hideProgress(progressId) {
        this.removeStatusIndicator(progressId);
    }
    
    // 设置状态栏可见性
    setVisibility(visible) {
        if (visible) {
            removeClass(this.container, 'hidden');
            addClass(this.container, 'visible');
        } else {
            removeClass(this.container, 'visible');
            addClass(this.container, 'hidden');
        }
        
        this.emit('visibility:change', { visible });
    }
    
    // 切换可见性
    toggle() {
        const isVisible = !this.container.classList.contains('hidden');
        this.setVisibility(!isVisible);
    }
    
    // 销毁状态栏
    destroy() {
        // 移除事件监听器
        Object.values(this.elements).forEach(element => {
            if (element) {
                element.removeEventListener('click', () => {});
            }
        });
        
        this.removeAllListeners();
    }
}

// 默认导出
export default StatusBar;
