# 协议转换器模块使用说明

这个模块提供了在不同VPN协议（SS、VLESS、Hysteria2）和Clash配置格式之间进行转换的功能。它设计具有良好的扩展性，可以轻松添加更多协议支持。

## 文件结构

```
converters/
├── baseConverter.js      # 基础转换器类，定义接口
├── protocolConverter.js  # 协议转换管理器
├── ssConverter.js        # SS协议转换器
├── vlessConverter.js     # VLESS协议转换器
├── hysteria2Converter.js # Hysteria2协议转换器
├── api.js                # API接口
└── index.js              # 模块入口
```

## 使用方法

### 1. 通过API接口使用

API路由前缀为 `/api/converter/`，所有API都需要通过IP认证。

#### 获取支持的协议列表

```
GET /api/converter/protocols
```

**响应示例**：
```json
{
  "protocols": ["ss", "vless", "hysteria2"]
}
```

#### 将单个URI转换为Clash配置

```
POST /api/converter/to-clash
```

**请求体**：
```json
{
  "uri": "vless://c7f7443e-55d6-46ec-85be-60eeda50a3a0@108.214.246.79:31067?encryption=none&security=reality&flow=xtls-rprx-vision&type=tcp&sni=www.paypal.com&pbk=a0fcnyYI3lgK-iYD_P8AWfyuWKDCJXRrPsrX0tFOSyY&fp=chrome#双ISPAT&T|reality"
}
```

**响应示例**：
```json
{
  "config": {
    "name": "双ISPAT&T|reality",
    "type": "vless",
    "server": "108.214.246.79",
    "port": 31067,
    "uuid": "c7f7443e-55d6-46ec-85be-60eeda50a3a0",
    "udp": true,
    "skip-cert-verify": true,
    "network": "tcp",
    "tls": true,
    "reality": {
      "public_key": "a0fcnyYI3lgK-iYD_P8AWfyuWKDCJXRrPsrX0tFOSyY",
      "short_id": ""
    },
    "servername": "www.paypal.com",
    "client_fingerprint": "chrome",
    "flow": "xtls-rprx-vision"
  }
}
```

#### 将多个URI转换为完整的Clash配置

```
POST /api/converter/uris-to-clash
```

**请求体**：
```json
{
  "uris": [
    "vless://c7f7443e-55d6-46ec-85be-60eeda50a3a0@108.214.246.79:31067?encryption=none&security=reality&flow=xtls-rprx-vision&type=tcp&sni=www.paypal.com&pbk=a0fcnyYI3lgK-iYD_P8AWfyuWKDCJXRrPsrX0tFOSyY&fp=chrome#双ISPAT&T|reality",
    "hysteria2://ad77e45c-0485-4357-9d64-1593aabc2c19@108.214.246.79:32321?alpn=h3&insecure=1#双ISPAT&T|hy2"
  ]
}
```

**响应示例**：
```json
{
  "config": {
    "proxies": [
      {
        "name": "双ISPAT&T|reality",
        "type": "vless",
        "server": "108.214.246.79",
        "port": 31067,
        "uuid": "c7f7443e-55d6-46ec-85be-60eeda50a3a0",
        "udp": true,
        "skip-cert-verify": true,
        "network": "tcp",
        "tls": true,
        "reality": {
          "public_key": "a0fcnyYI3lgK-iYD_P8AWfyuWKDCJXRrPsrX0tFOSyY",
          "short_id": ""
        },
        "servername": "www.paypal.com",
        "client_fingerprint": "chrome",
        "flow": "xtls-rprx-vision"
      },
      {
        "name": "双ISPAT&T|hy2",
        "type": "hysteria2",
        "server": "108.214.246.79",
        "port": 32321,
        "password": "ad77e45c-0485-4357-9d64-1593aabc2c19",
        "udp": true,
        "skip-cert-verify": true,
        "alpn": ["h3"]
      }
    ],
    "proxy-groups": [
      {
        "name": "🚀 节点选择",
        "type": "select",
        "proxies": ["双ISPAT&T|reality", "双ISPAT&T|hy2"]
      }
    ]
  }
}
```

#### 将多个URI转换为YAML格式的Clash配置

