/*
 * 语法高亮组件
 * 为Markdown编辑器提供语法高亮功能
 */

import { EventEmitter } from '../../utils/event-utils.js';
import { $, addClass, removeClass, setStyle } from '../../utils/dom-utils.js';
import { stateManager } from '../../core/state.js';
import { debounce } from '../../utils/event-utils.js';

export class SyntaxHighlight extends EventEmitter {
    constructor(editor) {
        super();
        
        this.editor = editor;
        this.highlightLayer = null;
        this.isEnabled = true;
        
        // 语法规则
        this.syntaxRules = this.createSyntaxRules();
        
        // 防抖更新
        this.debouncedHighlight = debounce(this.updateHighlight.bind(this), 200);
        
        this.init();
    }
    
    // 初始化语法高亮
    init() {
        if (!this.editor) {
            console.error('SyntaxHighlight requires an editor instance');
            return;
        }
        
        this.createHighlightLayer();
        this.bindEvents();
        this.updateHighlight();
    }
    
    // 创建高亮层
    createHighlightLayer() {
        const editorElement = this.editor.textarea;
        if (!editorElement) return;
        
        // 创建高亮层容器
        this.highlightLayer = document.createElement('div');
        this.highlightLayer.className = 'syntax-highlight-layer';
        
        // 设置样式使其与编辑器重叠
        setStyle(this.highlightLayer, {
            position: 'absolute',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            pointerEvents: 'none',
            zIndex: '1',
            overflow: 'hidden',
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
            fontFamily: editorElement.style.fontFamily || 'monospace',
            fontSize: editorElement.style.fontSize || '16px',
            lineHeight: '1.8',
            padding: getComputedStyle(editorElement).padding,
            margin: '0',
            border: 'none',
            background: 'transparent',
            color: 'transparent'
        });
        
        // 插入到编辑器容器中
        const editorContainer = editorElement.parentElement;
        if (editorContainer) {
            editorContainer.style.position = 'relative';
            editorContainer.insertBefore(this.highlightLayer, editorElement);
        }
    }
    
