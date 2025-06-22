/*
 * 事件工具模块
 * 提供事件发射器、事件处理、自定义事件等功能
 */

// 事件发射器基类
export class EventEmitter {
    constructor() {
        this.events = new Map();
        this.maxListeners = 10;
    }
    
    // 添加事件监听器
    on(event, listener) {
        if (typeof listener !== 'function') {
            throw new TypeError('Listener must be a function');
        }
        
        if (!this.events.has(event)) {
            this.events.set(event, []);
        }
        
        const listeners = this.events.get(event);
        listeners.push(listener);
        
        // 检查监听器数量
        if (listeners.length > this.maxListeners) {
            console.warn(`MaxListenersExceededWarning: Possible EventEmitter memory leak detected. ${listeners.length} ${event} listeners added.`);
        }
        
        return this;
    }
    
    // 添加一次性事件监听器
    once(event, listener) {
        const onceWrapper = (...args) => {
            this.off(event, onceWrapper);
            listener.apply(this, args);
        };
        
        return this.on(event, onceWrapper);
    }
    
    // 移除事件监听器
    off(event, listener) {
        if (!this.events.has(event)) {
            return this;
        }
        
        const listeners = this.events.get(event);
        const index = listeners.indexOf(listener);
        
        if (index !== -1) {
            listeners.splice(index, 1);
        }
        
        // 如果没有监听器了，删除事件
        if (listeners.length === 0) {
            this.events.delete(event);
        }
        
        return this;
    }
    
    // 移除所有监听器
    removeAllListeners(event) {
        if (event) {
            this.events.delete(event);
        } else {
            this.events.clear();
        }
        
        return this;
    }
    
    // 触发事件
    emit(event, ...args) {
        if (!this.events.has(event)) {
            return false;
        }
        
        const listeners = this.events.get(event).slice(); // 复制数组避免修改问题
        
        for (const listener of listeners) {
            try {
                listener.apply(this, args);
            } catch (error) {
                console.error(`Error in event listener for '${event}':`, error);
            }
        }
        
        return true;
    }
    
    // 获取监听器列表
    listeners(event) {
        return this.events.has(event) ? this.events.get(event).slice() : [];
    }
    
    // 获取监听器数量
    listenerCount(event) {
        return this.events.has(event) ? this.events.get(event).length : 0;
    }
    
    // 获取所有事件名
    eventNames() {
        return Array.from(this.events.keys());
    }
    
    // 设置最大监听器数量
    setMaxListeners(n) {
        this.maxListeners = n;
        return this;
    }
    
    // 获取最大监听器数量
    getMaxListeners() {
        return this.maxListeners;
    }
}

// 防抖函数
export function debounce(func, wait, immediate = false) {
    let timeout;
    
    return function executedFunction(...args) {
        const later = () => {
            timeout = null;
            if (!immediate) func.apply(this, args);
        };
        
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        
        if (callNow) func.apply(this, args);
    };
}

// 节流函数
export function throttle(func, limit) {
    let inThrottle;
    
    return function executedFunction(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// 事件委托
export function delegate(container, selector, event, handler) {
    container.addEventListener(event, function(e) {
        const target = e.target.closest(selector);
        if (target && container.contains(target)) {
            handler.call(target, e);
        }
    });
}

// 添加事件监听器（支持多个事件）
export function addEventListeners(element, events, handler, options = {}) {
    const eventList = Array.isArray(events) ? events : [events];
    
    eventList.forEach(event => {
        element.addEventListener(event, handler, options);
    });
    
    // 返回清理函数
    return () => {
        eventList.forEach(event => {
            element.removeEventListener(event, handler, options);
        });
    };
}

// 创建自定义事件
export function createCustomEvent(name, detail = null, options = {}) {
    return new CustomEvent(name, {
        detail,
        bubbles: options.bubbles !== false,
        cancelable: options.cancelable !== false,
        composed: options.composed !== false
    });
}

// 触发自定义事件
export function triggerEvent(element, eventName, detail = null, options = {}) {
    const event = createCustomEvent(eventName, detail, options);
    return element.dispatchEvent(event);
}

// 等待事件触发
export function waitForEvent(element, eventName, timeout = 5000) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            element.removeEventListener(eventName, handler);
            reject(new Error(`Event '${eventName}' timeout after ${timeout}ms`));
        }, timeout);
        
        const handler = (event) => {
            clearTimeout(timer);
            element.removeEventListener(eventName, handler);
            resolve(event);
        };
        
        element.addEventListener(eventName, handler, { once: true });
    });
}

// 事件流控制
export class EventFlow {
    constructor() {
        this.handlers = [];
        this.stopped = false;
    }
    
