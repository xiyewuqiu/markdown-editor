/*
 * 状态管理模块
 * 管理应用的全局状态、设置、数据等
 */

import { APP_CONFIG, VIEW_MODES, THEMES, EVENT_TYPES } from './config.js';
import { EventEmitter } from '../utils/event-utils.js';

// 状态管理类
class StateManager extends EventEmitter {
    constructor() {
        super();
        
        // 初始化状态
        this.state = {
            // 应用状态
            app: {
                ready: false,
                loading: false,
                error: null,
                version: APP_CONFIG.version
            },
            
            // 编辑器状态
            editor: {
                content: '',
                selection: { start: 0, end: 0 },
                cursor: { line: 1, column: 1 },
                modified: false,
                wordCount: 0,
                charCount: 0,
                lineCount: 1,
                history: [],
                historyIndex: -1
            },
            
            // 文件状态
            file: {
                name: APP_CONFIG.defaults.filename,
                path: null,
                size: 0,
                lastModified: null,
                saved: true,
                encoding: APP_CONFIG.file.encoding
            },
            
            // 视图状态
            view: {
                mode: APP_CONFIG.defaults.view,
                fullscreen: false,
                lineNumbers: APP_CONFIG.defaults.lineNumbers,
                wordWrap: APP_CONFIG.defaults.wordWrap,
                splitRatio: 0.5
            },
            
            // 主题状态
            theme: {
                current: APP_CONFIG.defaults.theme,
                available: Object.keys(APP_CONFIG.themes)
            },
            
            // UI状态
            ui: {
                menuOpen: null,
                notifications: [],
                contextMenu: { visible: false, x: 0, y: 0 },
                statusBar: { visible: true },
                toolbar: { visible: true }
            },
            
            // 设置状态
            settings: {
                ...APP_CONFIG.defaults,
                shortcuts: { ...APP_CONFIG.shortcuts }
            }
        };
        
        // 状态变更监听器
        this.listeners = new Map();
        
        // 初始化
        this.init();
    }
    
    // 初始化状态管理器
    init() {
        this.loadFromStorage();
        this.setupAutoSave();
        this.emit(EVENT_TYPES.APP_READY);
    }
    
    // 获取状态
    getState(path = null) {
        if (!path) return this.state;
        
        const keys = path.split('.');
        let current = this.state;
        
        for (const key of keys) {
            if (current && typeof current === 'object' && key in current) {
                current = current[key];
            } else {
                return undefined;
            }
        }
        
        return current;
    }
    
    // 设置状态
    setState(path, value, silent = false) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        let current = this.state;
        
        // 导航到目标对象
        for (const key of keys) {
            if (!current[key] || typeof current[key] !== 'object') {
                current[key] = {};
            }
            current = current[key];
        }
        
        // 保存旧值
        const oldValue = current[lastKey];
        
        // 设置新值
        current[lastKey] = value;
        
        // 触发事件
        if (!silent) {
            this.emit(`state:${path}`, { oldValue, newValue: value });
            this.emit('state:change', { path, oldValue, newValue: value });
        }
        
