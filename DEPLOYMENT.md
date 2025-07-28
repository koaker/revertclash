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
# 双击运行或在命令行执行
deploy.bat
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