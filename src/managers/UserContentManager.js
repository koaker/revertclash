// 引入db操作
const { all, run, get } = require('../db');
/*
CREATE TABLE IF NOT EXISTS user_custom_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    config TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE (user_id, name)
)
*/

class UserContentManager {
    // 输入 userID 输出用户的所有自定义配置
    async getUserCustomConfigs(userId) {
        const sql = 'SELECT * FROM user_custom_configs WHERE user_id = ?';
        const params = [userId];
        return await all(sql, params);
    }

    // 输入 userID 和 name 、config 添加用户自定义配置
    async addUserCustomConfig(userId, name, config) {
        const sql = 'INSERT INTO user_custom_configs (user_id, name, config) VALUES (?, ?, ?)';
        const params = [userId, name, config];
        const result = await run(sql, params);
        const selectQuery = 'SELECT * FROM user_custom_configs WHERE id = ? AND user_id = ?';
        const customConfig = await get(selectQuery, [result.lastID, userId]);
        return customConfig;
    }

    // 输入 userId 、 id 、name、config 更新用户自定义配置
    async updateUserCustomConfig(userId, id, name, config) {
        const sql = 'UPDATE user_custom_configs SET name = ?, config = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?';
        const params = [name, config, id, userId];
        return await run(sql, params);
    }
    
    // 输入 userId 和 id 删除用户自定义配置
    async deleteUserCustomConfig(userId, id) {
        const sql = 'DELETE FROM user_custom_configs WHERE id = ? AND user_id = ?';
        const params = [id, userId];
        return await run(sql, params);
    }

    async getConfigById(userId, id) {
        const sql = 'SELECT * FROM user_custom_configs WHERE id = ? AND user_id = ?';
        const params = [id, userId];
        return await get(sql, params);
    }
}

module.exports = new UserContentManager();



