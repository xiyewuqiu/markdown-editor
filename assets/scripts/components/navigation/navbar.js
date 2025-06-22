/*
 * 导航栏组件
 * 管理顶部导航栏的显示和交互
 */

import { EventEmitter } from '../../utils/event-utils.js';
import { $, $$, addClass, removeClass } from '../../utils/dom-utils.js';
import { APP_CONFIG, EVENT_TYPES } from '../../core/config.js';

export class Navbar extends EventEmitter {
    constructor(container) {
        super();
        
        this.container = typeof container === 'string' ? $(container) : container;
        this.menuItems = new Map();
        this.activeMenu = null;
        this.closeTimeout = null;
        
        this.init();
    }
    
    // 初始化导航栏
    init() {
        if (!this.container) {
            console.error('Navbar container not found');
            return;
        }
        
        this.bindEvents();
        this.setupMenuItems();
        this.setupKeyboardNavigation();
    }
    
    // 绑定事件
    bindEvents() {
        // 鼠标事件
        this.container.addEventListener('mouseenter', this.handleMouseEnter.bind(this));
        this.container.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
        
        // 点击事件
        this.container.addEventListener('click', this.handleClick.bind(this));
        
        // 全局点击事件（关闭菜单）
        document.addEventListener('click', this.handleDocumentClick.bind(this));
        
        // 键盘事件
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
    }
    
    // 设置菜单项
    setupMenuItems() {
        const navItems = $$('.nav-item', this.container);
        
        navItems.forEach(item => {
            const menuType = item.getAttribute('data-menu');
            const button = $('.nav-button', item);
            const dropdown = $('.dropdown-menu', item);
            
            if (menuType && button && dropdown) {
                this.menuItems.set(menuType, {
                    element: item,
                    button,
                    dropdown,
                    isOpen: false
                });
                
                // 绑定菜单项事件
                this.bindMenuItemEvents(item, menuType);
            }
        });
    }
    
