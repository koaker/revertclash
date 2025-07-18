const { all, run, get } = require('../db');

/*
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    is_admin INTEGER DEFAULT 0,
    is_first_login INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
)
*/

class UserManager {
    // 检查用户名是否存在
    // check if username exists
    // ユーザー名が存在するかどうかを確認します yuuzaa mei ga sonzai suru kadouka wo kakunin shimasu
    async usernameExists(username) {
        try {
            const existingUser = await get('SELECT * FROM users WHERE username = ?', [username]);
            return existingUser !== undefined;
        } catch (error) {
            console.error('检查用户名是否存在时出错:', error);
            throw error;
        }
    }

    // 检查是否存在管理员
    // check if there has admin
    // 管理者が存在するかどうかを確認します kanrisha ga sonzai suru kadouka wo kakunin shimasu
    async adminExists() {
        try {
            const admin = await get('SELECT * FROM users WHERE is_admin = 1');
            return admin !== undefined;
        } catch (error) {
            console.error('检查管理员是否存在时出错:', error);
            throw error;
        }
    }

    // 检查用户Id是否为管理员
    // check if userId is admin
    // ユーザーIDが管理者かどうかを確認します yuuzaa ID ga kanrisha ka douka wo kakunin shimasu
    async isUserAdmin(userId) {
        try {
            const user = await get('SELECT is_admin FROM users WHERE id = ?', [userId]);
            if (!user) {
                throw new Error('用户不存在');
            }
            return user.is_admin === 1;
        } catch (error) {
            console.error('检查用户是否为管理员时出错:', error);
            throw error;
        }
    }
    // 插入新用户到数据库 密码为hash密码
    // insert new user into the database
    // 新しいユーザーをデータベースに挿入します atarashii yuuzaa wo deetabeesu ni nyuusou shimasu
    async createUser(username, passwordHash, isAdmin = false) {
        try {
            const result = await run(
                `INSERT INTO users (username, password_hash, is_admin) VALUES (?, ?, ?)`,
                [username, passwordHash, isAdmin ? 1 : 0]
            );
            return result.lastID;
        } catch (error) {
            console.error('插入新用户时出错:', error);
            throw error;
        }
    }

    // 根据用户名获得所有信息
    // get user by username
    // ユーザー名でユーザー情報を取得します
    async getUserByUsername(username) {
        try {
            const user = await get('SELECT * FROM users WHERE username = ?', [username]);
            return user;
        } catch (error) {
            console.error('根据用户名获取用户信息时出错:', error);
            throw error;
        }
    }

    // 根据用户用户ID修改密码
    // update user password by user ID
    // ユーザーIDでユーザーパスワードを更新します
    async changeUserPasswordByUserId(userId, newPasswordHash) {
        try {
            await run(
                'UPDATE users SET password_hash = ? WHERE id = ?',
                [newPasswordHash, userId]
            );
        } catch (error) {
            console.error('根据用户ID修改密码时出错:', error);
            throw error;
        }
    }

    // 获取用户列表
    // get all users list
    // ユーザーリストを取得します
    async getAllUsers() {
        try {
            const users = await all(
                'SELECT id, username, is_admin, created_at, updated_at FROM users'
            );
            
            console.log(`[userAuth] 获取到 ${users.length} 个用户`);
            return users.map(user => this._formatUserInfo(user));
        } catch (error) {
            console.error(`[userAuth] 获取用户列表失败:`, error);
            throw error;
        }
    }

    // 检查数据库表是否存在
    async checkTableExists() {
        try {
            const result = await get("SELECT name FROM sqlite_master WHERE type='table' AND name='users'");
            return result !== undefined;
        } catch (error) {
            console.error('检查用户表是否存在时出错:', error);
            throw error;
        }
    }

    // 根据用户Id获取信息
    async getUserById(userId) {
        try {
            const user = await get('SELECT * FROM users WHERE id = ?', [userId]);
            if (!user) {
                throw new Error('用户不存在');
            }
            
            return this._formatUserInfo(user);
        } catch (error) {
            console.error('根据用户ID获取用户信息时出错:', error);
            throw error;
        }
    }

    // 根据用户Id确定用户是否存在
    async userExists(userId) {
        try {
            const user = await get('SELECT id FROM users WHERE id = ?', [userId]);
            return user !== undefined;
        } catch (error) {
            console.error('检查用户是否存在时出错:', error);
            throw error;
        }
    }

    // 删除用户
    async deleteUserById(userId) {
        try {
            const result = await run('DELETE FROM users WHERE id = ?', [userId]);
            if (result.changes === 0) {
                throw new Error('删除用户失败，可能是ID不存在或没有权限');
            }
            return { success: true, message: '用户删除成功' };
        } catch (error) {
            console.error('删除用户时出错:', error);
            throw error;
        }
    }

    // 获取管理员数量
    async getAdminCount() {
        try {
            const result = await get('SELECT COUNT(*) as count FROM users WHERE is_admin = 1');
            return result.count;
        } catch (error) {
            console.error('获取管理员数量时出错:', error);
            throw error;
        }
    }

    // 按照格式化输出用户信息
    _formatUserInfo(user) {
        return {
            id: user.id,
            username: user.username,
            isAdmin: user.is_admin === 1,
            createdAt: user.created_at,
            updatedAt: user.updated_at,
            isFirstLogin: user.is_first_login === 1,
        };
    }

    // 获得userId 对应的hash密码
    async getPasswordHashByUserId(userId) {
        try {
            const user = await get('SELECT password_hash FROM users WHERE id = ?', [userId]);
            if (!user) {
                throw new Error('用户不存在');
            }
            return user.password_hash;
        } catch (error) {
            console.error('根据用户ID获取密码哈希时出错:', error);
            throw error;
        }
    }
    // 首次登录标志更新
    async updateFirstLoginFlag(userId) {
        try {
            await run(
                'UPDATE users SET is_first_login = 0 WHERE id = ?',
                [userId]
            );
        } catch (error) {
            console.error('更新首次登录标志时出错:', error);
            throw error;
        }
    }
}

module.exports = new UserManager();
