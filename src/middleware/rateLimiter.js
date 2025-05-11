/**
 * 基于内存的请求频率限制中间件
 * 控制相同IP在指定时间窗口内的请求次数
 */

// 存储IP访问记录的Map
// key: IP地址, value: { count: 访问次数, resetTime: 重置时间 }
const ipRequestMap = new Map();

/**
 * 清理过期的IP记录
 */
function cleanupExpiredRecords() {
    const now = Date.now();
    for (const [ip, record] of ipRequestMap.entries()) {
        if (record.resetTime <= now) {
            ipRequestMap.delete(ip);
        }
    }
}

// 每5分钟执行一次清理
setInterval(cleanupExpiredRecords, 5 * 60 * 1000);

/**
 * 创建频率限制中间件
 * @param {Object} options 配置选项
 * @param {number} options.windowMs 时间窗口，单位毫秒（默认1分钟）
 * @param {number} options.maxRequests 窗口期内最大请求次数（默认60次）
 * @param {string} options.message 超过限制时的错误信息
 * @param {boolean} options.statusCode HTTP状态码（默认429）
 * @returns {Function} Express中间件函数
 */
function createLimiter(options = {}) {
    const {
        windowMs = 60 * 1000, // 默认1分钟
        maxRequests = 60,     // 默认每分钟60次请求
        message = '请求过于频繁，请稍后再试',
        statusCode = 429      // Too Many Requests
    } = options;
    
    return (req, res, next) => {
        // 获取客户端IP
        const ip = req.clientIp || req.ip || '127.0.0.1';
        
        const now = Date.now();
        
        // 检查IP是否已有记录
        if (ipRequestMap.has(ip)) {
            const record = ipRequestMap.get(ip);
            
            // 检查是否需要重置计数器
            if (record.resetTime <= now) {
                // 重置
                record.count = 1;
                record.resetTime = now + windowMs;
            } else {
                // 增加计数
                record.count += 1;
                
                // 检查是否超过限制
                if (record.count > maxRequests) {
                    // 计算剩余时间（毫秒）
                    const resetTime = record.resetTime;
                    const remainingMs = resetTime - now;
                    const remainingSec = Math.ceil(remainingMs / 1000);
                    
                    // 设置响应头
                    res.setHeader('Retry-After', remainingSec);
                    res.setHeader('X-RateLimit-Limit', maxRequests);
                    res.setHeader('X-RateLimit-Remaining', 0);
                    res.setHeader('X-RateLimit-Reset', Math.ceil(resetTime / 1000));
                    
                    // 记录警告日志
                    console.warn(`[安全警告] IP访问频率过高: ${ip}, 已达 ${record.count}/${maxRequests} 次`);
                    
                    return res.status(statusCode).json({
                        error: message,
                        retryAfter: remainingSec
                    });
                }
            }
        } else {
            // 新建记录
            ipRequestMap.set(ip, {
                count: 1,
                resetTime: now + windowMs
            });
        }
        
        // 设置访问信息头
        const record = ipRequestMap.get(ip);
        res.setHeader('X-RateLimit-Limit', maxRequests);
        res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - record.count));
        res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));
        
        next();
    };
}

/**
 * 手动检查IP是否受到限制
 * @param {string} ip 客户端IP
 * @param {number} maxRequests 最大请求次数
 * @returns {boolean} 如果未超过限制返回true，否则返回false
 */
function checkIpAccess(ip, maxRequests = 60) {
    const now = Date.now();
    
    // 检查IP是否已有记录
    if (ipRequestMap.has(ip)) {
        const record = ipRequestMap.get(ip);
        
        // 检查是否需要重置计数器
        if (record.resetTime <= now) {
            // 重置
            record.count = 1;
            record.resetTime = now + 60 * 1000; // 1分钟窗口
            return true;
        } else {
            // 增加计数
            record.count += 1;
            
            // 检查是否超过限制
            if (record.count > maxRequests) {
                return false;
            }
            return true;
        }
    } else {
        // 新建记录
        ipRequestMap.set(ip, {
            count: 1,
            resetTime: now + 60 * 1000 // 1分钟窗口
        });
        return true;
    }
}

/**
 * 获取IP当前的请求统计
 * @param {string} ip 客户端IP
 * @returns {Object|null} 统计信息或null
 */
function getIpStats(ip) {
    if (!ipRequestMap.has(ip)) {
        return null;
    }
    
    const record = ipRequestMap.get(ip);
    const now = Date.now();
    
    return {
        count: record.count,
        resetTime: record.resetTime,
        remainingMs: Math.max(0, record.resetTime - now),
        remainingSec: Math.ceil(Math.max(0, record.resetTime - now) / 1000)
    };
}

/**
 * 重置指定IP的请求计数
 * @param {string} ip 客户端IP
 */
function resetIpCounter(ip) {
    ipRequestMap.delete(ip);
}

/**
 * 获取所有IP的当前请求统计
 * @returns {Object} IP统计信息的Map
 */
function getAllIpStats() {
    const stats = {};
    const now = Date.now();
    
    for (const [ip, record] of ipRequestMap.entries()) {
        stats[ip] = {
            count: record.count,
            resetTime: record.resetTime,
            remainingMs: Math.max(0, record.resetTime - now),
            remainingSec: Math.ceil(Math.max(0, record.resetTime - now) / 1000)
        };
    }
    
    return stats;
}

module.exports = {
    createLimiter,
    checkIpAccess,
    getIpStats,
    resetIpCounter,
    getAllIpStats
}; 