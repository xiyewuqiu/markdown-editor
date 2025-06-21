// app.js
// Markdown编辑器主逻辑，包含实时预览、主题切换、文件操作、快捷键、状态管理等

// DOM元素获取
const editor = document.getElementById('editor');
const preview = document.getElementById('preview');
const lineNumbers = document.getElementById('line-numbers');
const statusText = document.getElementById('status-text');
const statusWords = document.getElementById('status-words');
const statusLines = document.getElementById('status-lines');
const statusCursor = document.getElementById('status-cursor');
const statusFilename = document.getElementById('status-filename');
const themeBtn = document.getElementById('theme-btn');
const newBtn = document.getElementById('new-btn');
const saveBtn = document.getElementById('save-btn');
const exportHtmlBtn = document.getElementById('export-html-btn');
const openBtn = document.getElementById('open-btn');
const fileInput = document.getElementById('file-input');
const viewToggleBtn = document.getElementById('view-toggle-btn');
const editorPanel = document.querySelector('.editor-panel');
const previewPanel = document.querySelector('.preview-panel');

// 编辑工具栏按钮
const selectAllBtn = document.getElementById('select-all-btn');
const copyBtn = document.getElementById('copy-btn');
const cutBtn = document.getElementById('cut-btn');
const pasteBtn = document.getElementById('paste-btn');

// 格式化工具栏按钮
const boldBtn = document.getElementById('bold-btn');
const italicBtn = document.getElementById('italic-btn');
const strikethroughBtn = document.getElementById('strikethrough-btn');
const codeBtn = document.getElementById('code-btn');
const codeblockBtn = document.getElementById('codeblock-btn');
const headingBtn = document.getElementById('heading-btn');
const linkBtn = document.getElementById('link-btn');
const imageBtn = document.getElementById('image-btn');
const tableBtn = document.getElementById('table-btn');
const listBtn = document.getElementById('list-btn');
const quoteBtn = document.getElementById('quote-btn');
const hrBtn = document.getElementById('hr-btn');
const fullscreenBtn = document.getElementById('fullscreen-btn');

// 上下文菜单
const contextMenu = document.getElementById('context-menu');

// 应用状态
let appState = {
    content: '',
    theme: localStorage.getItem('md-theme') || 'light',
    view: localStorage.getItem('md-view') || 'split', // split/editor/preview
    filename: '未命名.md',
    undoStack: [],
    redoStack: [],
    isFullscreen: false
};

// 工具栏功能函数
function insertText(before, after = '', placeholder = '') {
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const selectedText = editor.value.substring(start, end);
    const text = selectedText || placeholder;
    const newText = before + text + after;

    editor.value = editor.value.substring(0, start) + newText + editor.value.substring(end);

    // 设置光标位置
    if (selectedText) {
        editor.selectionStart = start;
        editor.selectionEnd = start + newText.length;
    } else {
        const cursorPos = start + before.length + text.length;
        editor.selectionStart = editor.selectionEnd = cursorPos;
    }

    editor.focus();
    pushUndoStack();
    render();
}

function insertAtLineStart(prefix) {
    const start = editor.selectionStart;
    const lines = editor.value.split('\n');
    let lineStart = 0;
    let currentLine = 0;

    // 找到当前行
    for (let i = 0; i < lines.length; i++) {
        if (lineStart + lines[i].length >= start) {
            currentLine = i;
            break;
        }
        lineStart += lines[i].length + 1;
    }

    // 在行首插入前缀
    lines[currentLine] = prefix + lines[currentLine];
    editor.value = lines.join('\n');

    // 调整光标位置
    editor.selectionStart = editor.selectionEnd = start + prefix.length;
    editor.focus();
    pushUndoStack();
    render();
}

// 编辑功能
function selectAll() {
    editor.select();
    editor.focus();
    showNotification('✅ 已全选文本', 'success');
}

function copyText() {
    const selectedText = editor.value.substring(editor.selectionStart, editor.selectionEnd);
    if (selectedText) {
        navigator.clipboard.writeText(selectedText).then(() => {
            showNotification('📋 已复制选中文本', 'success');
        }).catch(() => {
            // 降级方案
            const textArea = document.createElement('textarea');
            textArea.value = selectedText;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            showNotification('📋 已复制选中文本', 'success');
        });
    } else {
        showNotification('⚠️ 请先选择要复制的文本', 'error');
    }
}