```
POST /api/converter/uris-to-clash-yaml
```

**请求体**：
```json
{
  "uris": [
    "vless://c7f7443e-55d6-46ec-85be-60eeda50a3a0@108.214.246.79:31067?encryption=none&security=reality&flow=xtls-rprx-vision&type=tcp&sni=www.paypal.com&pbk=a0fcnyYI3lgK-iYD_P8AWfyuWKDCJXRrPsrX0tFOSyY&fp=chrome#双ISPAT&T|reality",
    "hysteria2://ad77e45c-0485-4357-9d64-1593aabc2c19@108.214.246.79:32321?alpn=h3&insecure=1#双ISPAT&T|hy2"
  ]
}
```

**响应示例**：
```yaml
port: 7890
socks-port: 7891
allow-lan: true
mode: rule
log-level: info
proxies:
  - name: 双ISPAT&T|reality
    type: vless
    server: 108.214.246.79
    port: 31067
    uuid: c7f7443e-55d6-46ec-85be-60eeda50a3a0
    network: tcp
    tls: true
    udp: true
    skip-cert-verify: true
    reality:
      public_key: a0fcnyYI3lgK-iYD_P8AWfyuWKDCJXRrPsrX0tFOSyY
      short_id: ""
    servername: www.paypal.com
    client_fingerprint: chrome
    flow: xtls-rprx-vision
  - name: 双ISPAT&T|hy2
    type: hysteria2
    server: 108.214.246.79
    port: 32321
    password: ad77e45c-0485-4357-9d64-1593aabc2c19
    udp: true
    skip-cert-verify: true
    alpn:
      - h3
proxy-groups:
  - name: 🚀 节点选择
    type: select
    proxies:
      - 双ISPAT&T|reality
      - 双ISPAT&T|hy2
rules:
  - MATCH,DIRECT
```

#### 将Clash配置转换为特定协议的URI

```
POST /api/converter/to-uri
```

**请求体**：
```json
{
  "config": {
    "name": "双ISPAT&T|reality",
    "type": "vless",
    "server": "108.214.246.79",
    "port": 31067,
    "uuid": "c7f7443e-55d6-46ec-85be-60eeda50a3a0",
    "network": "tcp",
    "tls": true,
    "reality": {
      "public_key": "a0fcnyYI3lgK-iYD_P8AWfyuWKDCJXRrPsrX0tFOSyY",
      "short_id": ""
    },
    "servername": "www.paypal.com",
    "client_fingerprint": "chrome",
    "flow": "xtls-rprx-vision"
  },
  "protocol": "vless"
}
```

**响应示例**：
```json
{
  "uri": "vless://c7f7443e-55d6-46ec-85be-60eeda50a3a0@108.214.246.79:31067?type=tcp&security=reality&pbk=a0fcnyYI3lgK-iYD_P8AWfyuWKDCJXRrPsrX0tFOSyY&sni=www.paypal.com&fp=chrome&flow=xtls-rprx-vision#双ISPAT&T|reality"
}
```

#### 将Clash配置中的所有代理转换为指定协议的URI列表

```
POST /api/converter/clash-to-uris
```

**请求体**：
```json
{
  "config": {
    "proxies": [
      {
        "name": "节点1",
        "type": "vless",
        "server": "108.214.246.79",
        "port": 31067,
        "uuid": "c7f7443e-55d6-46ec-85be-60eeda50a3a0",
        "network": "tcp",
        "tls": true,
        "reality": {
          "public_key": "a0fcnyYI3lgK-iYD_P8AWfyuWKDCJXRrPsrX0tFOSyY",
          "short_id": ""
        },
        "servername": "www.paypal.com",
        "client_fingerprint": "chrome",
        "flow": "xtls-rprx-vision"
      },
      {
        "name": "节点2",
        "type": "vless",
        "server": "example.com",
        "port": 443,
        "uuid": "a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6",
        "network": "ws",
        "tls": true
      }
    ]
  },
  "protocol": "vless"
}
```

