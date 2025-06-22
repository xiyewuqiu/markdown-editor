/*
 * 数学公式处理器
 * 处理Markdown中的数学公式渲染
 */

import { EventEmitter } from '../../utils/event-utils.js';
import { $, $$, addClass, removeClass } from '../../utils/dom-utils.js';
import { stateManager } from '../../core/state.js';

export class MathProcessor extends EventEmitter {
    constructor() {
        super();
        
        this.isKatexLoaded = false;
        this.mathQueue = [];
        
        this.init();
    }
    
    // 初始化数学处理器
    init() {
        this.loadKatex();
        this.bindEvents();
    }
    
    // 加载KaTeX库
    loadKatex() {
        if (typeof katex !== 'undefined') {
            this.isKatexLoaded = true;
            this.processQueue();
            return;
        }
        
        // 动态加载KaTeX
        const katexCSS = document.createElement('link');
        katexCSS.rel = 'stylesheet';
        katexCSS.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css';
        document.head.appendChild(katexCSS);
        
        const katexJS = document.createElement('script');
        katexJS.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js';
        katexJS.onload = () => {
            this.isKatexLoaded = true;
            this.processQueue();
            this.emit('katex:loaded');
        };
        katexJS.onerror = () => {
            console.error('Failed to load KaTeX');
            this.emit('katex:error');
        };
        document.head.appendChild(katexJS);
    }
    
    // 绑定事件
    bindEvents() {
        // 监听渲染完成事件
        document.addEventListener('render:complete', () => {
            this.processAllMath();
        });
    }
    
    // 处理所有数学公式
    processAllMath() {
        const container = $('.preview-panel') || document;
        
        // 处理行内数学公式
        this.processInlineMath(container);
        
        // 处理块级数学公式
        this.processBlockMath(container);
    }
    
    // 处理行内数学公式
    processInlineMath(container) {
        const content = container.innerHTML || container.textContent;
        if (!content) return;
        
        // 查找 $...$ 格式的数学公式
        const inlineMathRegex = /\$([^$\n]+)\$/g;
        let newContent = content.replace(inlineMathRegex, (match, math) => {
            const id = this.generateMathId();
            this.queueMathRender(id, math.trim(), false);
            return `<span class="math-inline" id="${id}"></span>`;
        });
        
        if (newContent !== content) {
            container.innerHTML = newContent;
        }
    }
    
    // 处理块级数学公式
    processBlockMath(container) {
        const content = container.innerHTML || container.textContent;
        if (!content) return;
        
        // 查找 $$...$$ 格式的数学公式
        const blockMathRegex = /\$\$([\s\S]*?)\$\$/g;
        let newContent = content.replace(blockMathRegex, (match, math) => {
            const id = this.generateMathId();
            this.queueMathRender(id, math.trim(), true);
            return `<div class="math-block" id="${id}"></div>`;
        });
        
        if (newContent !== content) {
            container.innerHTML = newContent;
        }
    }
    
    // 队列数学渲染
    queueMathRender(id, math, isBlock) {
        this.mathQueue.push({ id, math, isBlock });
        
        if (this.isKatexLoaded) {
            this.processQueue();
        }
    }
    
    // 处理渲染队列
    processQueue() {
        while (this.mathQueue.length > 0) {
            const { id, math, isBlock } = this.mathQueue.shift();
            this.renderMath(id, math, isBlock);
        }
    }
    
    // 渲染数学公式
    renderMath(id, math, isBlock) {
        const element = document.getElementById(id);
        if (!element || !this.isKatexLoaded) return;
        
        try {
            katex.render(math, element, {
                displayMode: isBlock,
                throwOnError: false,
                errorColor: '#cc0000',
                strict: false,
                trust: false,
                macros: {
                    "\\RR": "\\mathbb{R}",
                    "\\NN": "\\mathbb{N}",
                    "\\ZZ": "\\mathbb{Z}",
                    "\\QQ": "\\mathbb{Q}",
                    "\\CC": "\\mathbb{C}"
                }
            });
            
            // 添加成功类名
            addClass(element, 'math-rendered');
            
            // 添加复制功能
            this.addCopyButton(element, math);
            
            this.emit('math:rendered', { id, math, isBlock, element });
            
        } catch (error) {
            console.error('Math render error:', error);
            element.innerHTML = `<span class="math-error">数学公式错误: ${math}</span>`;
            addClass(element, 'math-error');
            
            this.emit('math:error', { id, math, error, element });
        }
    }
    
    // 添加复制按钮
    addCopyButton(element, math) {
        const copyBtn = document.createElement('button');
        copyBtn.className = 'math-copy-btn';
        copyBtn.innerHTML = '<i class="fa fa-copy"></i>';
        copyBtn.title = '复制数学公式';
        copyBtn.style.cssText = `
            position: absolute;
            top: 5px;
            right: 5px;
            background: rgba(0,0,0,0.7);
            color: white;
            border: none;
            border-radius: 3px;
            padding: 4px 6px;
            font-size: 12px;
            cursor: pointer;
            opacity: 0;
            transition: opacity 0.2s;
            z-index: 10;
        `;
        
        copyBtn.onclick = () => {
            this.copyMathToClipboard(math);
        };
        
        // 设置容器为相对定位
        element.style.position = 'relative';
        element.appendChild(copyBtn);
        
        // 悬停显示复制按钮
        element.addEventListener('mouseenter', () => {
            copyBtn.style.opacity = '1';
        });
        
        element.addEventListener('mouseleave', () => {
            copyBtn.style.opacity = '0';
        });
    }
    
