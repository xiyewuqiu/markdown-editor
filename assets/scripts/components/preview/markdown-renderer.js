/*
 * Markdown渲染器组件
 * 将Markdown文本渲染为HTML预览
 */

import { EventEmitter } from '../../utils/event-utils.js';
import { $, addClass, removeClass, setStyle } from '../../utils/dom-utils.js';
import { stateManager } from '../../core/state.js';
import { APP_CONFIG } from '../../core/config.js';
import { debounce } from '../../utils/event-utils.js';

export class MarkdownRenderer extends EventEmitter {
    constructor(container) {
        super();
        
        this.container = typeof container === 'string' ? $(container) : container;
        this.previewElement = null;
        
        // 渲染配置
        this.config = {
            ...APP_CONFIG.preview,
            breaks: true,
            linkify: true,
            typographer: true,
            highlight: true
        };
        
        // 防抖渲染
        this.debouncedRender = debounce(this.render.bind(this), 300);
        
        // 渲染规则
        this.renderRules = this.createRenderRules();
        
        this.init();
    }
    
    // 初始化渲染器
    init() {
        if (!this.container) {
            console.error('MarkdownRenderer container not found');
            return;
        }
        
        this.createPreviewElement();
        this.bindEvents();
        this.render();
    }
    
    // 创建预览元素
    createPreviewElement() {
        this.previewElement = $('.markdown-body', this.container);
        
        if (!this.previewElement) {
            this.previewElement = document.createElement('div');
            this.previewElement.className = 'markdown-body';
            this.container.appendChild(this.previewElement);
        }
        
        // 设置属性
        this.previewElement.setAttribute('role', 'document');
        this.previewElement.setAttribute('aria-live', 'polite');
    }
    
    // 绑定事件
    bindEvents() {
        // 监听内容变化
        stateManager.onStateChange('editor.content', this.debouncedRender);
        
        // 监听设置变化
        stateManager.onStateChange('settings', this.handleSettingsChange.bind(this));
        
        // 监听主题变化
        stateManager.onStateChange('theme.current', this.handleThemeChange.bind(this));
        
        // 预览元素点击事件
        this.previewElement.addEventListener('click', this.handleClick.bind(this));
        
        // 预览元素滚动事件
        this.previewElement.addEventListener('scroll', this.handleScroll.bind(this));
    }
    
    // 创建渲染规则
    createRenderRules() {
        return {
            // 标题渲染
            heading: (text, level) => {
                const id = this.generateId(text);
                return `<h${level} id="${id}" class="heading-${level}">${text}</h${level}>`;
            },
            
            // 段落渲染
            paragraph: (text) => {
                return `<p>${text}</p>`;
            },
            
            // 链接渲染
            link: (href, title, text) => {
                const titleAttr = title ? ` title="${title}"` : '';
                const target = href.startsWith('http') ? ' target="_blank" rel="noopener noreferrer"' : '';
                return `<a href="${href}"${titleAttr}${target}>${text}</a>`;
            },
            
            // 图片渲染
            image: (href, title, text) => {
                const titleAttr = title ? ` title="${title}"` : '';
                const altAttr = text ? ` alt="${text}"` : '';
                return `<img src="${href}"${altAttr}${titleAttr} loading="lazy">`;
            },
            
            // 代码块渲染
            code: (code, language) => {
                const langClass = language ? ` class="language-${language}"` : '';
                const highlightedCode = this.highlightCode(code, language);
                return `<pre><code${langClass}>${highlightedCode}</code></pre>`;
            },
            
            // 行内代码渲染
            codespan: (code) => {
                return `<code>${this.escapeHtml(code)}</code>`;
            },
            
            // 引用块渲染
            blockquote: (quote) => {
                return `<blockquote>${quote}</blockquote>`;
            },
            
            // 列表渲染
            list: (body, ordered) => {
                const tag = ordered ? 'ol' : 'ul';
                return `<${tag}>${body}</${tag}>`;
            },
            
            // 列表项渲染
            listitem: (text, task, checked) => {
                if (task) {
                    const checkedAttr = checked ? ' checked' : '';
                    return `<li class="task-list-item"><input type="checkbox"${checkedAttr} disabled> ${text}</li>`;
                }
                return `<li>${text}</li>`;
            },
            
            // 表格渲染
            table: (header, body) => {
                return `<table><thead>${header}</thead><tbody>${body}</tbody></table>`;
            },
            
            // 表格行渲染
            tablerow: (content) => {
                return `<tr>${content}</tr>`;
            },
            
            // 表格单元格渲染
            tablecell: (content, flags) => {
                const tag = flags.header ? 'th' : 'td';
                const align = flags.align ? ` style="text-align: ${flags.align}"` : '';
                return `<${tag}${align}>${content}</${tag}>`;
            },
            
            // 水平线渲染
            hr: () => {
                return '<hr>';
            },
            
            // 强调渲染
            strong: (text) => {
                return `<strong>${text}</strong>`;
            },
            
            // 斜体渲染
            em: (text) => {
                return `<em>${text}</em>`;
            },
            
            // 删除线渲染
            del: (text) => {
                return `<del>${text}</del>`;
            }
        };
    }
    