**响应示例**：
```json
{
  "uris": [
    "vless://c7f7443e-55d6-46ec-85be-60eeda50a3a0@108.214.246.79:31067?type=tcp&security=reality&pbk=a0fcnyYI3lgK-iYD_P8AWfyuWKDCJXRrPsrX0tFOSyY&sni=www.paypal.com&fp=chrome&flow=xtls-rprx-vision#节点1",
    "vless://a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6@example.com:443?type=ws&security=tls#节点2"
  ]
}
```

#### 将YAML格式的Clash配置字符串解析并转换为指定协议的URI列表

```
POST /api/converter/clash-yaml-to-uris
```

**请求体**：
```json
{
  "yaml": "proxies:\n  - name: 节点1\n    type: vless\n    server: 108.214.246.79\n    port: 31067\n    uuid: c7f7443e-55d6-46ec-85be-60eeda50a3a0\n    network: tcp\n    tls: true\n    reality:\n      public_key: a0fcnyYI3lgK-iYD_P8AWfyuWKDCJXRrPsrX0tFOSyY\n      short_id: \"\"\n    servername: www.paypal.com\n    client_fingerprint: chrome\n    flow: xtls-rprx-vision",
  "protocol": "vless"
}
```

**响应示例**：
```json
{
  "uris": [
    "vless://c7f7443e-55d6-46ec-85be-60eeda50a3a0@108.214.246.79:31067?type=tcp&security=reality&pbk=a0fcnyYI3lgK-iYD_P8AWfyuWKDCJXRrPsrX0tFOSyY&sni=www.paypal.com&fp=chrome&flow=xtls-rprx-vision#节点1"
  ]
}
```

#### 批量转换多种协议的URI

```
POST /api/converter/batch-convert
```

**请求体**：
```json
{
  "uris": [
    "vless://c7f7443e-55d6-46ec-85be-60eeda50a3a0@108.214.246.79:31067?encryption=none&security=reality&flow=xtls-rprx-vision&type=tcp&sni=www.paypal.com&pbk=a0fcnyYI3lgK-iYD_P8AWfyuWKDCJXRrPsrX0tFOSyY&fp=chrome#双ISPAT&T|reality",
    "hysteria2://ad77e45c-0485-4357-9d64-1593aabc2c19@108.214.246.79:32321?alpn=h3&insecure=1#双ISPAT&T|hy2",
    "ss://YWVzLTI1Ni1nY206cGFzc3dvcmQ=@example.com:8388#示例SS节点"
  ]
}
```

**响应示例**：
```json
{
  "successful": [
    {
      "original": "vless://c7f7443e-55d6-46ec-85be-60eeda50a3a0@108.214.246.79:31067?encryption=none&security=reality&flow=xtls-rprx-vision&type=tcp&sni=www.paypal.com&pbk=a0fcnyYI3lgK-iYD_P8AWfyuWKDCJXRrPsrX0tFOSyY&fp=chrome#双ISPAT&T|reality",
      "protocol": "vless",
      "config": {
        "name": "双ISPAT&T|reality",
        "type": "vless",
        "server": "108.214.246.79",
        "port": 31067,
        "uuid": "c7f7443e-55d6-46ec-85be-60eeda50a3a0",
        "udp": true,
        "skip-cert-verify": true,
        "network": "tcp",
        "tls": true,
        "reality": {
          "public_key": "a0fcnyYI3lgK-iYD_P8AWfyuWKDCJXRrPsrX0tFOSyY",
          "short_id": ""
        },
        "servername": "www.paypal.com",
        "client_fingerprint": "chrome",
        "flow": "xtls-rprx-vision"
      }
    },
    {
      "original": "hysteria2://ad77e45c-0485-4357-9d64-1593aabc2c19@108.214.246.79:32321?alpn=h3&insecure=1#双ISPAT&T|hy2",
      "protocol": "hysteria2",
      "config": {
        "name": "双ISPAT&T|hy2",
        "type": "hysteria2",
        "server": "108.214.246.79",
        "port": 32321,
        "password": "ad77e45c-0485-4357-9d64-1593aabc2c19",
        "udp": true,
        "skip-cert-verify": true,
        "alpn": ["h3"]
      }
    },
    {
      "original": "ss://YWVzLTI1Ni1nY206cGFzc3dvcmQ=@example.com:8388#示例SS节点",
      "protocol": "ss",
      "config": {
        "name": "示例SS节点",
        "type": "ss",
        "server": "example.com",
        "port": 8388,
        "cipher": "aes-256-gcm",
        "password": "password",
        "udp": true
      }
    }
  ],
  "failed": []
}
```

