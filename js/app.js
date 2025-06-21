// app.js
// Markdown编辑器主逻辑，包含实时预览、主题切换、文件操作、快捷键、状态管理等

// DOM元素获取
const editor = document.getElementById('editor');
const preview = document.getElementById('preview');
const statusText = document.getElementById('status-text');
const themeBtn = document.getElementById('theme-btn');
const newBtn = document.getElementById('new-btn');
const saveBtn = document.getElementById('save-btn');
const exportHtmlBtn = document.getElementById('export-html-btn');
const openBtn = document.getElementById('open-btn');
const fileInput = document.getElementById('file-input');
const viewToggleBtn = document.getElementById('view-toggle-btn');
const editorPanel = document.querySelector('.editor-panel');
const previewPanel = document.querySelector('.preview-panel');

// 应用状态
let appState = {
    content: '',
    theme: localStorage.getItem('md-theme') || 'light',
    view: localStorage.getItem('md-view') || 'split', // split/editor/preview
    filename: '未命名.md',
    undoStack: [],
    redoStack: []
};

// 主题切换
function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('md-theme', theme);
    // 切换highlight.js主题
    const hljsTheme = document.getElementById('hljs-theme');
    if (theme === 'dark') {
        hljsTheme.href = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/styles/github-dark.min.css';
        themeBtn.innerHTML = '<i class="fa fa-sun"></i> 浅色';
    } else {
        hljsTheme.href = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/styles/github.min.css';
        themeBtn.innerHTML = '<i class="fa fa-moon"></i> 深色';
    }
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

// 实时渲染Markdown
function render() {
    const md = editor.value;
    preview.innerHTML = parseMarkdown(md);
    statusText.textContent = `字数：${md.length}`;
    appState.content = md;
    autoSave();
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
}

// 初始化
window.onload = restore; 