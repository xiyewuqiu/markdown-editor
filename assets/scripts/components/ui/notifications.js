/*
 * 通知系统组件
 * 管理应用的通知显示
 */

import { EventEmitter } from '../../utils/event-utils.js';
import { $, addClass, removeClass, createElement } from '../../utils/dom-utils.js';
import { stateManager } from '../../core/state.js';
import { APP_CONFIG } from '../../core/config.js';

export class NotificationSystem extends EventEmitter {
    constructor() {
        super();
        
        this.container = null;
        this.notifications = new Map();
        this.maxNotifications = 5;
        
        this.init();
    }
    
    // 初始化通知系统
    init() {
        this.createContainer();
        this.bindEvents();
    }
    
    // 创建通知容器
    createContainer() {
        this.container = document.createElement('div');
        this.container.className = 'notification-container';
        this.container.setAttribute('aria-live', 'polite');
        this.container.setAttribute('aria-label', '通知区域');
        
        document.body.appendChild(this.container);
    }
    
    // 绑定事件
    bindEvents() {
        // 监听状态管理器的通知事件
        stateManager.on('notification:show', this.handleNotificationShow.bind(this));
        stateManager.on('notification:hide', this.handleNotificationHide.bind(this));
    }
    
    // 处理显示通知事件
    handleNotificationShow(data) {
        this.show(data);
    }
    
    // 处理隐藏通知事件
    handleNotificationHide(data) {
        this.hide(data.id);
    }
    
    // 显示通知
    show(options = {}) {
        const notification = this.createNotification(options);
        
        // 限制通知数量
        if (this.notifications.size >= this.maxNotifications) {
            const oldestId = this.notifications.keys().next().value;
            this.hide(oldestId);
        }
        
        // 添加到容器
        this.container.appendChild(notification.element);
        this.notifications.set(notification.id, notification);
        
        // 触发显示动画
        requestAnimationFrame(() => {
            addClass(notification.element, 'show');
        });
        
        // 自动隐藏
        if (notification.duration > 0) {
            notification.timer = setTimeout(() => {
                this.hide(notification.id);
            }, notification.duration);
        }
        
        this.emit('notification:shown', notification);
        
        return notification.id;
    }
    
    // 创建通知元素
    createNotification(options) {
        const id = options.id || this.generateId();
        const type = options.type || 'info';
        const title = options.title || '';
        const message = options.message || '';
        const duration = options.duration !== undefined ? options.duration : APP_CONFIG.ui.notificationDuration;
        const actions = options.actions || [];
        
        // 创建通知元素
        const element = createElement('div', {
            className: `notification ${type}`,
            'data-id': id,
            role: 'alert',
            'aria-live': 'assertive'
        });
        
        // 创建图标
        const icon = createElement('div', {
            className: 'notification-icon'
        });
        element.appendChild(icon);
        
        // 创建内容
        const content = createElement('div', {
            className: 'notification-content'
        });
        
        if (title) {
            const titleElement = createElement('div', {
                className: 'notification-title',
                textContent: title
            });
            content.appendChild(titleElement);
        }
        
        if (message) {
            const messageElement = createElement('div', {
                className: 'notification-message',
                textContent: message
            });
            content.appendChild(messageElement);
        }
        
        element.appendChild(content);
        
        // 创建操作按钮
        if (actions.length > 0) {
            const actionsContainer = createElement('div', {
                className: 'notification-actions'
            });
            
            actions.forEach(action => {
                const button = createElement('button', {
                    className: 'notification-action',
                    textContent: action.text
                });
                
                button.addEventListener('click', () => {
                    if (action.handler) {
                        action.handler();
                    }
                    this.hide(id);
                });
                
                actionsContainer.appendChild(button);
            });
            
            element.appendChild(actionsContainer);
        }
        
        // 创建关闭按钮
        const closeButton = createElement('button', {
            className: 'notification-close',
            'aria-label': '关闭通知'
        });
        
        closeButton.addEventListener('click', () => {
            this.hide(id);
        });
        
        element.appendChild(closeButton);
        
        // 创建进度条
        if (duration > 0) {
            const progress = createElement('div', {
                className: 'notification-progress'
            });
            element.appendChild(progress);
        }
        
        return {
            id,
            type,
            title,
            message,
            duration,
            actions,
            element,
            timer: null,
            timestamp: Date.now()
        };
    }
    
    // 隐藏通知
    hide(id) {
        const notification = this.notifications.get(id);
        if (!notification) return;
        
        // 清除定时器
        if (notification.timer) {
            clearTimeout(notification.timer);
        }
        
        // 触发隐藏动画
        removeClass(notification.element, 'show');
        addClass(notification.element, 'hide');
        
        // 移除元素
        setTimeout(() => {
            if (notification.element.parentNode) {
                notification.element.parentNode.removeChild(notification.element);
            }
            this.notifications.delete(id);
        }, 300);
        
        this.emit('notification:hidden', { id });
    }
    
