# 配置缓存管理 API 文档

## 概览

配置缓存系统为 RevertClash 提供了网络故障时的降级机制。当订阅URL无法访问时，系统会自动使用最近成功获取的缓存配置，确保代理服务的连续性。

## 基础信息

- **基础URL**: `/api/configs/cache`
- **认证方式**: 需要登录会话
- **响应格式**: JSON
- **缓存策略**: 默认24小时，可配置1-8760小时

## API 接口列表

### 1. 获取缓存配置设置

获取当前系统的缓存配置参数。

**接口地址**: `GET /api/configs/cache/settings`

**请求参数**: 无

**响应示例**:
```json
{
  "status": "success",
  "data": {
    "DEFAULT_EXPIRE_HOURS": 24,
    "MAX_EXPIRE_HOURS": 8760,
    "MIN_EXPIRE_HOURS": 1,
    "AUTO_CLEANUP_DAYS": 7
  }
}
```

### 2. 获取缓存统计信息

获取缓存系统的整体统计数据。

**接口地址**: `GET /api/configs/cache/stats`

**请求参数**: 无

**响应示例**:
```json
{
  "status": "success",
  "data": {
    "totalSubscriptions": 5,
    "cachedSubscriptions": 4,
    "expiredSubscriptions": 1,
    "totalSuccessCount": 48,
    "totalFailureCount": 12,
    "avgSuccessCount": 9.6,
    "avgFailureCount": 2.4
  }
}
```

### 3. 获取所有缓存配置列表

获取所有订阅的缓存状态信息。

**接口地址**: `GET /api/configs/cache/list`

**请求参数**:
- `include_expired` (可选): `true` | `false` - 是否包含已过期的缓存

**响应示例**:
```json
{
  "status": "success",
  "data": [
    {
      "subscriptionName": "HK节点",
      "lastUpdated": "2024-12-19T10:30:00.000Z",
      "lastFetchSuccess": "2024-12-19T10:30:00.000Z",
      "lastFetchAttempt": "2024-12-19T10:30:00.000Z",
      "fetchSuccessCount": 15,
      "fetchFailureCount": 2,
      "isExpired": false,
      "isCached": true,
      "hasContent": true
    }
  ]
}
```

### 4. 获取指定订阅的缓存信息

获取特定订阅的详细缓存信息。

**接口地址**: `GET /api/configs/cache/:subscriptionName`

**路径参数**:
- `subscriptionName`: 订阅名称

**请求参数**:
- `include_expired` (可选): `true` | `false` - 是否包含已过期的缓存

**响应示例**:
```json
{
  "status": "success",
  "data": {
    "subscriptionName": "HK节点",
    "configContent": "proxies:\n- name: HK-01\n  type: ss\n  ...",
    "lastUpdated": "2024-12-19T10:30:00.000Z",
    "lastFetchSuccess": "2024-12-19T10:30:00.000Z",
    "isExpired": false,
    "fetchSuccessCount": 15,
    "fetchFailureCount": 2
  }
}
```

### 5. 获取缓存配置的原始内容

下载指定订阅的缓存配置文件。

**接口地址**: `GET /api/configs/cache/:subscriptionName/content`

**路径参数**:
- `subscriptionName`: 订阅名称

**请求参数**:
- `include_expired` (可选): `true` | `false` - 是否包含已过期的缓存

**响应**: 
- **Content-Type**: `text/yaml`
- **Content-Disposition**: `attachment; filename="{subscriptionName}-cached.yaml"`

### 6. 手动上传单个订阅缓存

为指定订阅手动上传缓存配置。

**接口地址**: `POST /api/configs/cache/:subscriptionName/upload`

**路径参数**:
- `subscriptionName`: 订阅名称

**请求体**:
```json
{
  "content": "proxies:\n- name: Test-01\n  type: ss\n  server: 1.2.3.4\n  port: 8080\n  ...",
  "expire_hours": 48
}
```

**字段说明**:
- `content` (必需): YAML格式的配置内容
- `expire_hours` (可选): 缓存过期时间（小时），范围1-8760

**响应示例**:
```json
{
  "status": "success",
  "message": "订阅 HK节点 的缓存配置已手动上传",
  "data": {
    "subscriptionName": "HK节点",
    "expireHours": 48,
    "contentLength": 2048,
    "contentChanged": true,
    "operation": "updated"
  }
}
```

### 7. 批量上传多个订阅缓存

