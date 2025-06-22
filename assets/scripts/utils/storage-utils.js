/*
 * 存储工具模块
 * 提供localStorage、sessionStorage、IndexedDB等存储功能
 */

import { APP_CONFIG } from '../core/config.js';

// 存储类型枚举
export const STORAGE_TYPES = {
    LOCAL: 'localStorage',
    SESSION: 'sessionStorage',
    INDEXED_DB: 'indexedDB',
    MEMORY: 'memory'
};

// 内存存储实现
class MemoryStorage {
    constructor() {
        this.data = new Map();
    }
    
    getItem(key) {
        return this.data.get(key) || null;
    }
    
    setItem(key, value) {
        this.data.set(key, value);
    }
    
    removeItem(key) {
        this.data.delete(key);
    }
    
    clear() {
        this.data.clear();
    }
    
    key(index) {
        const keys = Array.from(this.data.keys());
        return keys[index] || null;
    }
    
    get length() {
        return this.data.size;
    }
}

// 存储管理器类
export class StorageManager {
    constructor(type = STORAGE_TYPES.LOCAL, prefix = '') {
        this.type = type;
        this.prefix = prefix;
        this.storage = this.getStorage(type);
    }
    
    // 获取存储实例
    getStorage(type) {
        switch (type) {
            case STORAGE_TYPES.LOCAL:
                return typeof localStorage !== 'undefined' ? localStorage : new MemoryStorage();
            case STORAGE_TYPES.SESSION:
                return typeof sessionStorage !== 'undefined' ? sessionStorage : new MemoryStorage();
            case STORAGE_TYPES.MEMORY:
                return new MemoryStorage();
            default:
                return new MemoryStorage();
        }
    }
    
    // 生成完整的键名
    getKey(key) {
        return this.prefix ? `${this.prefix}${key}` : key;
    }
    
    // 设置数据
    set(key, value, options = {}) {
        try {
            const fullKey = this.getKey(key);
            const data = {
                value,
                timestamp: Date.now(),
                expires: options.expires ? Date.now() + options.expires : null,
                version: options.version || '1.0'
            };
            
            const serialized = JSON.stringify(data);
            this.storage.setItem(fullKey, serialized);
            return true;
        } catch (error) {
            console.error('Storage set error:', error);
            return false;
        }
    }
    
    // 获取数据
    get(key, defaultValue = null) {
        try {
            const fullKey = this.getKey(key);
            const serialized = this.storage.getItem(fullKey);
            
            if (!serialized) {
                return defaultValue;
            }
            
            const data = JSON.parse(serialized);
            
            // 检查是否过期
            if (data.expires && Date.now() > data.expires) {
                this.remove(key);
                return defaultValue;
            }
            
            return data.value;
        } catch (error) {
            console.error('Storage get error:', error);
            return defaultValue;
        }
    }
    
    // 移除数据
    remove(key) {
        try {
            const fullKey = this.getKey(key);
            this.storage.removeItem(fullKey);
            return true;
        } catch (error) {
            console.error('Storage remove error:', error);
            return false;
        }
    }
    
    // 清空所有数据
    clear() {
        try {
            if (this.prefix) {
                // 只清除带前缀的数据
                const keys = this.keys();
                keys.forEach(key => this.remove(key));
            } else {
                this.storage.clear();
            }
            return true;
        } catch (error) {
            console.error('Storage clear error:', error);
            return false;
        }
    }
    
    // 获取所有键
    keys() {
        try {
            const keys = [];
            const prefixLength = this.prefix.length;
            
            for (let i = 0; i < this.storage.length; i++) {
                const key = this.storage.key(i);
                if (key && key.startsWith(this.prefix)) {
                    keys.push(key.substring(prefixLength));
                }
            }
            
            return keys;
        } catch (error) {
            console.error('Storage keys error:', error);
            return [];
        }
    }
    
    // 检查键是否存在
    has(key) {
        return this.get(key) !== null;
    }
    
    // 获取存储大小
    size() {
        return this.keys().length;
    }
    
    // 获取存储使用情况
    getUsage() {
        try {
            let totalSize = 0;
            const keys = this.keys();
            
            keys.forEach(key => {
                const value = this.storage.getItem(this.getKey(key));
                if (value) {
                    totalSize += value.length;
                }
            });
            
            return {
                keys: keys.length,
                size: totalSize,
                sizeFormatted: this.formatBytes(totalSize)
            };
        } catch (error) {
            console.error('Storage usage error:', error);
            return { keys: 0, size: 0, sizeFormatted: '0 B' };
        }
    }
    
