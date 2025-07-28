const bcrypt = require('bcrypt');
const db = require('../db');
const UserManager = require('../managers/UserManager');

// 密码加密的盐轮数
const SALT_ROUNDS = 10;

// 注册新用户
async function registerUser(username, password, isAdmin = false) {
    console.log(`[userAuth] 开始注册用户: ${username}, isAdmin=${isAdmin}`);
    try {
        // 检查用户名是否已存在
        console.log(`[userAuth] 检查用户名 ${username} 是否存在`);
        
        const userExists = await UserManager.usernameExists(username);
        if (userExists) {
            console.log(`[userAuth] 用户名 ${username} 已存在，注册失败`);
            throw new Error('用户名已存在');
        }

        // 对密码进行加密
        console.log(`[userAuth] 对密码进行哈希加密`);
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

        // 插入新用户
        console.log(`[userAuth] 插入新用户到数据库: ${username}`);
        const userId = await UserManager.createUser(username, passwordHash, isAdmin);
        if (!userId) {
            throw new Error('插入新用户失败');
        }

        console.log(`[userAuth] 用户 ${username} 创建成功，ID: ${userId}, isAdmin: ${isAdmin}`);

        return {
            id: userId,
            username,
            isAdmin
        };
    } catch (error) {
        console.error(`[userAuth] 注册用户失败:`, error);
        throw error;
    }
}

// 用户登录验证
async function authenticateUser(username, password) {
    console.log(`[userAuth] 验证用户: ${username}`);
    try {
        // 查找用户
        console.log(`[userAuth] 查询用户: ${username}`);
        const user = await UserManager.getUserByUsername(username);
        if (!user) {
            console.log(`[userAuth] 用户名 ${username} 不存在`);
            return { success: false, message: '用户名不存在' };
        }

        // 验证密码
        console.log(`[userAuth] 验证用户 ${username} 的密码`);
        const passwordMatch = await bcrypt.compare(password, user.password_hash);
        if (!passwordMatch) {
            console.log(`[userAuth] 用户 ${username} 密码错误`);
            return { success: false, message: '密码错误' };
        }

        // 如果是首次登录，更新标志
        if (user.is_first_login === 1) {
            console.log(`[userAuth] 用户 ${username} 首次登录，更新首次登录标志`);
            await UserManager.updateFirstLoginFlag(user.id);
        }

        console.log(`[userAuth] 用户 ${username} 验证成功，ID: ${user.id}, 是否管理员: ${user.is_admin === 1}, 是否首次登录: ${user.is_first_login === 1}`);
        
        // 返回验证成功信息
        return {
            success: true,
            user: {
                id: user.id,
                username: user.username,
                isAdmin: user.is_admin === 1,
                isFirstLogin: user.is_first_login === 1
            }
        };
    } catch (error) {
        console.error(`[userAuth] 用户验证失败:`, error);
        return { success: false, message: '验证过程中出现错误' };
    }
}

// 修改用户密码
async function changePassword(userId, currentPassword, newPassword) {
    console.log(`[userAuth] 尝试修改用户 ID: ${userId} 的密码`);
    try {
        // 查找用户
        console.log(`[userAuth] 查询用户 ID: ${userId}`);
        const user = await UserManager.getUserById(userId);
        if (!user) {
            console.log(`[userAuth] 用户 ID: ${userId} 不存在`);
            return { success: false, message: '用户不存在' };
        }

        // 验证当前密码
        console.log(`[userAuth] 验证用户 ${user.username} 的当前密码`);
        const passwordHash = await UserManager.getPasswordHashByUserId(userId);
        if (!passwordHash) {
            console.log(`[userAuth] 用户 ${user.username} 的密码哈希不存在`);
            return { success: false, message: '用户密码未设置' };
        }
        const passwordMatch = await bcrypt.compare(currentPassword, passwordHash);
        if (!passwordMatch) {
            console.log(`[userAuth] 用户 ${user.username} 当前密码验证失败`);
            return { success: false, message: '当前密码错误' };
        }

        // 对新密码进行加密
        console.log(`[userAuth] 为用户 ${user.username} 创建新密码哈希`);
        const newPasswordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

        // 更新密码
        console.log(`[userAuth] 更新用户 ${user.username} 的密码`);
        await UserManager.changeUserPasswordByUserId(userId, newPasswordHash);

        console.log(`[userAuth] 用户 ${user.username} 密码修改成功`);
        return { success: true, message: '密码修改成功' };
    } catch (error) {
        console.error(`[userAuth] 修改密码失败:`, error);
        return { success: false, message: '修改密码过程中出现错误' };
    }
}

// 获取用户列表 (仅管理员可用)
async function getUserList() {
    console.log(`[userAuth] 获取用户列表`);
    return await UserManager.getAllUsers();
}

// 检查系统中是否有初始管理员
async function hasInitialAdmin() {
    console.log(`[userAuth] 检查系统是否有用户`);
    try {
        // 检查数据库表是否存在
        if (!UserManager.checkTableExists()) {
            console.log(`[userAuth] 用户表不存在，需要设置`);
            return false;
        }
        
        // 查询用户数量
        const isAdminExists = await UserManager.adminExists();
        //console.log(`[userAuth] 系统中是否有管理员存在: ${isAdminExists ? '有管理员' : '没有管理员'} 存在`);
        return isAdminExists;
    } catch (error) {
        console.error(`[userAuth] 检查初始管理员失败:`, error);
        return false;
    }
}

module.exports = {
    registerUser,
    authenticateUser,
    changePassword,
    getUserList,
    hasInitialAdmin
}; 