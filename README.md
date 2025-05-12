# RevertClash

RevertClash 是是用来将多个来源的clash配置文件的所有节点提取出来汇总到一个文件中，其中clash-config一个是clashverge脚本，用来为一个clash配置文件添加多个配置好的规则，它可以帮助你管理和优化 Clash 代理规则配置。

## 🌟 特性

- 智能合并多个配置源
- 自动优化代理规则bg
- 支持高质量节点筛选
- 内置大量预定义规则（包括流媒体、游戏等）
- 提供 HTTP API 服务
- 支持自定义规则配置

## 📦 安装



### 手动编译

##### 1. 克隆仓库：
```bash
git clone https://github.com/spocel/revertclash.git
cd revertclash
```

##### 2. 安装依赖：
```bash
npm install
```

##### 3. 配置：
- 复制 `clash-urls.txt.example`去掉后缀,重命名为 `clash-urls.txt`
- 根据需要修改配置文件

##### 4. 如果只需要规则文件，将config-setting.json的变量设为true,并且将auth-config.json.example去掉后缀，密码修改为你自己的密码
如果想在clash中导入只有proxies的文件，设为false
```bash
npm run start #启动服务器
```
访问 `localhost:3000`，密码是文件中的密码

##### 5. clash verge使用：
- 将 `clash-config.js` 中除了 `module.exports = { main }; `的函数全部复制导入到clash verge中



### Docker安装

##### 克隆仓库
```bash
git clone https://github.com/spocel/revertclash.git && cd revertclash
```

##### 构建镜像
```bash
docker build -t revertclash .
```

##### 运行容器
```bash
docker run -d -p 3000:3000 --name revertclashKoaker revertclash
```



## 🚀 使用方法
1. 启动 HTTP 服务器：
```bash
npm run start
```

2. 启动脚本运行，查看对文件的效果：
```bash
node process-config.js
```

### HTTP API 接口

- `GET /config`: 获取处理后的配置文件

默认订阅链接：http://localhost:3000/config
新增管理接口，访问界面即可看到

## ⚙️ 配置选项

在 `clash-configs.js` 中，你可以自定义以下配置：

### 自定义规则

你可以在 `USER_RULES` 数组中添加自定义规则：

## 🌐 预定义规则集

项目内置了多个规则集，包括：

- 广告拦截
- 流媒体服务（Netflix、Disney+、YouTube 等）
- 游戏平台（Steam 等）
- 支付服务（PayPal）
- 和更多...

## 🔧 高级配置

### 节点筛选

可以通过关键词来筛选高质量节点：

### DNS 配置 来源Phantasia

提供了详细的 DNS 配置选项，包括：
- 可信 DNS 服务器列表
- 国内 DNS 服务器
- Fake IP 过滤规则
- 等等...

## 🔗 相关链接

 * author : Phantasia https://github.com/MarchPhantasia clash-config.js 中的DNS、原有的规则框架
 * editer : spocel https://github.com/spocel other 