一次性为多个订阅上传缓存配置。

**接口地址**: `POST /api/configs/cache/batch-upload`

**请求体**:
```json
{
  "expire_hours": 24,
  "configs": [
    {
      "subscription_name": "HK节点",
      "content": "proxies:\n- name: HK-01\n  ..."
    },
    {
      "subscription_name": "US节点", 
      "content": "proxies:\n- name: US-01\n  ..."
    }
  ]
}
```

**字段说明**:
- `expire_hours` (可选): 应用于所有配置的过期时间
- `configs` (必需): 配置数组，最多50个
  - `subscription_name`: 订阅名称
  - `content`: YAML格式的配置内容

**响应示例**:
```json
{
  "status": "completed",
  "message": "批量上传完成: 2 成功, 0 失败",
  "data": {
    "totalCount": 2,
    "successCount": 2,
    "errorCount": 0,
    "expireHours": 24,
    "results": [
      {
        "subscriptionName": "HK节点",
        "status": "success",
        "proxyCount": 5,
        "contentLength": 1024,
        "operation": "updated"
      }
    ]
  }
}
```

### 8. 删除指定订阅的缓存

删除特定订阅的缓存数据。

**接口地址**: `DELETE /api/configs/cache/:subscriptionName`

**路径参数**:
- `subscriptionName`: 订阅名称

**响应示例**:
```json
{
  "status": "success",
  "message": "已删除订阅 HK节点 的缓存"
}
```

### 9. 清理过期缓存

手动触发过期缓存的清理。

**接口地址**: `POST /api/configs/cache/cleanup`

**请求体**:
```json
{
  "days_old": 7
}
```

**字段说明**:
- `days_old` (可选): 清理多少天前的过期缓存，默认7天

**响应示例**:
```json
{
  "status": "success", 
  "message": "已清理 3 个过期的配置缓存",
  "cleaned_count": 3
}
```

### 10. 强制刷新指定订阅缓存

触发指定订阅的缓存更新（目前建议使用全量更新）。

**接口地址**: `POST /api/configs/cache/:subscriptionName/refresh`

**路径参数**:
- `subscriptionName`: 订阅名称

**响应示例**:
```json
{
  "status": "info",
  "message": "订阅 HK节点 的缓存刷新已请求，请使用 POST /configs/update 进行全量更新"
}
```

## 错误响应格式

所有错误响应都遵循统一格式：

```json
{
  "status": "error",
  "error": "具体错误描述"
}
```

**常见错误码**:
- `400`: 请求参数错误
- `404`: 资源不存在
- `500`: 服务器内部错误

## 使用流程示例

### 1. 基本查看流程
```javascript
// 1. 获取缓存设置
const settings = await fetch('/api/configs/cache/settings');

// 2. 获取缓存统计
const stats = await fetch('/api/configs/cache/stats');

// 3. 获取缓存列表
const list = await fetch('/api/configs/cache/list');
```

### 2. 手动上传流程
```javascript
// 1. 验证配置内容
const content = "proxies:\n- name: Test\n  type: ss\n  ...";

// 2. 上传单个缓存
const response = await fetch('/api/configs/cache/MySubscription/upload', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    content: content,
    expire_hours: 48
  })
});
```

### 3. 批量管理流程
```javascript
// 1. 准备批量数据
const configs = [
  { subscription_name: "HK节点", content: "..." },
  { subscription_name: "US节点", content: "..." }
];

// 2. 批量上传
const response = await fetch('/api/configs/cache/batch-upload', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    expire_hours: 24,
    configs: configs
  })
});
```

## 注意事项

1. **配置内容验证**: 上传的配置内容必须是有效的YAML格式，且包含有效的代理节点
2. **缓存时间限制**: 过期时间必须在1-8760小时范围内
3. **批量限制**: 批量上传一次最多支持50个订阅
4. **自动降级**: 当网络获取失败时，系统会自动使用缓存配置
5. **定期清理**: 系统会在配置处理完成后自动清理过期缓存

## 前端集成建议

1. **缓存状态展示**: 在订阅管理页面显示每个订阅的缓存状态
2. **手动上传界面**: 提供文件上传或文本粘贴的方式上传缓存
3. **批量管理工具**: 支持批量导入/导出缓存配置
4. **状态监控面板**: 显示缓存统计信息和健康状态
5. **降级提示**: 当使用缓存配置时，向用户显示明确的提示信息 