    // 绑定菜单项事件
    bindMenuItemEvents(item, menuType) {
        const button = $('.nav-button', item);
        const dropdown = $('.dropdown-menu', item);
        
        // 鼠标进入菜单项
        item.addEventListener('mouseenter', () => {
            this.openMenu(menuType);
        });
        
        // 鼠标离开菜单项
        item.addEventListener('mouseleave', () => {
            this.scheduleCloseMenu(menuType);
        });
        
        // 下拉菜单鼠标事件
        if (dropdown) {
            dropdown.addEventListener('mouseenter', () => {
                this.cancelCloseMenu();
            });
            
            dropdown.addEventListener('mouseleave', () => {
                this.scheduleCloseMenu(menuType);
            });
        }
        
        // 按钮点击事件
        if (button) {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleMenu(menuType);
            });
        }
    }
    
    // 处理鼠标进入
    handleMouseEnter(e) {
        this.cancelCloseMenu();
    }
    
    // 处理鼠标离开
    handleMouseLeave(e) {
        // 检查是否真的离开了导航栏区域
        const rect = this.container.getBoundingClientRect();
        const { clientX, clientY } = e;
        
        if (
            clientX < rect.left ||
            clientX > rect.right ||
            clientY < rect.top ||
            clientY > rect.bottom
        ) {
            this.scheduleCloseAllMenus();
        }
    }
    
    // 处理点击事件
    handleClick(e) {
        const menuItem = e.target.closest('.menu-item');
        if (menuItem) {
            const action = menuItem.getAttribute('data-action');
            if (action) {
                e.preventDefault();
                this.handleMenuAction(action, e);
                this.closeAllMenus();
            }
        }
    }
    
    // 处理文档点击（关闭菜单）
    handleDocumentClick(e) {
        if (!this.container.contains(e.target)) {
            this.closeAllMenus();
        }
    }
    
    // 处理键盘事件
    handleKeyDown(e) {
        if (e.key === 'Escape') {
            this.closeAllMenus();
        }
    }
    
    // 设置键盘导航
    setupKeyboardNavigation() {
        this.container.addEventListener('keydown', (e) => {
            if (this.activeMenu) {
                this.handleMenuKeyDown(e);
            }
        });
    }
    
    // 处理菜单键盘导航
    handleMenuKeyDown(e) {
        const menuData = this.menuItems.get(this.activeMenu);
        if (!menuData || !menuData.isOpen) return;
        
        const menuItems = $$('.menu-item', menuData.dropdown);
        const currentIndex = menuItems.findIndex(item => item.classList.contains('focused'));
        
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.focusMenuItem(menuItems, currentIndex + 1);
                break;
                
            case 'ArrowUp':
                e.preventDefault();
                this.focusMenuItem(menuItems, currentIndex - 1);
                break;
                
            case 'Enter':
            case ' ':
                e.preventDefault();
                if (currentIndex >= 0) {
                    menuItems[currentIndex].click();
                }
                break;
                
            case 'Escape':
                e.preventDefault();
                this.closeAllMenus();
                break;
        }
    }
    
    // 聚焦菜单项
    focusMenuItem(menuItems, index) {
        // 移除当前聚焦
        menuItems.forEach(item => removeClass(item, 'focused'));
        
        // 循环索引
        if (index < 0) index = menuItems.length - 1;
        if (index >= menuItems.length) index = 0;
        
        // 添加新聚焦
        if (menuItems[index]) {
            addClass(menuItems[index], 'focused');
            menuItems[index].focus();
        }
    }
    
    // 打开菜单
    openMenu(menuType) {
        const menuData = this.menuItems.get(menuType);
        if (!menuData || menuData.isOpen) return;
        
        // 关闭其他菜单
        this.closeAllMenus();
        
        // 打开当前菜单
        menuData.isOpen = true;
        this.activeMenu = menuType;
        
        addClass(menuData.element, 'active');
        addClass(menuData.dropdown, 'show');
        
        // 触发事件
        this.emit(EVENT_TYPES.MENU_OPEN, { menuType, element: menuData.element });
        
        // 设置ARIA属性
        menuData.button.setAttribute('aria-expanded', 'true');
        menuData.dropdown.setAttribute('aria-hidden', 'false');
    }
    
    // 关闭菜单
    closeMenu(menuType) {
        const menuData = this.menuItems.get(menuType);
        if (!menuData || !menuData.isOpen) return;
        
        menuData.isOpen = false;
        
        removeClass(menuData.element, 'active');
        removeClass(menuData.dropdown, 'show');
        
        // 清除聚焦状态
        const menuItems = $$('.menu-item', menuData.dropdown);
        menuItems.forEach(item => removeClass(item, 'focused'));
        
        if (this.activeMenu === menuType) {
            this.activeMenu = null;
        }
        
        // 触发事件
        this.emit(EVENT_TYPES.MENU_CLOSE, { menuType, element: menuData.element });
        
        // 设置ARIA属性
        menuData.button.setAttribute('aria-expanded', 'false');
        menuData.dropdown.setAttribute('aria-hidden', 'true');
    }
    
    // 切换菜单
    toggleMenu(menuType) {
        const menuData = this.menuItems.get(menuType);
        if (!menuData) return;
        
        if (menuData.isOpen) {
            this.closeMenu(menuType);
        } else {
            this.openMenu(menuType);
        }
    }
    
    // 关闭所有菜单
    closeAllMenus() {
        this.menuItems.forEach((menuData, menuType) => {
            if (menuData.isOpen) {
                this.closeMenu(menuType);
            }
        });
        
        this.cancelCloseMenu();
    }
    
    // 计划关闭菜单
    scheduleCloseMenu(menuType) {
        this.cancelCloseMenu();
        
        this.closeTimeout = setTimeout(() => {
            this.closeMenu(menuType);
        }, APP_CONFIG.ui.menuDelay);
    }
    
    // 计划关闭所有菜单
    scheduleCloseAllMenus() {
        this.cancelCloseMenu();
        
        this.closeTimeout = setTimeout(() => {
            this.closeAllMenus();
        }, APP_CONFIG.ui.menuDelay);
    }
    
    // 取消关闭菜单
    cancelCloseMenu() {
        if (this.closeTimeout) {
            clearTimeout(this.closeTimeout);
            this.closeTimeout = null;
        }
    }
    
    // 处理菜单动作
    handleMenuAction(action, event) {
        this.emit('menu:action', { action, event });
    }
    
    // 更新菜单状态
    updateMenuState(menuType, state) {
        const menuData = this.menuItems.get(menuType);
        if (!menuData) return;
        
        // 更新按钮状态
        if (state.active !== undefined) {
            if (state.active) {
                addClass(menuData.button, 'active');
            } else {
                removeClass(menuData.button, 'active');
            }
        }
        
        // 更新禁用状态
        if (state.disabled !== undefined) {
            menuData.button.disabled = state.disabled;
            if (state.disabled) {
                addClass(menuData.element, 'disabled');
            } else {
                removeClass(menuData.element, 'disabled');
            }
        }
    }
    
    // 添加菜单项
    addMenuItem(menuType, item) {
        const menuData = this.menuItems.get(menuType);
        if (!menuData) return;
        
        const menuItem = this.createMenuItem(item);
        menuData.dropdown.appendChild(menuItem);
    }
    
    // 创建菜单项
    createMenuItem(item) {
        const menuItem = document.createElement('div');
        menuItem.className = 'menu-item';
        menuItem.setAttribute('data-action', item.action);
        
        if (item.icon) {
            const icon = document.createElement('i');
            icon.className = `fa ${item.icon}`;
            menuItem.appendChild(icon);
        }
        
        const span = document.createElement('span');
        span.textContent = item.text;
        menuItem.appendChild(span);
        
        if (item.shortcut) {
            const shortcut = document.createElement('span');
            shortcut.className = 'shortcut';
            shortcut.textContent = item.shortcut;
            menuItem.appendChild(shortcut);
        }
        
        return menuItem;
    }
    
    // 销毁导航栏
    destroy() {
        this.closeAllMenus();
        this.removeAllListeners();
        
        // 移除事件监听器
        document.removeEventListener('click', this.handleDocumentClick);
        document.removeEventListener('keydown', this.handleKeyDown);
    }
}

// 默认导出
export default Navbar;
