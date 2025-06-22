/*
 * DOM工具模块
 * 提供DOM操作、元素查找、样式处理等功能
 */

// 元素选择器工具
export function $(selector, context = document) {
    if (typeof selector === 'string') {
        return context.querySelector(selector);
    }
    return selector; // 如果已经是元素，直接返回
}

export function $$(selector, context = document) {
    if (typeof selector === 'string') {
        return Array.from(context.querySelectorAll(selector));
    }
    return Array.isArray(selector) ? selector : [selector];
}

// 元素创建工具
export function createElement(tag, attributes = {}, children = []) {
    const element = document.createElement(tag);
    
    // 设置属性
    Object.entries(attributes).forEach(([key, value]) => {
        if (key === 'className' || key === 'class') {
            element.className = value;
        } else if (key === 'innerHTML') {
            element.innerHTML = value;
        } else if (key === 'textContent') {
            element.textContent = value;
        } else if (key.startsWith('data-')) {
            element.setAttribute(key, value);
        } else if (key in element) {
            element[key] = value;
        } else {
            element.setAttribute(key, value);
        }
    });
    
    // 添加子元素
    children.forEach(child => {
        if (typeof child === 'string') {
            element.appendChild(document.createTextNode(child));
        } else if (child instanceof Node) {
            element.appendChild(child);
        }
    });
    
    return element;
}

// 元素类名操作
export function addClass(element, ...classes) {
    if (element && element.classList) {
        element.classList.add(...classes);
    }
    return element;
}

export function removeClass(element, ...classes) {
    if (element && element.classList) {
        element.classList.remove(...classes);
    }
    return element;
}

export function toggleClass(element, className, force) {
    if (element && element.classList) {
        return element.classList.toggle(className, force);
    }
    return false;
}

export function hasClass(element, className) {
    return element && element.classList && element.classList.contains(className);
}

// 元素样式操作
export function setStyle(element, styles) {
    if (!element || !element.style) return element;
    
    if (typeof styles === 'string') {
        element.style.cssText = styles;
    } else if (typeof styles === 'object') {
        Object.entries(styles).forEach(([property, value]) => {
            element.style[property] = value;
        });
    }
    
    return element;
}

export function getStyle(element, property) {
    if (!element) return null;
    
    const computed = window.getComputedStyle(element);
    return property ? computed.getPropertyValue(property) : computed;
}

// 元素属性操作
export function setAttributes(element, attributes) {
    if (!element) return element;
    
    Object.entries(attributes).forEach(([key, value]) => {
        if (value === null || value === undefined) {
            element.removeAttribute(key);
        } else {
            element.setAttribute(key, value);
        }
    });
    
    return element;
}

export function getAttributes(element) {
    if (!element || !element.attributes) return {};
    
    const attrs = {};
    Array.from(element.attributes).forEach(attr => {
        attrs[attr.name] = attr.value;
    });
    
    return attrs;
}

// 元素位置和尺寸
export function getElementRect(element) {
    if (!element) return null;
    return element.getBoundingClientRect();
}

export function getElementOffset(element) {
    if (!element) return { top: 0, left: 0 };
    
    let top = 0;
    let left = 0;
    
    while (element) {
        top += element.offsetTop;
        left += element.offsetLeft;
        element = element.offsetParent;
    }
    
    return { top, left };
}

export function getViewportSize() {
    return {
        width: window.innerWidth || document.documentElement.clientWidth,
        height: window.innerHeight || document.documentElement.clientHeight
    };
}

export function getScrollPosition(element = window) {
    if (element === window) {
        return {
            x: window.pageXOffset || document.documentElement.scrollLeft,
            y: window.pageYOffset || document.documentElement.scrollTop
        };
    }
    
    return {
        x: element.scrollLeft,
        y: element.scrollTop
    };
}

// 元素可见性检测
export function isElementVisible(element) {
    if (!element) return false;
    
    const rect = element.getBoundingClientRect();
    const viewport = getViewportSize();
    
    return (
        rect.top < viewport.height &&
        rect.bottom > 0 &&
        rect.left < viewport.width &&
        rect.right > 0
    );
}

export function isElementInViewport(element, threshold = 0) {
    if (!element) return false;
    
    const rect = element.getBoundingClientRect();
    const viewport = getViewportSize();
    
    return (
        rect.top >= -threshold &&
        rect.left >= -threshold &&
        rect.bottom <= viewport.height + threshold &&
        rect.right <= viewport.width + threshold
    );
}

// 元素查找
export function findParent(element, selector) {
    if (!element) return null;
    
    let parent = element.parentElement;
    while (parent) {
        if (parent.matches(selector)) {
            return parent;
        }
        parent = parent.parentElement;
    }
    
    return null;
}

export function findChildren(element, selector) {
    if (!element) return [];
    return Array.from(element.querySelectorAll(selector));
}

export function findSiblings(element, selector = null) {
    if (!element || !element.parentElement) return [];
    
    const siblings = Array.from(element.parentElement.children).filter(child => child !== element);
    
    if (selector) {
        return siblings.filter(sibling => sibling.matches(selector));
    }
    
    return siblings;
}