    // 渲染Markdown
    render() {
        const content = stateManager.getState('editor.content') || '';
        
        try {
            const html = this.parseMarkdown(content);
            this.previewElement.innerHTML = html;
            
            // 处理数学公式
            this.processMath();
            
            // 处理代码高亮
            this.processCodeHighlight();
            
            // 处理任务列表
            this.processTaskLists();
            
            // 处理链接
            this.processLinks();
            
            this.emit('render:complete', { html });
            
        } catch (error) {
            console.error('Markdown render error:', error);
            this.previewElement.innerHTML = `<div class="render-error">渲染错误: ${error.message}</div>`;
            this.emit('render:error', { error });
        }
    }
    
    // 解析Markdown（简化版实现）
    parseMarkdown(content) {
        if (!content) return '';
        
        let html = content;
        
        // 转义HTML
        html = this.escapeHtml(html);
        
        // 处理代码块（先处理，避免被其他规则影响）
        html = this.processCodeBlocks(html);
        
        // 处理标题
        html = html.replace(/^(#{1,6})\s+(.*)$/gm, (match, hashes, text) => {
            const level = hashes.length;
            return this.renderRules.heading(text.trim(), level);
        });
        
        // 处理水平线
        html = html.replace(/^[\s]*(-{3,}|\*{3,}|_{3,})[\s]*$/gm, () => {
            return this.renderRules.hr();
        });
        
        // 处理引用
        html = html.replace(/^>\s+(.*)$/gm, (match, text) => {
            return this.renderRules.blockquote(text);
        });
        
        // 处理列表
        html = this.processLists(html);
        
        // 处理表格
        html = this.processTables(html);
        
        // 处理行内元素
        html = this.processInlineElements(html);
        
        // 处理段落
        html = this.processParagraphs(html);
        
        return html;
    }
    