    // 创建语法规则
    createSyntaxRules() {
        return [
            // 标题
            {
                name: 'heading',
                pattern: /^(#{1,6})\s+(.*)$/gm,
                replacement: '<span class="syntax-heading syntax-heading-$1">$&</span>',
                process: (match, hashes, content) => {
                    const level = hashes.length;
                    return `<span class="syntax-heading syntax-heading-${level}">${match}</span>`;
                }
            },
            
            // 粗体
            {
                name: 'bold',
                pattern: /(\*\*|__)(.*?)\1/g,
                replacement: '<span class="syntax-bold">$&</span>'
            },
            
            // 斜体
            {
                name: 'italic',
                pattern: /(\*|_)(.*?)\1/g,
                replacement: '<span class="syntax-italic">$&</span>'
            },
            
            // 删除线
            {
                name: 'strikethrough',
                pattern: /~~(.*?)~~/g,
                replacement: '<span class="syntax-strikethrough">$&</span>'
            },
            
            // 行内代码
            {
                name: 'inline-code',
                pattern: /`([^`]+)`/g,
                replacement: '<span class="syntax-code">$&</span>'
            },
            
            // 代码块
            {
                name: 'code-block',
                pattern: /```[\s\S]*?```/g,
                replacement: '<span class="syntax-code-block">$&</span>'
            },
            
            // 链接
            {
                name: 'link',
                pattern: /\[([^\]]+)\]\(([^)]+)\)/g,
                replacement: '<span class="syntax-link">$&</span>'
            },
            
            // 图片
            {
                name: 'image',
                pattern: /!\[([^\]]*)\]\(([^)]+)\)/g,
                replacement: '<span class="syntax-image">$&</span>'
            },
            
            // 引用
            {
                name: 'blockquote',
                pattern: /^>\s+(.*)$/gm,
                replacement: '<span class="syntax-blockquote">$&</span>'
            },
            
            // 无序列表
            {
                name: 'unordered-list',
                pattern: /^[\s]*[-*+]\s+(.*)$/gm,
                replacement: '<span class="syntax-list">$&</span>'
            },
            
            // 有序列表
            {
                name: 'ordered-list',
                pattern: /^[\s]*\d+\.\s+(.*)$/gm,
                replacement: '<span class="syntax-list">$&</span>'
            },
            
            // 水平线
            {
                name: 'horizontal-rule',
                pattern: /^[\s]*(-{3,}|\*{3,}|_{3,})[\s]*$/gm,
                replacement: '<span class="syntax-hr">$&</span>'
            },
            
            // 数学公式（行内）
            {
                name: 'math-inline',
                pattern: /\$([^$]+)\$/g,
                replacement: '<span class="syntax-math">$&</span>'
            },
            
            // 数学公式（块级）
            {
                name: 'math-block',
                pattern: /\$\$([\s\S]*?)\$\$/g,
                replacement: '<span class="syntax-math-block">$&</span>'
            },
            
            // 表格
            {
                name: 'table',
                pattern: /^\|.*\|$/gm,
                replacement: '<span class="syntax-table">$&</span>'
            },
            
            // HTML标签
            {
                name: 'html-tag',
                pattern: /<[^>]+>/g,
                replacement: '<span class="syntax-html">$&</span>'
            }
        ];
    }
    
    // 绑定事件
    bindEvents() {
        if (!this.editor) return;
        
        // 监听内容变化
        this.editor.on('content:change', this.debouncedHighlight);
        
        // 监听滚动
        this.editor.on('editor:scroll', this.syncScroll.bind(this));
        
        // 监听设置变化
        stateManager.onStateChange('settings', this.handleSettingsChange.bind(this));
        
        // 监听主题变化
        stateManager.onStateChange('theme.current', this.handleThemeChange.bind(this));
    }
    
    // 更新高亮
    updateHighlight() {
        if (!this.highlightLayer || !this.isEnabled) return;
        
        const content = this.editor.getContent();
        const highlightedContent = this.highlightContent(content);
        
        this.highlightLayer.innerHTML = highlightedContent;
        this.syncScroll();
        
        this.emit('highlight:updated');
    }
    
    // 高亮内容
    highlightContent(content) {
        if (!content) return '';
        
        let highlighted = this.escapeHtml(content);
        
        // 应用语法规则
        for (const rule of this.syntaxRules) {
            if (rule.process) {
                highlighted = highlighted.replace(rule.pattern, rule.process);
            } else {
                highlighted = highlighted.replace(rule.pattern, rule.replacement);
            }
        }
        
        // 添加换行符
        highlighted = highlighted.replace(/\n/g, '<br>');
        
        return highlighted;
    }
    
    // 转义HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // 同步滚动
    syncScroll() {
        if (!this.highlightLayer || !this.editor.textarea) return;
        
        const editorElement = this.editor.textarea;
        
        setStyle(this.highlightLayer, {
            transform: `translate(-${editorElement.scrollLeft}px, -${editorElement.scrollTop}px)`
        });
    }
    
    // 处理设置变化
    handleSettingsChange(event) {
        const { newValue } = event;
        
        if (this.highlightLayer) {
            setStyle(this.highlightLayer, {
                fontSize: newValue.fontSize + 'px',
                fontFamily: newValue.fontFamily
            });
        }
        
        this.updateHighlight();
    }
    
    // 处理主题变化
    handleThemeChange() {
        // 主题变化时重新应用高亮
        this.updateHighlight();
    }
    
    // 启用高亮
    enable() {
        this.isEnabled = true;
        if (this.highlightLayer) {
            setStyle(this.highlightLayer, { display: 'block' });
        }
        this.updateHighlight();
        this.emit('highlight:enabled');
    }
    
    // 禁用高亮
    disable() {
        this.isEnabled = false;
        if (this.highlightLayer) {
            setStyle(this.highlightLayer, { display: 'none' });
        }
        this.emit('highlight:disabled');
    }
    
    // 切换高亮
    toggle() {
        if (this.isEnabled) {
            this.disable();
        } else {
            this.enable();
        }
    }
    
    // 添加自定义规则
    addRule(rule) {
        if (rule.name && rule.pattern && rule.replacement) {
            this.syntaxRules.push(rule);
            this.updateHighlight();
            this.emit('rule:added', { rule });
        }
    }
    
    // 移除规则
    removeRule(name) {
        const index = this.syntaxRules.findIndex(rule => rule.name === name);
        if (index !== -1) {
            const removedRule = this.syntaxRules.splice(index, 1)[0];
            this.updateHighlight();
            this.emit('rule:removed', { rule: removedRule });
        }
    }
    
    // 获取所有规则
    getRules() {
        return [...this.syntaxRules];
    }
    
    // 清除所有规则
    clearRules() {
        this.syntaxRules = [];
        this.updateHighlight();
        this.emit('rules:cleared');
    }
    
    // 重置为默认规则
    resetRules() {
        this.syntaxRules = this.createSyntaxRules();
        this.updateHighlight();
        this.emit('rules:reset');
    }
    
    // 高亮特定范围
    highlightRange(start, end) {
        if (!this.highlightLayer) return;
        
        const content = this.editor.getContent();
        const beforeRange = content.substring(0, start);
        const rangeContent = content.substring(start, end);
        const afterRange = content.substring(end);
        
        const highlightedRange = this.highlightContent(rangeContent);
        const highlightedContent = 
            this.escapeHtml(beforeRange) +
            '<span class="syntax-highlight-range">' + highlightedRange + '</span>' +
            this.escapeHtml(afterRange);
        
        this.highlightLayer.innerHTML = highlightedContent.replace(/\n/g, '<br>');
    }
    
    // 清除范围高亮
    clearRangeHighlight() {
        this.updateHighlight();
    }
    
    // 获取高亮统计
    getHighlightStats() {
        const content = this.editor.getContent();
        const stats = {};
        
        for (const rule of this.syntaxRules) {
            const matches = content.match(rule.pattern);
            stats[rule.name] = matches ? matches.length : 0;
        }
        
        return stats;
    }
    
    // 查找语法元素
    findSyntaxElements(type) {
        const content = this.editor.getContent();
        const rule = this.syntaxRules.find(r => r.name === type);
        
        if (!rule) return [];
        
        const matches = [];
        let match;
        
        while ((match = rule.pattern.exec(content)) !== null) {
            matches.push({
                text: match[0],
                index: match.index,
                length: match[0].length,
                groups: match.slice(1)
            });
        }
        
        return matches;
    }
    
    // 销毁组件
    destroy() {
        if (this.editor) {
            this.editor.off('content:change', this.debouncedHighlight);
            this.editor.off('editor:scroll', this.syncScroll);
        }
        
        if (this.highlightLayer && this.highlightLayer.parentElement) {
            this.highlightLayer.parentElement.removeChild(this.highlightLayer);
        }
        
        this.removeAllListeners();
    }
}

// 默认导出
export default SyntaxHighlight;