// 元素插入和移除
export function insertAfter(newElement, targetElement) {
    if (!newElement || !targetElement || !targetElement.parentNode) return;
    
    targetElement.parentNode.insertBefore(newElement, targetElement.nextSibling);
}

export function insertBefore(newElement, targetElement) {
    if (!newElement || !targetElement || !targetElement.parentNode) return;
    
    targetElement.parentNode.insertBefore(newElement, targetElement);
}

export function removeElement(element) {
    if (element && element.parentNode) {
        element.parentNode.removeChild(element);
    }
}

export function replaceElement(newElement, oldElement) {
    if (!newElement || !oldElement || !oldElement.parentNode) return;
    
    oldElement.parentNode.replaceChild(newElement, oldElement);
}

// 元素内容操作
export function empty(element) {
    if (!element) return element;
    
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
    
    return element;
}

export function html(element, content) {
    if (!element) return '';
    
    if (content !== undefined) {
        element.innerHTML = content;
        return element;
    }
    
    return element.innerHTML;
}

export function text(element, content) {
    if (!element) return '';
    
    if (content !== undefined) {
        element.textContent = content;
        return element;
    }
    
    return element.textContent;
}

// 表单元素操作
export function getFormData(form) {
    if (!form) return {};
    
    const formData = new FormData(form);
    const data = {};
    
    for (const [key, value] of formData.entries()) {
        if (data[key]) {
            // 如果已存在，转换为数组
            if (!Array.isArray(data[key])) {
                data[key] = [data[key]];
            }
            data[key].push(value);
        } else {
            data[key] = value;
        }
    }
    
    return data;
}

export function setFormData(form, data) {
    if (!form || !data) return;
    
    Object.entries(data).forEach(([key, value]) => {
        const element = form.elements[key];
        if (element) {
            if (element.type === 'checkbox' || element.type === 'radio') {
                element.checked = Boolean(value);
            } else {
                element.value = value;
            }
        }
    });
}

// 动画工具
export function fadeIn(element, duration = 300) {
    if (!element) return Promise.resolve();
    
    return new Promise(resolve => {
        element.style.opacity = '0';
        element.style.display = 'block';
        
        const start = performance.now();
        
        function animate(currentTime) {
            const elapsed = currentTime - start;
            const progress = Math.min(elapsed / duration, 1);
            
            element.style.opacity = progress.toString();
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                resolve();
            }
        }
        
        requestAnimationFrame(animate);
    });
}

export function fadeOut(element, duration = 300) {
    if (!element) return Promise.resolve();
    
    return new Promise(resolve => {
        const start = performance.now();
        const startOpacity = parseFloat(getStyle(element, 'opacity')) || 1;
        
        function animate(currentTime) {
            const elapsed = currentTime - start;
            const progress = Math.min(elapsed / duration, 1);
            
            element.style.opacity = (startOpacity * (1 - progress)).toString();
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                element.style.display = 'none';
                resolve();
            }
        }
        
        requestAnimationFrame(animate);
    });
}

export function slideUp(element, duration = 300) {
    if (!element) return Promise.resolve();
    
    return new Promise(resolve => {
        const startHeight = element.offsetHeight;
        element.style.overflow = 'hidden';
        element.style.transition = `height ${duration}ms ease`;
        element.style.height = startHeight + 'px';
        
        requestAnimationFrame(() => {
            element.style.height = '0px';
            
            setTimeout(() => {
                element.style.display = 'none';
                element.style.height = '';
                element.style.overflow = '';
                element.style.transition = '';
                resolve();
            }, duration);
        });
    });
}

export function slideDown(element, duration = 300) {
    if (!element) return Promise.resolve();
    
    return new Promise(resolve => {
        element.style.display = 'block';
        const targetHeight = element.offsetHeight;
        element.style.height = '0px';
        element.style.overflow = 'hidden';
        element.style.transition = `height ${duration}ms ease`;
        
        requestAnimationFrame(() => {
            element.style.height = targetHeight + 'px';
            
            setTimeout(() => {
                element.style.height = '';
                element.style.overflow = '';
                element.style.transition = '';
                resolve();
            }, duration);
        });
    });
}

// 工具函数
export function ready(callback) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', callback);
    } else {
        callback();
    }
}

export function onResize(callback, debounceTime = 250) {
    let timeoutId;
    
    function handleResize() {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(callback, debounceTime);
    }
    
    window.addEventListener('resize', handleResize);
    
    // 返回清理函数
    return () => {
        window.removeEventListener('resize', handleResize);
        clearTimeout(timeoutId);
    };
}

// 默认导出
export default {
    $,
    $$,
    createElement,
    addClass,
    removeClass,
    toggleClass,
    hasClass,
    setStyle,
    getStyle,
    setAttributes,
    getAttributes,
    getElementRect,
    getElementOffset,
    getViewportSize,
    getScrollPosition,
    isElementVisible,
    isElementInViewport,
    findParent,
    findChildren,
    findSiblings,
    insertAfter,
    insertBefore,
    removeElement,
    replaceElement,
    empty,
    html,
    text,
    getFormData,
    setFormData,
    fadeIn,
    fadeOut,
    slideUp,
    slideDown,
    ready,
    onResize
};