function cutText() {
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const selectedText = editor.value.substring(start, end);

    if (selectedText) {
        navigator.clipboard.writeText(selectedText).then(() => {
            editor.value = editor.value.substring(0, start) + editor.value.substring(end);
            editor.selectionStart = editor.selectionEnd = start;
            editor.focus();
            pushUndoStack();
            render();
            showNotification('✂️ 已剪切选中文本', 'success');
        }).catch(() => {
            // 降级方案
            const textArea = document.createElement('textarea');
            textArea.value = selectedText;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);

            editor.value = editor.value.substring(0, start) + editor.value.substring(end);
            editor.selectionStart = editor.selectionEnd = start;
            editor.focus();
            pushUndoStack();
            render();
            showNotification('✂️ 已剪切选中文本', 'success');
        });
    } else {
        showNotification('⚠️ 请先选择要剪切的文本', 'error');
    }
}

function pasteText() {
    navigator.clipboard.readText().then(text => {
        const start = editor.selectionStart;
        const end = editor.selectionEnd;
        editor.value = editor.value.substring(0, start) + text + editor.value.substring(end);
        editor.selectionStart = editor.selectionEnd = start + text.length;
        editor.focus();
        pushUndoStack();
        render();
        showNotification('📄 已粘贴文本', 'success');
    }).catch(() => {
        showNotification('⚠️ 无法访问剪贴板，请使用 Ctrl+V', 'error');
    });
}

// 格式化功能
function makeBold() {
    insertText('**', '**', '粗体文本');
}

function makeItalic() {
    insertText('*', '*', '斜体文本');
}

function makeStrikethrough() {
    insertText('~~', '~~', '删除线文本');
}

function makeCode() {
    insertText('`', '`', '代码');
}

function makeCodeBlock() {
    insertText('```\n', '\n```', '代码块');
}

function makeHeading() {
    insertAtLineStart('# ');
}

function makeLink() {
    const url = prompt('请输入链接地址:', 'https://');
    if (url) {
        insertText('[', `](${url})`, '链接文本');
    }
}

function makeImage() {
    const url = prompt('请输入图片地址:', 'https://');
    if (url) {
        insertText('![', `](${url})`, '图片描述');
    }
}

function makeTable() {
    const table = `| 列1 | 列2 | 列3 |
| --- | --- | --- |
| 行1 | 数据 | 数据 |
| 行2 | 数据 | 数据 |
`;
    insertText('\n', '', table);
}

function makeList() {
    // 检测是否按住Shift键来决定插入任务列表还是普通列表
    const isTaskList = event && event.shiftKey;
    if (isTaskList) {
        insertAtLineStart('- [ ] ');
    } else {
        insertAtLineStart('- ');
    }
}

function makeQuote() {
    insertAtLineStart('> ');
}

function makeHr() {
    insertText('\n---\n', '', '');
}

// 全屏模式切换
function toggleFullscreen() {
    const body = document.body;
    if (!appState.isFullscreen) {
        body.classList.add('fullscreen');
        fullscreenBtn.innerHTML = '<i class="fa fa-compress"></i>';
        fullscreenBtn.title = '退出全屏';
        appState.isFullscreen = true;
    } else {
        body.classList.remove('fullscreen');
        fullscreenBtn.innerHTML = '<i class="fa fa-expand"></i>';
        fullscreenBtn.title = '全屏模式';
        appState.isFullscreen = false;
    }
}

// 主题切换
function setTheme(theme) {
    // 添加切换动画
    document.body.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';

    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('md-theme', theme);

    // 切换highlight.js主题
    const hljsTheme = document.getElementById('hljs-theme');
    if (theme === 'dark') {
        hljsTheme.href = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/styles/github-dark.min.css';
        themeBtn.innerHTML = '<i class="fa fa-sun"></i> 浅色';
        showNotification('🌙 已切换到深色主题', 'success');
    } else {
        hljsTheme.href = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/styles/github.min.css';
        themeBtn.innerHTML = '<i class="fa fa-moon"></i> 深色';
        showNotification('☀️ 已切换到浅色主题', 'success');
    }

    // 重置过渡效果
    setTimeout(() => {
        document.body.style.transition = '';
    }, 500);
}

// 显示通知
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `${type}-indicator`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOutToRight 0.3s ease-out forwards';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 2000);
}

// 视图切换
function setView(view) {
    if (view === 'editor') {
        editorPanel.style.display = 'flex';
        previewPanel.style.display = 'none';
    } else if (view === 'preview') {
        editorPanel.style.display = 'none';
        previewPanel.style.display = 'flex';
    } else {
        editorPanel.style.display = 'flex';
        previewPanel.style.display = 'flex';
    }
    appState.view = view;
    localStorage.setItem('md-view', view);
}

// 更新行号显示
function updateLineNumbers() {
    const lines = editor.value.split('\n');
    const lineCount = lines.length;

    // 生成行号HTML
    let lineNumbersHTML = '';
    for (let i = 1; i <= lineCount; i++) {
        lineNumbersHTML += i + '\n';
    }

    lineNumbers.textContent = lineNumbersHTML;

    // 同步滚动位置
    syncLineNumbersScroll();
}