        // 自动保存到存储
        this.saveToStorage();
    }
    
    // 更新状态（合并对象）
    updateState(path, updates, silent = false) {
        const current = this.getState(path);
        if (current && typeof current === 'object') {
            const newValue = { ...current, ...updates };
            this.setState(path, newValue, silent);
        }
    }
    
    // 监听状态变更
    onStateChange(path, callback) {
        const eventName = `state:${path}`;
        this.on(eventName, callback);
        
        // 返回取消监听的函数
        return () => this.off(eventName, callback);
    }
    
    // 编辑器相关方法
    setContent(content) {
        const oldContent = this.state.editor.content;
        
        // 更新内容
        this.setState('editor.content', content);
        
        // 更新统计信息
        this.updateEditorStats(content);
        
        // 更新修改状态
        this.setState('editor.modified', content !== oldContent);
        this.setState('file.saved', false);
        
        // 添加到历史记录
        this.addToHistory(content);
        
        // 触发内容变更事件
        this.emit(EVENT_TYPES.CONTENT_CHANGE, { content, oldContent });
    }
    
    // 更新编辑器统计信息
    updateEditorStats(content) {
        const lines = content.split('\n');
        const words = content.trim() ? content.trim().split(/\s+/).length : 0;
        const chars = content.length;
        
        this.setState('editor.lineCount', lines.length, true);
        this.setState('editor.wordCount', words, true);
        this.setState('editor.charCount', chars, true);
    }
    
    // 更新光标位置
    setCursorPosition(line, column) {
        this.setState('editor.cursor', { line, column });
        this.emit(EVENT_TYPES.CURSOR_CHANGE, { line, column });
    }
    
    // 更新选择范围
    setSelection(start, end) {
        this.setState('editor.selection', { start, end });
        this.emit(EVENT_TYPES.SELECTION_CHANGE, { start, end });
    }
    
    // 添加到历史记录
    addToHistory(content) {
        const history = [...this.state.editor.history];
        const maxSize = APP_CONFIG.editor.historySize;
        
        // 添加新记录
        history.push({
            content,
            timestamp: Date.now(),
            cursor: { ...this.state.editor.cursor },
            selection: { ...this.state.editor.selection }
        });
        
        // 限制历史记录大小
        if (history.length > maxSize) {
            history.shift();
        }
        
        this.setState('editor.history', history, true);
        this.setState('editor.historyIndex', history.length - 1, true);
    }
    
    // 撤销
    undo() {
        const { history, historyIndex } = this.state.editor;
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            const record = history[newIndex];
            
            this.setState('editor.content', record.content);
            this.setState('editor.cursor', record.cursor);
            this.setState('editor.selection', record.selection);
            this.setState('editor.historyIndex', newIndex, true);
            
            return true;
        }
        return false;
    }
    
    // 重做
    redo() {
        const { history, historyIndex } = this.state.editor;
        if (historyIndex < history.length - 1) {
            const newIndex = historyIndex + 1;
            const record = history[newIndex];
            
            this.setState('editor.content', record.content);
            this.setState('editor.cursor', record.cursor);
            this.setState('editor.selection', record.selection);
            this.setState('editor.historyIndex', newIndex, true);
            
            return true;
        }
        return false;
    }
    
    // 文件相关方法
    setFile(name, path = null, size = 0) {
        this.setState('file.name', name);
        this.setState('file.path', path);
        this.setState('file.size', size);
        this.setState('file.lastModified', new Date());
        this.setState('file.saved', true);
    }
    
    // 视图相关方法
    setViewMode(mode) {
        if (Object.values(VIEW_MODES).includes(mode)) {
            this.setState('view.mode', mode);
            this.emit(EVENT_TYPES.VIEW_CHANGE, { mode });
        }
    }
    
    toggleFullscreen() {
        const fullscreen = !this.state.view.fullscreen;
        this.setState('view.fullscreen', fullscreen);
        this.emit(EVENT_TYPES.FULLSCREEN_CHANGE, { fullscreen });
    }
    
    toggleLineNumbers() {
        const lineNumbers = !this.state.view.lineNumbers;
        this.setState('view.lineNumbers', lineNumbers);
    }
    
    // 主题相关方法
    setTheme(theme) {
        if (Object.values(THEMES).includes(theme)) {
            this.setState('theme.current', theme);
            this.emit(EVENT_TYPES.THEME_CHANGE, { theme });
        }
    }
    
    toggleTheme() {
        const current = this.state.theme.current;
        const newTheme = current === THEMES.LIGHT ? THEMES.DARK : THEMES.LIGHT;
        this.setTheme(newTheme);
    }
    
    // 通知相关方法
    addNotification(notification) {
        const notifications = [...this.state.ui.notifications];
        const id = Date.now().toString();
        
        notifications.push({
            id,
            timestamp: Date.now(),
            ...notification
        });
        
        this.setState('ui.notifications', notifications);
        this.emit(EVENT_TYPES.NOTIFICATION_SHOW, { id, ...notification });
        
        // 自动移除通知
        if (notification.duration !== 0) {
            setTimeout(() => {
                this.removeNotification(id);
            }, notification.duration || APP_CONFIG.ui.notificationDuration);
        }
        
        return id;
    }
    
    removeNotification(id) {
        const notifications = this.state.ui.notifications.filter(n => n.id !== id);
        this.setState('ui.notifications', notifications);
        this.emit(EVENT_TYPES.NOTIFICATION_HIDE, { id });
    }
    
    // 存储相关方法
    saveToStorage() {
        try {
            const data = {
                settings: this.state.settings,
                theme: this.state.theme.current,
                view: this.state.view,
                file: this.state.file,
                editor: {
                    content: this.state.editor.content,
                    cursor: this.state.editor.cursor
                }
            };
            
            localStorage.setItem(
                APP_CONFIG.storage.prefix + APP_CONFIG.storage.keys.settings,
                JSON.stringify(data)
            );
        } catch (error) {
            console.warn('Failed to save state to storage:', error);
        }
    }
    
    loadFromStorage() {
        try {
            const data = localStorage.getItem(
                APP_CONFIG.storage.prefix + APP_CONFIG.storage.keys.settings
            );
            
            if (data) {
                const parsed = JSON.parse(data);
                
                // 恢复设置
                if (parsed.settings) {
                    this.setState('settings', { ...this.state.settings, ...parsed.settings }, true);
                }
                
                // 恢复主题
                if (parsed.theme) {
                    this.setState('theme.current', parsed.theme, true);
                }
                
                // 恢复视图
                if (parsed.view) {
                    this.setState('view', { ...this.state.view, ...parsed.view }, true);
                }
                
                // 恢复文件信息
                if (parsed.file) {
                    this.setState('file', { ...this.state.file, ...parsed.file }, true);
                }
                
                // 恢复编辑器内容
                if (parsed.editor) {
                    if (parsed.editor.content) {
                        this.setState('editor.content', parsed.editor.content, true);
                        this.updateEditorStats(parsed.editor.content);
                    }
                    if (parsed.editor.cursor) {
                        this.setState('editor.cursor', parsed.editor.cursor, true);
                    }
                }
            }
        } catch (error) {
            console.warn('Failed to load state from storage:', error);
        }
    }
    
    // 设置自动保存
    setupAutoSave() {
        if (APP_CONFIG.defaults.autoSave) {
            setInterval(() => {
                this.saveToStorage();
            }, APP_CONFIG.defaults.autoSaveInterval);
        }
    }
    
    // 重置状态
    reset() {
        this.state = {
            ...this.state,
            editor: {
                content: '',
                selection: { start: 0, end: 0 },
                cursor: { line: 1, column: 1 },
                modified: false,
                wordCount: 0,
                charCount: 0,
                lineCount: 1,
                history: [],
                historyIndex: -1
            },
            file: {
                name: APP_CONFIG.defaults.filename,
                path: null,
                size: 0,
                lastModified: null,
                saved: true,
                encoding: APP_CONFIG.file.encoding
            }
        };
        
        this.emit('state:reset');
    }
}

// 创建全局状态管理器实例
export const stateManager = new StateManager();

// 导出状态管理器类
export default StateManager;
