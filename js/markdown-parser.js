// markdown-parser.js
// 封装marked.js和highlight.js，提供Markdown转HTML的函数

/**
 * 将Markdown文本解析为HTML
 * @param {string} markdown - Markdown源文本
 * @returns {string} HTML字符串
 */
function parseMarkdown(markdown) {
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
    return marked.parse(markdown);
} 