// 同步行号容器的滚动位置
function syncLineNumbersScroll() {
    lineNumbers.scrollTop = editor.scrollTop;
}

// 实时渲染Markdown
function render() {
    const md = editor.value;
    preview.innerHTML = parseMarkdown(md);
    updateStatusBar(md);
    updateLineNumbers();
    appState.content = md;
    autoSave();
}

// 更新状态栏信息
function updateStatusBar(text) {
    const charCount = text.length;
    const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
    const lineCount = text.split('\n').length;

    // 获取光标位置和选择信息
    const cursorPos = editor.selectionStart;
    const selectionEnd = editor.selectionEnd;
    const textBeforeCursor = text.substring(0, cursorPos);
    const line = textBeforeCursor.split('\n').length;
    const column = textBeforeCursor.split('\n').pop().length + 1;

    // 检查是否有选中文本
    const hasSelection = cursorPos !== selectionEnd;
    const selectedLength = selectionEnd - cursorPos;

    statusText.textContent = `字数：${charCount}`;
    statusWords.textContent = `词数：${wordCount}`;
    statusLines.textContent = `行数：${lineCount}`;

    if (hasSelection) {
        statusCursor.textContent = `位置：${line}:${column} (已选择 ${selectedLength} 字符)`;
        statusCursor.style.color = 'var(--color-primary-solid)';
        statusCursor.style.fontWeight = '600';
    } else {
        statusCursor.textContent = `位置：${line}:${column}`;
        statusCursor.style.color = '';
        statusCursor.style.fontWeight = '';
    }

    statusFilename.textContent = appState.filename;
}

// 自动保存到localStorage
function autoSave() {
    localStorage.setItem('md-content', appState.content);
    localStorage.setItem('md-filename', appState.filename);
}

// 新建文档
function newDoc() {
    if (editor.value.trim() && !confirm('确定要新建文档？未保存内容将丢失。')) return;
    editor.value = '';
    appState.filename = '未命名.md';
    appState.undoStack = [];
    appState.redoStack = [];
    render();
}