    // 复制数学公式到剪贴板
    copyMathToClipboard(math) {
        const textToCopy = `$${math}$`;
        
        if (navigator.clipboard) {
            navigator.clipboard.writeText(textToCopy).then(() => {
                this.showCopyNotification('数学公式已复制到剪贴板');
            }).catch(err => {
                console.error('复制失败:', err);
                this.fallbackCopy(textToCopy);
            });
        } else {
            this.fallbackCopy(textToCopy);
        }
    }
    
    // 备用复制方法
    fallbackCopy(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
            this.showCopyNotification('数学公式已复制到剪贴板');
        } catch (err) {
            console.error('复制失败:', err);
            this.showCopyNotification('复制失败，请手动复制', 'error');
        }
        
        document.body.removeChild(textArea);
    }
    
    // 显示复制通知
    showCopyNotification(message, type = 'success') {
        stateManager.addNotification({
            message,
            type,
            duration: 2000
        });
    }
    
    // 生成数学公式ID
    generateMathId() {
        return 'math-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }
    
    // 插入数学公式
    insertMath(type = 'inline') {
        const isBlock = type === 'block';
        const placeholder = isBlock ? '$$\n\n$$' : '$  $';
        
        this.emit('math:insert', { type, placeholder });
        
        // 显示数学公式类型选择器
        this.showMathTypeSelector();
    }
    
    // 显示数学公式类型选择器
    showMathTypeSelector() {
        // 创建选择器对话框
        const selector = document.createElement('div');
        selector.className = 'math-type-selector';
        selector.innerHTML = `
            <h3>选择数学公式类型</h3>
            <div class="math-type-buttons">
                <button class="math-type-btn" data-type="inline">
                    <i class="fa fa-dollar-sign"></i>
                    行内公式
                </button>
                <button class="math-type-btn" data-type="block">
                    <i class="fa fa-square-root-alt"></i>
                    块级公式
                </button>
            </div>
        `;
        
        // 添加到页面
        document.body.appendChild(selector);
        addClass(selector, 'show');
        
        // 绑定按钮事件
        const buttons = $$('.math-type-btn', selector);
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                const type = btn.getAttribute('data-type');
                this.insertMathByType(type);
                this.closeMathTypeSelector(selector);
            });
        });
        
        // 点击外部关闭
        const closeHandler = (e) => {
            if (!selector.contains(e.target)) {
                this.closeMathTypeSelector(selector);
                document.removeEventListener('click', closeHandler);
            }
        };
        
        setTimeout(() => {
            document.addEventListener('click', closeHandler);
        }, 100);
        
        // ESC键关闭
        const keyHandler = (e) => {
            if (e.key === 'Escape') {
                this.closeMathTypeSelector(selector);
                document.removeEventListener('keydown', keyHandler);
            }
        };
        
        document.addEventListener('keydown', keyHandler);
    }
    
    // 根据类型插入数学公式
    insertMathByType(type) {
        const isBlock = type === 'block';
        const placeholder = isBlock ? '$$\nE = mc^2\n$$' : '$E = mc^2$';
        
        this.emit('math:insert-type', { type, placeholder, isBlock });
    }
    
    // 关闭数学公式类型选择器
    closeMathTypeSelector(selector) {
        removeClass(selector, 'show');
        setTimeout(() => {
            if (selector.parentNode) {
                selector.parentNode.removeChild(selector);
            }
        }, 300);
    }
    
    // 预览数学公式
    previewMath(math, isBlock = false) {
        if (!this.isKatexLoaded) {
            return '数学公式预览不可用';
        }
        
        try {
            return katex.renderToString(math, {
                displayMode: isBlock,
                throwOnError: false,
                errorColor: '#cc0000'
            });
        } catch (error) {
            return `<span class="math-error">公式错误: ${error.message}</span>`;
        }
    }
    
    // 验证数学公式
    validateMath(math) {
        if (!this.isKatexLoaded) {
            return { valid: false, error: 'KaTeX未加载' };
        }
        
        try {
            katex.renderToString(math, { throwOnError: true });
            return { valid: true };
        } catch (error) {
            return { valid: false, error: error.message };
        }
    }
    
    // 获取数学公式统计
    getMathStats() {
        const inlineMath = $$('.math-inline.math-rendered');
        const blockMath = $$('.math-block.math-rendered');
        const errorMath = $$('.math-error');
        
        return {
            inline: inlineMath.length,
            block: blockMath.length,
            errors: errorMath.length,
            total: inlineMath.length + blockMath.length
        };
    }
    
    // 重新渲染所有数学公式
    reRenderAll() {
        const mathElements = $$('.math-inline, .math-block');
        mathElements.forEach(element => {
            removeClass(element, 'math-rendered', 'math-error');
            element.innerHTML = '';
        });
        
        this.processAllMath();
    }
    
    // 销毁处理器
    destroy() {
        this.mathQueue = [];
        this.removeAllListeners();
    }
}

// 默认导出
export default MathProcessor;