    // 添加处理器
    use(handler) {
        this.handlers.push(handler);
        return this;
    }
    
    // 执行事件流
    async execute(event, context = {}) {
        this.stopped = false;
        
        for (const handler of this.handlers) {
            if (this.stopped) break;
            
            try {
                await handler(event, context, this);
            } catch (error) {
                console.error('Error in event flow handler:', error);
                break;
            }
        }
        
        return !this.stopped;
    }
    
    // 停止事件流
    stop() {
        this.stopped = true;
    }
}

// 键盘事件工具
export class KeyboardManager extends EventEmitter {
    constructor() {
        super();
        this.shortcuts = new Map();
        this.pressedKeys = new Set();
        this.init();
    }
    
    init() {
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        document.addEventListener('keyup', this.handleKeyUp.bind(this));
        window.addEventListener('blur', this.handleBlur.bind(this));
    }
    
    // 注册快捷键
    register(shortcut, handler, description = '') {
        const normalizedShortcut = this.normalizeShortcut(shortcut);
        this.shortcuts.set(normalizedShortcut, { handler, description });
    }
    
    // 注销快捷键
    unregister(shortcut) {
        const normalizedShortcut = this.normalizeShortcut(shortcut);
        this.shortcuts.delete(normalizedShortcut);
    }
    
    // 标准化快捷键字符串
    normalizeShortcut(shortcut) {
        return shortcut
            .toLowerCase()
            .split('+')
            .map(key => key.trim())
            .sort()
            .join('+');
    }
    
    // 处理按键按下
    handleKeyDown(event) {
        this.pressedKeys.add(event.key.toLowerCase());
        
        const shortcut = this.getShortcutFromEvent(event);
        if (this.shortcuts.has(shortcut)) {
            event.preventDefault();
            const { handler } = this.shortcuts.get(shortcut);
            handler(event);
            this.emit('shortcut', { shortcut, event });
        }
        
        this.emit('keydown', event);
    }
    
    // 处理按键释放
    handleKeyUp(event) {
        this.pressedKeys.delete(event.key.toLowerCase());
        this.emit('keyup', event);
    }
    
    // 处理窗口失焦
    handleBlur() {
        this.pressedKeys.clear();
    }
    
    // 从事件获取快捷键字符串
    getShortcutFromEvent(event) {
        const keys = [];
        
        if (event.ctrlKey) keys.push('ctrl');
        if (event.altKey) keys.push('alt');
        if (event.shiftKey) keys.push('shift');
        if (event.metaKey) keys.push('meta');
        
        const key = event.key.toLowerCase();
        if (!['control', 'alt', 'shift', 'meta'].includes(key)) {
            keys.push(key);
        }
        
        return keys.sort().join('+');
    }
    
    // 检查快捷键是否被按下
    isPressed(shortcut) {
        const keys = shortcut.toLowerCase().split('+');
        return keys.every(key => this.pressedKeys.has(key));
    }
    
    // 获取所有注册的快捷键
    getShortcuts() {
        return Array.from(this.shortcuts.entries()).map(([shortcut, { description }]) => ({
            shortcut,
            description
        }));
    }
}

// 鼠标事件工具
export class MouseManager extends EventEmitter {
    constructor() {
        super();
        this.position = { x: 0, y: 0 };
        this.buttons = new Set();
        this.init();
    }
    
    init() {
        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
        document.addEventListener('mousedown', this.handleMouseDown.bind(this));
        document.addEventListener('mouseup', this.handleMouseUp.bind(this));
        document.addEventListener('contextmenu', this.handleContextMenu.bind(this));
    }
    
    handleMouseMove(event) {
        this.position = { x: event.clientX, y: event.clientY };
        this.emit('move', event);
    }
    
    handleMouseDown(event) {
        this.buttons.add(event.button);
        this.emit('down', event);
    }
    
    handleMouseUp(event) {
        this.buttons.delete(event.button);
        this.emit('up', event);
    }
    
    handleContextMenu(event) {
        this.emit('contextmenu', event);
    }
    
    // 获取当前鼠标位置
    getPosition() {
        return { ...this.position };
    }
    
    // 检查鼠标按钮是否被按下
    isButtonPressed(button) {
        return this.buttons.has(button);
    }
}

// 创建全局实例
export const keyboardManager = new KeyboardManager();
export const mouseManager = new MouseManager();

// 默认导出
export default {
    EventEmitter,
    debounce,
    throttle,
    delegate,
    addEventListeners,
    createCustomEvent,
    triggerEvent,
    waitForEvent,
    EventFlow,
    KeyboardManager,
    MouseManager,
    keyboardManager,
    mouseManager
};
