# RevertClash

RevertClash 是两个项目，一个是用来将多个来源的clash配置文件的所有节点提取出来汇总到一个文件中，一个是clashverge脚本，用来为一个clash配置文件添加多个配置好的规则，它可以帮助你管理和优化 Clash 代理规则配置。

## 🌟 特性

- 智能合并多个配置源
- 自动优化代理规则
- 支持高质量节点筛选
- 内置大量预定义规则（包括流媒体、游戏等）
- 提供 HTTP API 服务
- 支持自定义规则配置

## 📦 安装

1. 克隆仓库：
```bash
git clone https://github.com/spocel/revertclash.git
cd revertclash
```

2. 安装依赖：
```bash
npm install
```

3. 配置：
- 复制 `clash-urls.txt.example` 到 `clash-urls.txt`
- 根据需要修改配置文件

4.clash verge使用：
- 将clash-config.js 中除了module.exports = { main };的函数全部复制导入到clash verge中

## ⚙️ 配置选项

在 `clash-configs.js` 中，你可以自定义以下配置：

```javascript
const CONFIG = {
    // 测试连接URL
    testUrl: "https://www.google.com",
    
    // 自动测试间隔 (秒)
    testInterval: 300,
    
    // 自动选择容差 (毫秒)
    tolerance: 20,
    
    // 负载均衡策略
    balanceStrategy: "sticky-sessions"
};
```

### 自定义规则

你可以在 `USER_RULES` 数组中添加自定义规则：

```javascript
const USER_RULES = [
    "DOMAIN-SUFFIX,example.com,国外网站",
    // 添加更多规则...
];
```

## 🚀 使用方法
1. 启动 HTTP 服务器：
```bash
cd revertclash-app
node src/index.js
```

2. 启动主程序，查看对文件的效果：
```bash
node process-config.js
```

### HTTP API 接口

- `GET /config`: 获取处理后的配置文件

默认订阅链接：http://localhost:3000/config
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

```javascript
const HIGH_QUALITY_KEYWORDS = [
    "IEPL", "IPLC", "专线", "高速",
    // 更多关键词...
];
```

### DNS 配置 来源Phantasia

提供了详细的 DNS 配置选项，包括：
- 可信 DNS 服务器列表
- 国内 DNS 服务器
- Fake IP 过滤规则
- 等等...

## 🔗 相关链接

- [Clash](https://github.com/Dreamacro/clash)
- [ClashX](https://github.com/yichengchen/clashX)

 * author : Phantasia https://github.com/MarchPhantasia clash-config.js
 * editer : spocel https://github.com/spocel other 