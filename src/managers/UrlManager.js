// 引入db操作
const { all, run, get } = require('../db');
/*
CREATE TABLE IF NOT EXISTS user_urls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    url TEXT NOT NULL, 
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE (user_id, name)
)
*/

class URLManager {
    // 输入 userID 输出用户的所有URL
    async getUrlsByUserId(userId) {
        try {
            const query = `
                SELECT id, name, url, created_at, updated_at
                FROM user_urls
                WHERE user_id = ?
            `;
            return await all(query, [userId]);
        } catch (error) {
            console.error('获取用户URL列表失败:', error.message);
            throw error;
        }
    }
    // 输入 userID 和 name 、url 添加用户URL
    async addUrl(userId, name, url) {
        try {
            const insertQuery = `
                INSERT INTO user_urls (user_id, name, url)
                VALUES (?, ?, ?)
            `;
            const result = await run(insertQuery, [userId, name, url]);
            const selectQuesry = `
                SELECT id, name, url, created_at, updated_at
                FROM user_urls
                WHERE id = ? AND user_id = ?
            `;
            const urlInfo = await get(selectQuesry, [result.lastID, userId]);
            return await urlInfo;
        } catch (error) {
            console.error('添加用户URL失败:', error.message);
            throw error;
        }
    }

    // 输入 userId 、 id 、name、url 更新用户URL
    async updateUrl(userId, id, name, url) {
        try {
            const query = `
                UPDATE user_urls
                SET name = ?, url = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ? AND user_id = ?
            `;
            const result = await run(query, [name, url, id, userId]);
            if (result.changes === 0) {
                throw new Error('更新失败，可能是ID不存在或没有权限');
            }
            return { success: true, message: 'URL更新成功' };
        } catch (error) {
            console.error('更新用户URL失败:', error.message);
            throw error;
        }
    }
    // 输入 userId 和 id 删除用户URL
    async deleteUrl(userId, id) {
        try {
            const query = `
                DELETE FROM user_urls
                WHERE id = ? AND user_id = ?
            `;
            const result = await run(query, [id, userId]);
            if (result.changes === 0) {
                throw new Error('删除失败，可能是ID不存在或没有权限');
            }
            return { success: true, message: 'URL删除成功' };
        } catch (error) {
            console.error('删除用户URL失败:', error.message);
            throw error;
        }
    }
}
// 
module.exports = new URLManager();