    // 格式化字节数
    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    // 导出数据
    export() {
        try {
            const data = {};
            const keys = this.keys();
            
            keys.forEach(key => {
                data[key] = this.get(key);
            });
            
            return {
                data,
                timestamp: Date.now(),
                version: APP_CONFIG.version,
                type: this.type,
                prefix: this.prefix
            };
        } catch (error) {
            console.error('Storage export error:', error);
            return null;
        }
    }
    
    // 导入数据
    import(exportData, options = {}) {
        try {
            if (!exportData || !exportData.data) {
                throw new Error('Invalid export data');
            }
            
            const { clearFirst = false, skipExisting = false } = options;
            
            if (clearFirst) {
                this.clear();
            }
            
            Object.entries(exportData.data).forEach(([key, value]) => {
                if (skipExisting && this.has(key)) {
                    return;
                }
                this.set(key, value);
            });
            
            return true;
        } catch (error) {
            console.error('Storage import error:', error);
            return false;
        }
    }
}

// IndexedDB 存储管理器
export class IndexedDBManager {
    constructor(dbName = 'MarkdownEditor', version = 1) {
        this.dbName = dbName;
        this.version = version;
        this.db = null;
    }
    
    // 初始化数据库
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // 创建对象存储
                if (!db.objectStoreNames.contains('documents')) {
                    const store = db.createObjectStore('documents', { keyPath: 'id', autoIncrement: true });
                    store.createIndex('name', 'name', { unique: false });
                    store.createIndex('created', 'created', { unique: false });
                    store.createIndex('modified', 'modified', { unique: false });
                }
                
                if (!db.objectStoreNames.contains('settings')) {
                    db.createObjectStore('settings', { keyPath: 'key' });
                }
            };
        });
    }
    
    // 保存文档
    async saveDocument(document) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['documents'], 'readwrite');
            const store = transaction.objectStore('documents');
            
            const data = {
                ...document,
                modified: Date.now()
            };
            
            if (!data.created) {
                data.created = Date.now();
            }
            
            const request = store.put(data);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    
    // 获取文档
    async getDocument(id) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['documents'], 'readonly');
            const store = transaction.objectStore('documents');
            const request = store.get(id);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    
    // 获取所有文档
    async getAllDocuments() {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['documents'], 'readonly');
            const store = transaction.objectStore('documents');
            const request = store.getAll();
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    
    // 删除文档
    async deleteDocument(id) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['documents'], 'readwrite');
            const store = transaction.objectStore('documents');
            const request = store.delete(id);
            
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }
    
    // 搜索文档
    async searchDocuments(query) {
        const documents = await this.getAllDocuments();
        
        return documents.filter(doc => 
            doc.name.toLowerCase().includes(query.toLowerCase()) ||
            doc.content.toLowerCase().includes(query.toLowerCase())
        );
    }
}

// 缓存管理器
export class CacheManager {
    constructor(maxSize = 100, ttl = 3600000) { // 默认1小时TTL
        this.cache = new Map();
        this.maxSize = maxSize;
        this.ttl = ttl;
    }
    
    // 设置缓存
    set(key, value, customTTL = null) {
        const expires = Date.now() + (customTTL || this.ttl);
        
        // 如果缓存已满，删除最旧的项
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        
        this.cache.set(key, {
            value,
            expires,
            accessed: Date.now()
        });
    }
    
    // 获取缓存
    get(key) {
        const item = this.cache.get(key);
        
        if (!item) {
            return null;
        }
        
        // 检查是否过期
        if (Date.now() > item.expires) {
            this.cache.delete(key);
            return null;
        }
        
        // 更新访问时间
        item.accessed = Date.now();
        
        return item.value;
    }
    
    // 删除缓存
    delete(key) {
        return this.cache.delete(key);
    }
    
    // 清空缓存
    clear() {
        this.cache.clear();
    }
    
    // 清理过期缓存
    cleanup() {
        const now = Date.now();
        for (const [key, item] of this.cache.entries()) {
            if (now > item.expires) {
                this.cache.delete(key);
            }
        }
    }
    
    // 获取缓存统计
    getStats() {
        return {
            size: this.cache.size,
            maxSize: this.maxSize,
            hitRate: this.hitRate || 0
        };
    }
}

// 创建默认存储管理器实例
export const localStorage = new StorageManager(
    STORAGE_TYPES.LOCAL,
    APP_CONFIG.storage.prefix
);

export const sessionStorage = new StorageManager(
    STORAGE_TYPES.SESSION,
    APP_CONFIG.storage.prefix
);

export const memoryStorage = new StorageManager(STORAGE_TYPES.MEMORY);

export const indexedDB = new IndexedDBManager();

export const cache = new CacheManager();

// 默认导出
export default {
    STORAGE_TYPES,
    StorageManager,
    IndexedDBManager,
    CacheManager,
    localStorage,
    sessionStorage,
    memoryStorage,
    indexedDB,
    cache
};
