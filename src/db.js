const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// 确保数据目录存在
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// 数据库文件路径
const DB_PATH = path.join(dataDir, 'revertclash.db');

// 创建数据库连接
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('数据库连接失败:', err.message);
    } else {
        console.log('已成功连接到SQLite数据库');
        // 不再直接调用initDatabase，而是在模块导出前初始化
    }
});

// 初始化数据库表 - 返回Promise确保完成
function initDatabase() {
    return new Promise((resolve, reject) => {
        console.log('正在初始化数据库表...');
        // 启用外键约束
        db.run('PRAGMA foreign_keys = ON', (err) => {
            if (err) {
                console.error('启用外键约束失败:', err.message);
                reject(err);
                return;
            }

            // 创建用户表
            db.run(`
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT UNIQUE NOT NULL,
                    password_hash TEXT NOT NULL,
                    is_admin INTEGER DEFAULT 0,
                    is_first_login INTEGER DEFAULT 1,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
                )
            `, (err) => {
                if (err) {
                    console.error('创建用户表失败:', err.message);
                    reject(err);
                    return;
                }
                console.log('用户表已就绪');
                
                // 创建订阅token表
                db.run(`
                    CREATE TABLE IF NOT EXISTS subscription_tokens (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id INTEGER NOT NULL,
                        token TEXT UNIQUE NOT NULL,
                        name TEXT NOT NULL,
                        config_types TEXT NOT NULL, 
                        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                        expires_at TEXT,
                        is_active INTEGER DEFAULT 1,
                        last_accessed TEXT,
                        access_count INTEGER DEFAULT 0,
                        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                    )
                `, (err) => {
                    if (err) {
                        console.error('创建订阅token表失败:', err.message);
                        reject(err);
                        return;
                    }
                    console.log('订阅token表已就绪');
                    
                    // 检查并升级订阅Token表，添加访问统计字段
                    upgradeSubscriptionTokensTable()
                        .then(() => resolve())
                        .catch(err => {
                            console.error('升级订阅token表失败:', err.message);
                            reject(err);
                        });
                });
            });
        });
    });
}

// 升级订阅Token表，添加访问统计相关字段
function upgradeSubscriptionTokensTable() {
    return new Promise((resolve, reject) => {
        // 先检查last_accessed字段是否存在
        db.get("PRAGMA table_info(subscription_tokens)", (err, rows) => {
            if (err) {
                reject(err);
                return;
            }
            
            // 查询表结构
            db.all("PRAGMA table_info(subscription_tokens)", (err, rows) => {
                if (err) {
                    reject(err);
                    return;
                }
                
                // 检查是否需要添加字段
                const hasLastAccessed = rows.some(row => row.name === 'last_accessed');
                const hasAccessCount = rows.some(row => row.name === 'access_count');
                
                const promises = [];
                
                // 添加缺失的字段
                if (!hasLastAccessed) {
                    console.log('正在添加last_accessed字段到subscription_tokens表...');
                    promises.push(
                        run("ALTER TABLE subscription_tokens ADD COLUMN last_accessed TEXT")
                    );
                }
                
                if (!hasAccessCount) {
                    console.log('正在添加access_count字段到subscription_tokens表...');
                    promises.push(
                        run("ALTER TABLE subscription_tokens ADD COLUMN access_count INTEGER DEFAULT 0")
                    );
                }
                
                // 执行所有升级
                if (promises.length > 0) {
                    Promise.all(promises)
                        .then(() => {
                            console.log('订阅token表升级完成');
                            resolve();
                        })
                        .catch(err => {
                            console.error('订阅token表升级失败:', err.message);
                            reject(err);
                        });
                } else {
                    console.log('订阅token表已是最新结构，无需升级');
                    resolve();
                }
            });
        });
    });
}

// 检查是否需要设置初始管理员账号
async function checkInitialAdmin() {
    try {
        await initDatabase(); // 确保表已创建
        
        return new Promise((resolve, reject) => {
            db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
                if (err) {
                    console.error('检查用户数量失败:', err.message);
                    reject(err);
                    return;
                }
                
                if (row.count === 0) {
                    console.log('数据库中没有用户，需要进行初始设置');
                    global.needInitialSetup = true;
                } else {
                    console.log(`数据库中已有${row.count}位用户`);
                    global.needInitialSetup = false;
                }
                resolve(global.needInitialSetup);
            });
        });
    } catch (err) {
        console.error('初始管理员检查失败:', err);
        global.needInitialSetup = true; // 出错时默认需要初始设置
        return global.needInitialSetup;
    }
}

// 运行SQL查询并返回Promise
function run(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) {
                reject(err);
                return;
            }
            resolve({ lastID: this.lastID, changes: this.changes });
        });
    });
}

// 执行单行查询
function get(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, function(err, row) {
            if (err) {
                reject(err);
                return;
            }
            resolve(row);
        });
    });
}

// 执行多行查询
function all(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, function(err, rows) {
            if (err) {
                reject(err);
                return;
            }
            resolve(rows);
        });
    });
}

// 封装查询函数为Postgres风格的API，便于后续迁移
function query(sql, params = []) {
    return new Promise((resolve, reject) => {
        // 检查SQL是否是SELECT查询
        if (sql.trim().toUpperCase().startsWith('SELECT') || sql.includes('RETURNING')) {
            db.all(sql, params, function(err, rows) {
                if (err) {
                    reject(err);
                    return;
                }
                resolve({ rows });
            });
        } else {
            db.run(sql, params, function(err) {
                if (err) {
                    reject(err);
                    return;
                }
                
                // 如果是带RETURNING的语句，尝试获取返回的行
                if (sql.includes('RETURNING')) {
                    db.all(`SELECT * FROM (${sql.replace('RETURNING', 'AND')}) LIMIT 1`, params, (err, rows) => {
                        if (err) {
                            // 如果失败，至少返回lastID
                            resolve({ 
                                rows: [{id: this.lastID}],
                                lastID: this.lastID,
                                changes: this.changes
                            });
                        } else {
                            resolve({ 
                                rows,
                                lastID: this.lastID,
                                changes: this.changes
                            });
                        }
                    });
                } else {
                    resolve({ 
                        rows: [],
                        lastID: this.lastID, 
                        changes: this.changes 
                    });
                }
            });
        }
    });
}

// 确保在导出前初始化数据库
module.exports = {
    initDatabase,
    checkInitialAdmin,
    run,
    get,
    all,
    query
}; 