#### 检测URI的协议类型

```
POST /api/converter/detect-protocol
```

**请求体**：
```json
{
  "uri": "vless://c7f7443e-55d6-46ec-85be-60eeda50a3a0@108.214.246.79:31067?encryption=none&security=reality&flow=xtls-rprx-vision&type=tcp&sni=www.paypal.com&pbk=a0fcnyYI3lgK-iYD_P8AWfyuWKDCJXRrPsrX0tFOSyY&fp=chrome#双ISPAT&T|reality"
}
```

**响应示例**：
```json
{
  "protocol": "vless"
}
```

### 2. 通过JavaScript模块使用

你也可以在代码中直接使用这个模块：

```javascript
// 导入模块
const converter = require('../src/converters');

// 将URI转换为Clash配置
const vlessUri = 'vless://c7f7443e-55d6-46ec-85be-60eeda50a3a0@108.214.246.79:31067?encryption=none&security=reality&flow=xtls-rprx-vision&type=tcp&sni=www.paypal.com&pbk=a0fcnyYI3lgK-iYD_P8AWfyuWKDCJXRrPsrX0tFOSyY&fp=chrome#双ISPAT&T|reality';
const clashConfig = converter.uriToClash(vlessUri);
console.log(clashConfig);

// 将多个URI转换为完整的Clash配置
const uris = [
  'vless://c7f7443e-55d6-46ec-85be-60eeda50a3a0@108.214.246.79:31067?encryption=none&security=reality&flow=xtls-rprx-vision&type=tcp&sni=www.paypal.com&pbk=a0fcnyYI3lgK-iYD_P8AWfyuWKDCJXRrPsrX0tFOSyY&fp=chrome#双ISPAT&T|reality',
  'hysteria2://ad77e45c-0485-4357-9d64-1593aabc2c19@108.214.246.79:32321?alpn=h3&insecure=1#双ISPAT&T|hy2'
];
const fullConfig = converter.urisToClashConfig(uris);
console.log(fullConfig);

// 将多个URI转换为YAML格式的Clash配置
const yamlConfig = converter.urisToClashYaml(uris);
console.log(yamlConfig);

// 将Clash配置转换为URI
const uri = converter.clashToUri(clashConfig, 'vless');
console.log(uri);

// 获取支持的协议列表
const protocols = converter.getSupportedProtocols();
console.log(protocols);

// 检测URI的协议类型
const protocol = converter.detectProtocol(vlessUri);
console.log(protocol);
```

## 扩展新协议

如果你想添加新的协议支持，需要按照以下步骤操作：

1. 创建一个新的转换器类，继承自BaseConverter

```javascript
// myNewProtocolConverter.js
const BaseConverter = require('./baseConverter');

class MyNewProtocolConverter extends BaseConverter {
  // 实现所需的方法
  canHandleUri(uri) {
    return typeof uri === 'string' && uri.startsWith('mynewprotocol://');
  }
  
  canHandleClash(clashConfig) {
    return clashConfig && clashConfig.type === 'mynewprotocol';
  }
  
  uriToClash(uri) {
    // 实现从URI到Clash配置的转换逻辑
  }
  
  clashToUri(clashConfig) {
    // 实现从Clash配置到URI的转换逻辑
  }
}

module.exports = MyNewProtocolConverter;
```

2. 在index.js中注册这个新的转换器

```javascript
// 导入新的转换器
const MyNewProtocolConverter = require('./myNewProtocolConverter');

// 注册新的转换器
protocolConverter.registerConverter('mynewprotocol', new MyNewProtocolConverter());
```

完成这些步骤后，你的新协议就可以像其他协议一样使用了。

## 注意事项

1. 所有API都需要通过IP认证，请确保在调用API前已经通过认证。
2. 转换过程中可能会遇到格式不正确的URI或配置，请确保处理这些错误情况。
3. 某些协议可能有特定的参数要求，请参考各协议的官方文档。
