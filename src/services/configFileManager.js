const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

/**
 * 配置文件管理器
 * 负责配置文件的物理存储、文件操作和清理
 */
class ConfigFileManager {
    
    constructor() {
        // 配置缓存目录
        this.cacheDir = path.join(__dirname, '..', '..', 'data', 'config-cache');
        this.ensureCacheDir();
    }

    /**
     * 确保缓存目录存在
     * @private
     */
    async ensureCacheDir() {
        try {
            await fs.access(this.cacheDir);
        } catch (err) {
            if (err.code === 'ENOENT') {
                await fs.mkdir(this.cacheDir, { recursive: true });
                console.log(`创建配置缓存目录: ${this.cacheDir}`);
            } else {
                throw err;
            }
        }
    }

    /**
     * 生成安全的文件名
     * @param {string} subscriptionName - 订阅名称
     * @returns {string} 安全的文件名
     * @private
     */
    generateSafeFileName(subscriptionName) {
        // 移除或替换危险字符，生成安全的文件名
        const safeName = subscriptionName
            .replace(/[<>:"/\\|?*]/g, '_')  // 替换文件系统不允许的字符
            .replace(/\s+/g, '_')          // 替换空格
            .toLowerCase();
        
        // 添加哈希值以避免冲突
        const hash = crypto.createHash('md5').update(subscriptionName).digest('hex').substring(0, 8);
        return `${safeName}_${hash}.yaml`;
    }

    /**
     * 获取配置文件的完整路径
     * @param {string} subscriptionName - 订阅名称
     * @returns {string} 文件完整路径
     */
    getConfigFilePath(subscriptionName) {
        const fileName = this.generateSafeFileName(subscriptionName);
        return path.join(this.cacheDir, fileName);
    }

    /**
     * 保存配置到文件
     * @param {string} subscriptionName - 订阅名称
     * @param {string} configContent - 配置内容
     * @returns {Promise<string>} 保存的文件路径
     */
    async saveConfigFile(subscriptionName, configContent) {
        try {
            await this.ensureCacheDir();
            
            const filePath = this.getConfigFilePath(subscriptionName);
            await fs.writeFile(filePath, configContent, 'utf8');
            
            console.log(`配置文件已保存: ${filePath}`);
            return filePath;
        } catch (err) {
            console.error(`保存配置文件失败 (${subscriptionName}):`, err.message);
            throw err;
        }
    }

    /**
     * 从文件读取配置
     * @param {string} subscriptionName - 订阅名称
     * @returns {Promise<string|null>} 配置内容或null
     */
    async readConfigFile(subscriptionName) {
        try {
            const filePath = this.getConfigFilePath(subscriptionName);
            const content = await fs.readFile(filePath, 'utf8');
            
            console.log(`配置文件已读取: ${filePath}`);
            return content;
        } catch (err) {
            if (err.code === 'ENOENT') {
                console.log(`配置文件不存在: ${subscriptionName}`);
                return null;
            } else {
                console.error(`读取配置文件失败 (${subscriptionName}):`, err.message);
                throw err;
            }
        }
    }

    /**
     * 删除配置文件
     * @param {string} subscriptionName - 订阅名称
     * @returns {Promise<boolean>} 是否成功删除
     */
    async deleteConfigFile(subscriptionName) {
        try {
            const filePath = this.getConfigFilePath(subscriptionName);
            await fs.unlink(filePath);
            
            console.log(`配置文件已删除: ${filePath}`);
            return true;
        } catch (err) {
            if (err.code === 'ENOENT') {
                console.log(`配置文件不存在，无需删除: ${subscriptionName}`);
                return true;
            } else {
                console.error(`删除配置文件失败 (${subscriptionName}):`, err.message);
                return false;
            }
        }
    }

    /**
     * 检查配置文件是否存在
     * @param {string} subscriptionName - 订阅名称
     * @returns {Promise<boolean>} 文件是否存在
     */
    async configFileExists(subscriptionName) {
        try {
            const filePath = this.getConfigFilePath(subscriptionName);
            await fs.access(filePath);
            return true;
        } catch (err) {
            return false;
        }
    }

    /**
     * 获取配置文件信息
     * @param {string} subscriptionName - 订阅名称
     * @returns {Promise<object|null>} 文件信息或null
     */
    async getConfigFileInfo(subscriptionName) {
        try {
            const filePath = this.getConfigFilePath(subscriptionName);
            const stats = await fs.stat(filePath);
            
            return {
                filePath,
                size: stats.size,
                created: stats.birthtime,
                modified: stats.mtime,
                accessed: stats.atime
            };
        } catch (err) {
            if (err.code === 'ENOENT') {
                return null;
            } else {
                console.error(`获取配置文件信息失败 (${subscriptionName}):`, err.message);
                throw err;
            }
        }
    }

    /**
     * 验证配置文件完整性
     * @param {string} subscriptionName - 订阅名称
     * @param {string} expectedHash - 期望的哈希值
     * @returns {Promise<boolean>} 文件是否完整
     */
    async verifyConfigFile(subscriptionName, expectedHash) {
        try {
            const content = await this.readConfigFile(subscriptionName);
            if (!content) {
                return false;
            }
            
            const actualHash = crypto.createHash('sha256').update(content, 'utf8').digest('hex');
            return actualHash === expectedHash;
        } catch (err) {
            console.error(`验证配置文件失败 (${subscriptionName}):`, err.message);
            return false;
        }
    }

    /**
     * 清理缓存目录中的孤立文件（没有对应数据库记录的文件）
     * @param {Array<string>} validSubscriptionNames - 有效的订阅名称列表
     * @returns {Promise<number>} 清理的文件数量
     */
    async cleanupOrphanFiles(validSubscriptionNames) {
        try {
            await this.ensureCacheDir();
            
            const files = await fs.readdir(this.cacheDir);
            const validFileNames = validSubscriptionNames.map(name => this.generateSafeFileName(name));
            
            let cleanedCount = 0;
            
            for (const file of files) {
                if (file.endsWith('.yaml') && !validFileNames.includes(file)) {
                    try {
                        const filePath = path.join(this.cacheDir, file);
                        await fs.unlink(filePath);
                        console.log(`已清理孤立文件: ${filePath}`);
                        cleanedCount++;
                    } catch (err) {
                        console.error(`清理孤立文件失败 (${file}):`, err.message);
                    }
                }
            }
            
            if (cleanedCount > 0) {
                console.log(`共清理 ${cleanedCount} 个孤立的配置文件`);
            }
            
            return cleanedCount;
        } catch (err) {
            console.error('清理孤立文件失败:', err.message);
            return 0;
        }
    }

    /**
     * 获取缓存目录大小
     * @returns {Promise<object>} 目录大小信息
     */
    async getCacheDirSize() {
        try {
            await this.ensureCacheDir();
            
            const files = await fs.readdir(this.cacheDir);
            let totalSize = 0;
            let fileCount = 0;
            
            for (const file of files) {
                if (file.endsWith('.yaml')) {
                    try {
                        const filePath = path.join(this.cacheDir, file);
                        const stats = await fs.stat(filePath);
                        totalSize += stats.size;
                        fileCount++;
                    } catch (err) {
                        // 忽略单个文件的错误
                        console.warn(`获取文件大小失败 (${file}):`, err.message);
                    }
                }
            }
            
            return {
                totalSize,
                fileCount,
                totalSizeMB: Math.round((totalSize / 1024 / 1024) * 100) / 100,
                averageFileSize: fileCount > 0 ? Math.round(totalSize / fileCount) : 0
            };
        } catch (err) {
            console.error('获取缓存目录大小失败:', err.message);
            return {
                totalSize: 0,
                fileCount: 0,
                totalSizeMB: 0,
                averageFileSize: 0
            };
        }
    }

    /**
     * 清理所有缓存文件
     * @returns {Promise<number>} 清理的文件数量
     */
    async clearAllCache() {
        try {
            await this.ensureCacheDir();
            
            const files = await fs.readdir(this.cacheDir);
            let cleanedCount = 0;
            
            for (const file of files) {
                if (file.endsWith('.yaml')) {
                    try {
                        const filePath = path.join(this.cacheDir, file);
                        await fs.unlink(filePath);
                        cleanedCount++;
                    } catch (err) {
                        console.error(`删除缓存文件失败 (${file}):`, err.message);
                    }
                }
            }
            
            if (cleanedCount > 0) {
                console.log(`已清理所有缓存文件，共 ${cleanedCount} 个`);
            }
            
            return cleanedCount;
        } catch (err) {
            console.error('清理所有缓存文件失败:', err.message);
            return 0;
        }
    }
}

module.exports = ConfigFileManager; 