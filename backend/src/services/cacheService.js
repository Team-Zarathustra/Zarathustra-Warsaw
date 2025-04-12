import { logger } from '../api/logger/logger.js';

const CACHE_TTL = parseInt(process.env.CACHE_TTL || '86400', 10);
const MAX_CACHE_ITEMS = parseInt(process.env.MAX_CACHE_ITEMS || '1000', 10);

class Cache {
 constructor(options = {}) {
   this.name = options.name || 'default';
   this.maxItems = options.maxItems || MAX_CACHE_ITEMS;
   this.defaultTtl = options.defaultTtl || CACHE_TTL;
   this.store = new Map();
   this.accessLog = [];
   
   logger.info(`Initialized ${this.name} cache`, { 
     maxItems: this.maxItems, 
     defaultTtl: this.defaultTtl 
   });
   
   this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
 }
 
 async get(key) {
   const item = this.store.get(key);
   
   if (!item) {
     return undefined;
   }
   
   if (item.expiresAt && item.expiresAt < Date.now()) {
     this.store.delete(key);
     return undefined;
   }
   
   this.updateAccessLog(key);
   
   logger.debug(`Cache hit: ${this.name}:${key}`, { cacheHit: true });
   return item.value;
 }
 
 async set(key, value, ttl) {
   const ttlMs = ttl ? ttl * 1000 : this.defaultTtl * 1000;
   const expiresAt = ttlMs > 0 ? Date.now() + ttlMs : null;
   
   if (!this.store.has(key) && this.store.size >= this.maxItems) {
     this.evictLRU();
   }
   
   this.store.set(key, {
     value,
     expiresAt,
     createdAt: Date.now()
   });
   
   this.updateAccessLog(key);
   
   logger.debug(`Cache set: ${this.name}:${key}`, { 
     ttl: ttl || this.defaultTtl,
     expiresAt: expiresAt ? new Date(expiresAt).toISOString() : 'never'
   });
   
   return true;
 }
 
 async delete(key) {
   const result = this.store.delete(key);
   this.accessLog = this.accessLog.filter(entry => entry.key !== key);
   return result;
 }
 
 updateAccessLog(key) {
   this.accessLog = this.accessLog.filter(entry => entry.key !== key);
   
   this.accessLog.push({
     key,
     accessedAt: Date.now()
   });
 }

 evictLRU() {
   if (this.accessLog.length === 0) return;
   
   this.accessLog.sort((a, b) => a.accessedAt - b.accessedAt);
   
   const oldest = this.accessLog.shift();
   this.store.delete(oldest.key);
   
   logger.debug(`Cache LRU eviction: ${this.name}:${oldest.key}`);
 }
 
 cleanup() {
   const now = Date.now();
   let expiredCount = 0;
   
   for (const [key, item] of this.store.entries()) {
     if (item.expiresAt && item.expiresAt < now) {
       this.store.delete(key);
       expiredCount++;
     }
   }
   
   this.accessLog = this.accessLog.filter(entry => this.store.has(entry.key));
   
   if (expiredCount > 0) {
     logger.debug(`Cache cleanup: ${this.name} removed ${expiredCount} expired items`);
   }
 }
 
 getStats() {
   let expiredCount = 0;
   let totalSize = 0;
   const now = Date.now();
   
   for (const [key, item] of this.store.entries()) {
     if (item.expiresAt && item.expiresAt < now) {
       expiredCount++;
     }
     totalSize += key.length;
     totalSize += JSON.stringify(item.value).length;
   }
   
   return {
     name: this.name,
     size: this.store.size,
     maxSize: this.maxItems,
     expired: expiredCount,
     totalSize: `~${Math.round(totalSize / 1024)} KB`
   };
 }
 
 async clear() {
   this.store.clear();
   this.accessLog = [];
   logger.info(`Cache cleared: ${this.name}`);
   return true;
 }
 
 destroy() {
   clearInterval(this.cleanupInterval);
   this.store.clear();
   this.accessLog = [];
   logger.info(`Cache destroyed: ${this.name}`);
 }
}

export const cache = new Cache({
 name: 'app-cache',
 maxItems: 1000,
 defaultTtl: 24 * 60 * 60
});

export const getCacheStats = () => {
 return [cache.getStats()];
};

export const clearCache = async () => {
 await cache.clear();
 return true;
};