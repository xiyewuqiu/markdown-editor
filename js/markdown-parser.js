// markdown-parser.js
// 封装marked.js和highlight.js，提供Markdown转HTML的函数

// --- KaTeX 数学公式扩展 ---
const katexExtension = {
    name: 'katex',
    extensions: [
        {
            name: 'inlineKatex',
            level: 'inline',
            start(src) { return src.indexOf('$'); },
            tokenizer(src) {
                const match = src.match(/^\$([^$\n]+?)\$/);
                if (match) {
                    return {
                        type: 'inlineKatex',
                        raw: match[0],
                        text: match[1]
                    };
                }
            },
            renderer(token) {
                try {
                    if (typeof window.katex === 'undefined') {
                        console.warn('KaTeX未加载，返回原始公式');
                        return `<span class="math-error">$${token.text}$</span>`;
                    }
                    const rendered = window.katex.renderToString(token.text, {
                        displayMode: false,
                        throwOnError: false,
                        errorColor: '#cc0000',
                        strict: false
                    });
                    return `<span class="math-inline">${rendered}</span>`;
                } catch (error) {
                    console.warn('行内公式渲染错误:', token.text, error);
                    return `<span class="math-error" title="${error.message}">$${token.text}$</span>`;
                }
            }
        },
        {
            name: 'blockKatex',
            level: 'block',
            start(src) { return src.indexOf('$$'); },
            tokenizer(src) {
                const match = src.match(/^\s*\$\$([\s\S]*?)\$\$\s*(\n|$)/);
                if (match) {
                    return {
                        type: 'blockKatex',
                        raw: match[0],
                        text: match[1].trim()
                    };
                }
            },
            renderer(token) {
                try {
                    if (typeof window.katex === 'undefined') {
                        console.warn('KaTeX未加载，返回原始公式');
                        return `<div class="math-error">$$${token.text}$$</div>`;
                    }
                    const rendered = window.katex.renderToString(token.text, {
                        displayMode: true,
                        throwOnError: false,
                        errorColor: '#cc0000',
                        strict: false
                    });
                    return `<div class="math-block">${rendered}</div>`;
                } catch (error) {
                    console.warn('块级公式渲染错误:', token.text, error);
                    return `<div class="math-error" title="${error.message}">$$${token.text}$$</div>`;
                }
            }
        }
    ]
};

/**
 * 将Markdown文本解析为HTML
 * @param {string} markdown - Markdown源文本
 * @returns {string} HTML字符串
 */
function parseMarkdown(markdown) {
    // 预处理任务列表
    markdown = preprocessTaskLists(markdown);

    // 配置marked
    marked.setOptions({
        breaks: true, // 支持换行
        gfm: true,    // GitHub风格Markdown
        highlight: function(code, lang) {
            // 使用highlight.js进行代码高亮
            if (lang && hljs.getLanguage(lang)) {
                return hljs.highlight(code, { language: lang }).value;
            } else {
                return hljs.highlightAuto(code).value;
            }
        }
    });

    // 使用KaTeX扩展（如果KaTeX已加载）
    if (typeof window.katex !== 'undefined') {
        marked.use(katexExtension);
        console.log('KaTeX扩展已启用');
    } else {
        console.warn('KaTeX未加载，跳过数学公式扩展');
    }

    let html = marked.parse(markdown);

    // 后处理任务列表
    html = postprocessTaskLists(html);

    // 添加代码块复制按钮
    html = addCopyButtons(html);

    return html;
}

/**
 * 预处理任务列表，将 - [ ] 和 - [x] 转换为特殊标记
 */
function preprocessTaskLists(markdown) {
    return markdown.replace(/^(\s*)-\s+\[([ x])\]\s+(.+)$/gm, function(match, indent, checked, text) {
        const isChecked = checked.toLowerCase() === 'x';
        return `${indent}- __TASK_${isChecked ? 'CHECKED' : 'UNCHECKED'}__${text}`;
    });
}

/**
 * 后处理任务列表，将特殊标记转换为HTML复选框
 */
function postprocessTaskLists(html) {
    // 处理未选中的任务
    html = html.replace(/<li>__TASK_UNCHECKED__(.+?)<\/li>/g,
        '<li class="task-list-item"><input type="checkbox" disabled> $1</li>');

    // 处理已选中的任务
    html = html.replace(/<li>__TASK_CHECKED__(.+?)<\/li>/g,
        '<li class="task-list-item"><input type="checkbox" checked disabled> $1</li>');

    return html;
}

/**
 * 为代码块添加复制按钮
 */
function addCopyButtons(html) {
    return html.replace(/<pre><code([^>]*)>([\s\S]*?)<\/code><\/pre>/g, function(match, attrs, code) {
        const copyId = 'copy-' + Math.random().toString(36).substr(2, 9);
        return `<pre><code${attrs}>${code}</code><button class="copy-btn" onclick="copyCode('${copyId}')">复制</button></pre>`;
    });
}

// 全局复制函数
window.copyCode = function(elementId) {
    const codeElement = event.target.previousElementSibling;
    const text = codeElement.textContent;

    navigator.clipboard.writeText(text).then(function() {
        const btn = event.target;
        const originalText = btn.textContent;
        btn.textContent = '已复制!';
        btn.style.background = 'rgba(0,255,0,0.2)';

        setTimeout(function() {
            btn.textContent = originalText;
            btn.style.background = 'rgba(255,255,255,0.1)';
        }, 2000);
    }).catch(function() {
        // 降级方案
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);

        const btn = event.target;
        const originalText = btn.textContent;
        btn.textContent = '已复制!';
        setTimeout(function() {
            btn.textContent = originalText;
        }, 2000);
    });
};

// 数学公式处理现在通过marked扩展系统完成，不再需要单独的预处理和后处理函数