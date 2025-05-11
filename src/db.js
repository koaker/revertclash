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
                        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                    )
                `, (err) => {
                    if (err) {
                        console.error('创建订阅token表失败:', err.message);
                        reject(err);
                    } else {
                        console.log('订阅token表已就绪');
                        resolve();
                    }
                });
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

// 获取单条记录并返回Promise
function get(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(row);
        });
    });
}

// 获取多条记录并返回Promise
function all(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(rows);
        });
    });
}

// 关闭数据库连接
function close() {
    return new Promise((resolve, reject) => {
        db.close((err) => {
            if (err) {
                reject(err);
                return;
            }
            resolve();
        });
    });
}

module.exports = {
    run,
    get,
    all,
    close,
    checkInitialAdmin,
    initDatabase
}; 