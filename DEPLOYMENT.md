# RevertClash 生产环境部署指南

## 🎯 **部署目标**
将 RevertClash 前后端统一部署到 `spocel.top` 域名的 `3001` 端口（HTTPS）。

## 📋 **前置要求**

1. **Node.js** (推荐 v16 或更高版本)
2. **SSL证书** 放置在 `ssl/` 目录下：
   - `privkey.pem` 和 `fullchain.pem` (推荐格式)
   - 或 `private.key`, `certificate.crt`, `ca_bundle.crt`
3. **域名解析** `spocel.top` 指向您的服务器IP

## 🚀 **快速部署**

### **Windows 用户**
```bash
# 标准部署（推荐）
deploy.bat

# 如果遇到问题，使用调试模式（逐步执行）
deploy-debug.bat
```

### **Linux/macOS 用户**
```bash
# 添加执行权限
chmod +x deploy.sh

# 运行部署脚本
./deploy.sh
```

### **手动部署**
```bash
# 1. 安装依赖
npm install

# 2. 构建前端
npm run build

# 3. 应用生产环境配置
# Windows:
copy configs\config.production.yaml configs\config.yaml
# Linux/macOS:
cp configs/config.production.yaml configs/config.yaml

# 4. 启动服务
# Windows:
set NODE_ENV=production && node src/index.js
# Linux/macOS:
export NODE_ENV=production && node src/index.js
```

## 🔧 **配置说明**

### **端口配置**
- **HTTP端口**: 3000 (内部使用，可选)
- **HTTPS端口**: 3001 (对外服务)
- **域名**: spocel.top

### **架构优势**
1. **统一入口**: 前后端都通过 `https://spocel.top:3001` 访问
2. **静态文件服务**: 后端直接托管前端构建文件
3. **API请求**: 所有API请求通过同一端口处理
4. **路由支持**: 支持Vue Router的history模式

## 📱 **访问地址**

部署成功后，您可以通过以下地址访问：

- **主页**: https://spocel.top:3001/
- **节点管理**: https://spocel.top:3001/nodes
- **订阅管理**: https://spocel.top:3001/subscriptions
- **配置实验室**: https://spocel.top:3001/config-lab
- **账户管理**: https://spocel.top:3001/account

## 🔗 **订阅链接**

订阅链接将自动生成为：
```
https://spocel.top:3001/subscribe/{token}/processed-config
```

这与您之前使用的外部服务地址格式完全一致！

## 🛠️ **故障排查**

### **SSL证书问题**
```bash
# 检查SSL证书文件
ls -la ssl/
# 应该包含以下文件之一：
# - privkey.pem 和 fullchain.pem
# - private.key, certificate.crt, ca_bundle.crt
```

### **端口占用**
```bash
# 检查3001端口是否被占用
# Windows:
netstat -ano | findstr :3001
# Linux/macOS:
lsof -i :3001
```

### **构建失败**
```bash
# 清理并重新安装依赖
rm -rf node_modules frontend/node_modules
npm install
```

### **前端页面显示404**
确保以下条件：
1. `NODE_ENV=production` 环境变量已设置
2. `frontend/dist` 目录已生成且包含文件
3. 后端正确启动了静态文件服务

## 🔄 **开发与生产切换**

### **切换到开发模式**
```bash
# 恢复开发配置
# Windows:
copy configs\config.yaml.backup configs\config.yaml
# Linux/macOS:
cp configs/config.yaml.backup configs/config.yaml

# 启动开发服务器
npm run dev
```

### **切换到生产模式**
```bash
# 应用生产配置
# Windows:
copy configs\config.production.yaml configs\config.yaml
# Linux/macOS:
cp configs/config.production.yaml configs/config.yaml

# 启动生产服务器
npm run deploy
```

## 🛠️ **故障排除**

### **Windows 部署脚本常见问题**

**问题1: 脚本提前退出，没有错误信息**
```bash
# 原因1: config.production.yaml 不存在
# 解决方案: 使用调试脚本
deploy-debug.bat

# 原因2: npm命令导致bat脚本退出 (最常见)
# 在Windows bat脚本中，npm命令本身也是脚本，直接调用会导致原脚本退出
# 解决方案: 使用call关键字
call npm install
call npm run build

# 手动创建配置文件
copy configs\config.production.example.yaml configs\config.production.yaml
notepad configs\config.production.yaml
```

**问题2: npm install 失败**
```bash
# 原因: postinstall 钩子问题
# 解决方案: 忽略脚本安装
npm install --ignore-scripts

# 手动安装前端依赖
cd frontend
npm install
cd ..
```

**问题3: 前端构建失败**
```bash
# 检查前端依赖是否正确安装
cd frontend
npm list
npm run build

# 如果依赖缺失，重新安装
rm -rf node_modules package-lock.json
npm install
```

**问题4: 服务器启动但无法访问Vue页面**
```bash
# 检查构建产物是否存在
dir frontend\dist

# 检查认证中间件是否拦截静态资源
# 查看服务器日志中的[会话认证]消息
```

### **Linux/macOS 故障排除**

**权限问题**:
```bash
chmod +x deploy.sh
sudo chown -R $USER:$USER .
```

**端口占用**:
```bash
# 检查端口占用
lsof -i :3000
lsof -i :3001

# 杀死占用进程
kill -9 <PID>
```

## ⚡ **性能优化建议**

1. **使用PM2管理进程**:
   ```bash
   npm install -g pm2
   pm2 start src/index.js --name "revertclash" --env production
   ```

2. **使用Nginx反向代理** (可选):
   ```nginx
   server {
       listen 443 ssl;
       server_name spocel.top;
       
       location / {
           proxy_pass https://localhost:3001;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

## 📞 **支持**

如果遇到问题，请检查：
1. 控制台日志输出
2. SSL证书是否有效
3. 域名解析是否正确
4. 防火墙是否开放3001端口

---

**部署完成后，您的 RevertClash 将完全运行在 `https://spocel.top:3001`！** 🎉 