    // 隐藏所有通知
    hideAll() {
        const ids = Array.from(this.notifications.keys());
        ids.forEach(id => this.hide(id));
    }
    
    // 更新通知
    update(id, options) {
        const notification = this.notifications.get(id);
        if (!notification) return;
        
        // 更新标题
        if (options.title !== undefined) {
            const titleElement = $('.notification-title', notification.element);
            if (titleElement) {
                titleElement.textContent = options.title;
            }
        }
        
        // 更新消息
        if (options.message !== undefined) {
            const messageElement = $('.notification-message', notification.element);
            if (messageElement) {
                messageElement.textContent = options.message;
            }
        }
        
        // 更新类型
        if (options.type !== undefined) {
            notification.element.className = `notification ${options.type}`;
        }
        
        // 更新持续时间
        if (options.duration !== undefined) {
            if (notification.timer) {
                clearTimeout(notification.timer);
            }
            
            if (options.duration > 0) {
                notification.timer = setTimeout(() => {
                    this.hide(id);
                }, options.duration);
            }
        }
        
        this.emit('notification:updated', { id, options });
    }
    
    // 生成唯一ID
    generateId() {
        return 'notification-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }
    
    // 快捷方法：成功通知
    success(message, title = '成功', options = {}) {
        return this.show({
            type: 'success',
            title,
            message,
            ...options
        });
    }
    
    // 快捷方法：错误通知
    error(message, title = '错误', options = {}) {
        return this.show({
            type: 'error',
            title,
            message,
            duration: 0, // 错误通知不自动消失
            ...options
        });
    }
    
    // 快捷方法：警告通知
    warning(message, title = '警告', options = {}) {
        return this.show({
            type: 'warning',
            title,
            message,
            ...options
        });
    }
    
    // 快捷方法：信息通知
    info(message, title = '信息', options = {}) {
        return this.show({
            type: 'info',
            title,
            message,
            ...options
        });
    }
    
    // 快捷方法：加载通知
    loading(message, title = '加载中', options = {}) {
        return this.show({
            type: 'loading',
            title,
            message,
            duration: 0, // 加载通知不自动消失
            ...options
        });
    }
    
    // 显示确认对话框
    confirm(message, title = '确认', options = {}) {
        return new Promise((resolve) => {
            const actions = [
                {
                    text: options.confirmText || '确认',
                    handler: () => resolve(true)
                },
                {
                    text: options.cancelText || '取消',
                    handler: () => resolve(false)
                }
            ];
            
            this.show({
                type: 'info',
                title,
                message,
                duration: 0,
                actions,
                ...options
            });
        });
    }
    
    // 显示进度通知
    progress(message, title = '进度', initialProgress = 0) {
        const id = this.show({
            type: 'info',
            title,
            message: `${message} (${initialProgress}%)`,
            duration: 0
        });
        
        return {
            id,
            update: (progress, newMessage) => {
                const displayMessage = newMessage || message;
                this.update(id, {
                    message: `${displayMessage} (${progress}%)`
                });
            },
            complete: (successMessage) => {
                this.update(id, {
                    type: 'success',
                    message: successMessage || '完成',
                    duration: 3000
                });
            },
            error: (errorMessage) => {
                this.update(id, {
                    type: 'error',
                    message: errorMessage || '失败',
                    duration: 5000
                });
            },
            close: () => {
                this.hide(id);
            }
        };
    }
    
    // 获取通知统计
    getStats() {
        const notifications = Array.from(this.notifications.values());
        const stats = {
            total: notifications.length,
            byType: {}
        };
        
        notifications.forEach(notification => {
            stats.byType[notification.type] = (stats.byType[notification.type] || 0) + 1;
        });
        
        return stats;
    }
    
    // 获取所有通知
    getAll() {
        return Array.from(this.notifications.values());
    }
    
    // 查找通知
    find(predicate) {
        return this.getAll().find(predicate);
    }
    
    // 过滤通知
    filter(predicate) {
        return this.getAll().filter(predicate);
    }
    
    // 设置最大通知数量
    setMaxNotifications(max) {
        this.maxNotifications = max;
        
        // 如果当前通知数量超过限制，移除最旧的
        while (this.notifications.size > max) {
            const oldestId = this.notifications.keys().next().value;
            this.hide(oldestId);
        }
    }
    
    // 设置默认持续时间
    setDefaultDuration(duration) {
        APP_CONFIG.ui.notificationDuration = duration;
    }
    
    // 销毁通知系统
    destroy() {
        this.hideAll();
        
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        
        this.removeAllListeners();
    }
}

// 创建全局通知系统实例
export const notifications = new NotificationSystem();

// 默认导出
export default NotificationSystem;