// 保存为Markdown文件
function saveFile() {
    const blob = new Blob([editor.value], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = appState.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// 导出为HTML文件
function exportHtml() {
    const html = `<!DOCTYPE html><html lang=\"zh-CN\"><head><meta charset=\"UTF-8\"><title>${appState.filename.replace('.md','')}</title><link rel=\"stylesheet\" href=\"https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/styles/github.min.css\"></head><body class=\"markdown-body\">${parseMarkdown(editor.value)}</body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = appState.filename.replace('.md', '.html');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// 打开本地Markdown文件
function openFile(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        editor.value = e.target.result;
        appState.filename = file.name;
        render();
    };
    reader.readAsText(file);
}

// 上下文菜单功能
function showContextMenu(e) {
    e.preventDefault();
    contextMenu.style.display = 'block';
    contextMenu.style.left = e.pageX + 'px';
    contextMenu.style.top = e.pageY + 'px';

    // 确保菜单不会超出屏幕边界
    const rect = contextMenu.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
        contextMenu.style.left = (e.pageX - rect.width) + 'px';
    }
    if (rect.bottom > window.innerHeight) {
        contextMenu.style.top = (e.pageY - rect.height) + 'px';
    }

    // 添加键盘导航支持
    document.addEventListener('keydown', handleContextMenuKeydown);
}

function hideContextMenu() {
    contextMenu.style.display = 'none';
    document.removeEventListener('keydown', handleContextMenuKeydown);
}

function handleContextMenuKeydown(e) {
    if (e.key === 'Escape') {
        hideContextMenu();
    }
}

function handleContextMenuAction(action) {
    hideContextMenu();
    switch (action) {
        case 'selectAll':
            selectAll();
            break;
        case 'copy':
            copyText();
            break;
        case 'cut':
            cutText();
            break;
        case 'paste':
            pasteText();
            break;
        case 'undo':
            undo();
            break;
        case 'redo':
            redo();
            break;
    }
}

// 文件拖拽上传
preview.addEventListener('dragover', function(e) {
    e.preventDefault();
    preview.classList.add('dragover');
});
preview.addEventListener('dragleave', function(e) {
    e.preventDefault();
    preview.classList.remove('dragover');
});
preview.addEventListener('drop', function(e) {
    e.preventDefault();
    preview.classList.remove('dragover');
    if (e.dataTransfer.files.length) {
        openFile(e.dataTransfer.files[0]);
    }
});

// 编辑器事件监听
editor.addEventListener('input', function() {
    pushUndoStack();
    render();
});

// 监听编辑器滚动，同步行号
editor.addEventListener('scroll', function() {
    syncLineNumbersScroll();
});

// 监听光标位置变化
editor.addEventListener('selectionchange', function() {
    updateStatusBar(editor.value);
});

editor.addEventListener('click', function() {
    updateStatusBar(editor.value);
});

editor.addEventListener('keyup', function() {
    updateStatusBar(editor.value);
});

// Tab键插入缩进
editor.addEventListener('keydown', function(e) {
    if (e.key === 'Tab') {
        e.preventDefault();
        const start = this.selectionStart;
        const end = this.selectionEnd;
        this.value = this.value.substring(0, start) + '    ' + this.value.substring(end);
        this.selectionStart = this.selectionEnd = start + 4;
        render();
    }
    // 快捷键
    if (e.ctrlKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        saveFile();
    }
    if (e.ctrlKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        newDoc();
    }
    if (e.ctrlKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        selectAll();
    }
    if (e.ctrlKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        copyText();
    }
    if (e.ctrlKey && e.key.toLowerCase() === 'x') {
        e.preventDefault();
        cutText();
    }
    if (e.ctrlKey && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        pasteText();
    }
    if (e.ctrlKey && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        makeBold();
    }
    if (e.ctrlKey && e.key.toLowerCase() === 'i') {
        e.preventDefault();
        makeItalic();
    }
    if (e.ctrlKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        makeLink();
    }
    if (e.key === 'F11') {
        e.preventDefault();
        toggleFullscreen();
    }
    // 撤销/重做
    if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        undo();
    }
    if (e.ctrlKey && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
        e.preventDefault();
        redo();
    }
});

// 工具栏按钮事件
newBtn.onclick = newDoc;
saveBtn.onclick = saveFile;
exportHtmlBtn.onclick = exportHtml;
themeBtn.onclick = function() {
    appState.theme = appState.theme === 'dark' ? 'light' : 'dark';
    setTheme(appState.theme);
};
openBtn.onclick = function() {
    fileInput.click();
};
fileInput.onchange = function(e) {
    if (e.target.files.length) {
        openFile(e.target.files[0]);
    }
};
viewToggleBtn.onclick = function() {
    if (appState.view === 'split') setView('editor');
    else if (appState.view === 'editor') setView('preview');
    else setView('split');
};

// 编辑按钮事件
selectAllBtn.onclick = selectAll;
copyBtn.onclick = copyText;
cutBtn.onclick = cutText;
pasteBtn.onclick = pasteText;

// 格式化按钮事件
boldBtn.onclick = makeBold;
italicBtn.onclick = makeItalic;
strikethroughBtn.onclick = makeStrikethrough;
codeBtn.onclick = makeCode;
codeblockBtn.onclick = makeCodeBlock;
headingBtn.onclick = makeHeading;
linkBtn.onclick = makeLink;
imageBtn.onclick = makeImage;
tableBtn.onclick = makeTable;
listBtn.onclick = makeList;
quoteBtn.onclick = makeQuote;
hrBtn.onclick = makeHr;
fullscreenBtn.onclick = toggleFullscreen;

// 撤销/重做功能
function pushUndoStack() {
    if (appState.undoStack.length > 100) appState.undoStack.shift();
    appState.undoStack.push(editor.value);
    appState.redoStack = [];
}
function undo() {
    if (appState.undoStack.length > 1) {
        appState.redoStack.push(appState.undoStack.pop());
        editor.value = appState.undoStack[appState.undoStack.length - 1];
        render();
    }
}
function redo() {
    if (appState.redoStack.length) {
        const val = appState.redoStack.pop();
        appState.undoStack.push(val);
        editor.value = val;
        render();
    }
}

// 恢复localStorage内容
function restore() {
    const saved = localStorage.getItem('md-content');
    const filename = localStorage.getItem('md-filename');
    if (saved !== null) {
        editor.value = saved;
        appState.filename = filename || '未命名.md';
    }
    setTheme(appState.theme);
    setView(appState.view);
    render();
    pushUndoStack();

    // 确保行号正确显示
    updateLineNumbers();
}

// 上下文菜单事件监听
editor.addEventListener('contextmenu', showContextMenu);
document.addEventListener('click', hideContextMenu);
document.addEventListener('contextmenu', function(e) {
    if (!editor.contains(e.target)) {
        hideContextMenu();
    }
});

// 上下文菜单项点击事件
contextMenu.addEventListener('click', function(e) {
    e.stopPropagation();
    const item = e.target.closest('.context-menu-item');
    if (item) {
        const action = item.getAttribute('data-action');
        handleContextMenuAction(action);
    }
});

// 初始化
window.onload = restore;