    // 处理代码块
    processCodeBlocks(html) {
        return html.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, language, code) => {
            return this.renderRules.code(code.trim(), language);
        });
    }
    
    // 处理列表
    processLists(html) {
        // 简化的列表处理
        const lines = html.split('\n');
        const result = [];
        let inList = false;
        let listType = null;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const unorderedMatch = line.match(/^[\s]*[-*+]\s+(.*)$/);
            const orderedMatch = line.match(/^[\s]*\d+\.\s+(.*)$/);
            const taskMatch = line.match(/^[\s]*[-*+]\s+\[([ x])\]\s+(.*)$/);
            
            if (unorderedMatch || orderedMatch || taskMatch) {
                if (!inList) {
                    inList = true;
                    listType = orderedMatch ? 'ordered' : 'unordered';
                    result.push(listType === 'ordered' ? '<ol>' : '<ul>');
                }
                
                if (taskMatch) {
                    const checked = taskMatch[1] === 'x';
                    result.push(this.renderRules.listitem(taskMatch[2], true, checked));
                } else {
                    const text = unorderedMatch ? unorderedMatch[1] : orderedMatch[1];
                    result.push(this.renderRules.listitem(text, false, false));
                }
            } else {
                if (inList) {
                    result.push(listType === 'ordered' ? '</ol>' : '</ul>');
                    inList = false;
                    listType = null;
                }
                result.push(line);
            }
        }
        
        if (inList) {
            result.push(listType === 'ordered' ? '</ol>' : '</ul>');
        }
        
        return result.join('\n');
    }
    
    // 处理表格
    processTables(html) {
        const lines = html.split('\n');
        const result = [];
        let inTable = false;
        let headerProcessed = false;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            if (line.startsWith('|') && line.endsWith('|')) {
                if (!inTable) {
                    inTable = true;
                    headerProcessed = false;
                    result.push('<table>');
                }
                
                const cells = line.split('|').slice(1, -1).map(cell => cell.trim());
                
                if (!headerProcessed && i + 1 < lines.length && 
                    lines[i + 1].trim().match(/^\|[\s]*:?-+:?[\s]*(\|[\s]*:?-+:?[\s]*)*\|$/)) {
                    // 这是表头
                    result.push('<thead>');
                    result.push('<tr>');
                    cells.forEach(cell => {
                        result.push(`<th>${cell}</th>`);
                    });
                    result.push('</tr>');
                    result.push('</thead>');
                    result.push('<tbody>');
                    headerProcessed = true;
                    i++; // 跳过分隔行
                } else if (headerProcessed) {
                    // 这是表格数据行
                    result.push('<tr>');
                    cells.forEach(cell => {
                        result.push(`<td>${cell}</td>`);
                    });
                    result.push('</tr>');
                }
            } else {
                if (inTable) {
                    result.push('</tbody>');
                    result.push('</table>');
                    inTable = false;
                }
                result.push(line);
            }
        }
        
        if (inTable) {
            result.push('</tbody>');
            result.push('</table>');
        }
        
        return result.join('\n');
    }
    
    // 处理行内元素
    processInlineElements(html) {
        // 链接
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, href) => {
            return this.renderRules.link(href, null, text);
        });
        
        // 图片
        html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, src) => {
            return this.renderRules.image(src, null, alt);
        });
        
        // 粗体
        html = html.replace(/\*\*(.*?)\*\*/g, (match, text) => {
            return this.renderRules.strong(text);
        });
        
        // 斜体
        html = html.replace(/\*(.*?)\*/g, (match, text) => {
            return this.renderRules.em(text);
        });
        
        // 删除线
        html = html.replace(/~~(.*?)~~/g, (match, text) => {
            return this.renderRules.del(text);
        });
        
        // 行内代码
        html = html.replace(/`([^`]+)`/g, (match, code) => {
            return this.renderRules.codespan(code);
        });
        
        return html;
    }
    
    // 处理段落
    processParagraphs(html) {
        const lines = html.split('\n');
        const result = [];
        let inParagraph = false;
        let paragraphLines = [];
        
        for (const line of lines) {
            const trimmed = line.trim();
            
            if (trimmed === '') {
                if (inParagraph) {
                    result.push(this.renderRules.paragraph(paragraphLines.join(' ')));
                    inParagraph = false;
                    paragraphLines = [];
                }
                result.push('');
            } else if (trimmed.startsWith('<')) {
                // HTML标签，不包装在段落中
                if (inParagraph) {
                    result.push(this.renderRules.paragraph(paragraphLines.join(' ')));
                    inParagraph = false;
                    paragraphLines = [];
                }
                result.push(line);
            } else {
                if (!inParagraph) {
                    inParagraph = true;
                }
                paragraphLines.push(trimmed);
            }
        }
        
        if (inParagraph) {
            result.push(this.renderRules.paragraph(paragraphLines.join(' ')));
        }
        
        return result.join('\n');
    }
    
    // 处理数学公式
    processMath() {
        if (!this.config.mathSupport) return;
        
        // 这里可以集成KaTeX或MathJax
        const mathElements = this.previewElement.querySelectorAll('.math');
        mathElements.forEach(element => {
            // 数学公式渲染逻辑
            this.emit('math:render', { element });
        });
    }
    
    // 处理代码高亮
    processCodeHighlight() {
        if (!this.config.highlight) return;
        
        const codeBlocks = this.previewElement.querySelectorAll('pre code');
        codeBlocks.forEach(block => {
            // 代码高亮逻辑
            this.emit('code:highlight', { block });
        });
    }
    
    // 处理任务列表
    processTaskLists() {
        const taskItems = this.previewElement.querySelectorAll('.task-list-item input[type="checkbox"]');
        taskItems.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                e.preventDefault(); // 阻止默认行为，因为是只读的
            });
        });
    }
    
    // 处理链接
    processLinks() {
        const links = this.previewElement.querySelectorAll('a[href^="http"]');
        links.forEach(link => {
            link.setAttribute('target', '_blank');
            link.setAttribute('rel', 'noopener noreferrer');
        });
    }
    
    // 代码高亮（简化版）
    highlightCode(code, language) {
        // 这里可以集成Prism.js或highlight.js
        return this.escapeHtml(code);
    }
    
    // 转义HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // 生成ID
    generateId(text) {
        return text.toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .trim();
    }
    
    // 处理点击事件
    handleClick(event) {
        const target = event.target;
        
        // 处理标题点击
        if (target.matches('h1, h2, h3, h4, h5, h6')) {
            this.emit('heading:click', { 
                element: target, 
                id: target.id,
                text: target.textContent 
            });
        }
        
        // 处理链接点击
        if (target.matches('a[href]')) {
            this.emit('link:click', { 
                element: target, 
                href: target.href,
                text: target.textContent 
            });
        }
    }
    
    // 处理滚动事件
    handleScroll(event) {
        this.emit('preview:scroll', {
            scrollTop: event.target.scrollTop,
            scrollLeft: event.target.scrollLeft
        });
    }
    
    // 处理设置变化
    handleSettingsChange(event) {
        // 重新渲染以应用新设置
        this.render();
    }
    
    // 处理主题变化
    handleThemeChange() {
        // 主题变化时重新处理代码高亮
        this.processCodeHighlight();
    }
    
    // 滚动到元素
    scrollToElement(selector) {
        const element = this.previewElement.querySelector(selector);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
    
    // 获取目录
    getToc() {
        const headings = this.previewElement.querySelectorAll('h1, h2, h3, h4, h5, h6');
        return Array.from(headings).map(heading => ({
            level: parseInt(heading.tagName.charAt(1)),
            text: heading.textContent,
            id: heading.id,
            element: heading
        }));
    }
    
    // 销毁组件
    destroy() {
        if (this.previewElement) {
            this.previewElement.removeEventListener('click', this.handleClick);
            this.previewElement.removeEventListener('scroll', this.handleScroll);
        }
        
        this.removeAllListeners();
    }
}

// 默认导出
export default MarkdownRenderer;
