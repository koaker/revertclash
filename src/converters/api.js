/**
 * 协议转换API
 * 提供HTTP API接口用于协议转换
 */
const express = require('express');
const router = express.Router();
const converter = require('./index');
const YAML = require('yaml');

/**
 * 获取支持的协议列表
 * GET /api/converter/protocols
 */
router.get('/protocols', (req, res) => {
  res.json({
    protocols: converter.getSupportedProtocols()
  });
});

/**
 * 将URI转换为Clash配置
 * POST /api/converter/to-clash
 * 请求体: { uri: "协议URI" }
 */
router.post('/to-clash', (req, res) => {
  const { uri } = req.body;
  
  if (!uri) {
    return res.status(400).json({ error: '缺少URI参数' });
  }
  
  const clashConfig = converter.uriToClash(uri);
  
  if (!clashConfig) {
    return res.status(400).json({ error: '无法转换URI，格式可能不正确或不支持' });
  }
  
  res.json({ config: clashConfig });
});

/**
 * 将多个URI转换为完整的Clash配置
 * POST /api/converter/uris-to-clash
 * 请求体: { uris: ["uri1", "uri2", ...] }
 */
router.post('/uris-to-clash', (req, res) => {
  const { uris } = req.body;
  
  if (!Array.isArray(uris) || uris.length === 0) {
    return res.status(400).json({ error: '缺少有效的URI数组' });
  }
  
  const clashConfig = converter.urisToClashConfig(uris);
  
  if (!clashConfig) {
    return res.status(400).json({ error: '无法转换URI，格式可能不正确或不支持' });
  }
  
  res.json({ config: clashConfig });
});

/**
 * 将多个URI转换为YAML格式的Clash配置
 * POST /api/converter/uris-to-clash-yaml
 * 请求体: { uris: ["uri1", "uri2", ...] }
 */
router.post('/uris-to-clash-yaml', (req, res) => {
  const { uris } = req.body;
  
  if (!Array.isArray(uris) || uris.length === 0) {
    return res.status(400).json({ error: '缺少有效的URI数组' });
  }
  
  const yamlConfig = converter.urisToClashYaml(uris);
  
  if (!yamlConfig) {
    return res.status(400).json({ error: '无法转换URI，格式可能不正确或不支持' });
  }
  
  res.setHeader('Content-Type', 'text/yaml');
  res.send(yamlConfig);
});

/**
 * 将Clash配置转换为特定协议的URI
 * POST /api/converter/to-uri
 * 请求体: { config: {...}, protocol: "协议名称" }
 */
router.post('/to-uri', (req, res) => {
  const { config, protocol } = req.body;
  
  if (!config || !protocol) {
    return res.status(400).json({ error: '缺少配置或协议参数' });
  }
  
  if (!converter.getSupportedProtocols().includes(protocol)) {
    return res.status(400).json({ error: `不支持的协议: ${protocol}` });
  }
  
  const uri = converter.clashToUri(config, protocol);
  
  if (!uri) {
    return res.status(400).json({ error: '无法转换配置，格式可能不正确或不支持' });
  }
  
  res.json({ uri });
});

/**
 * 将Clash配置中的所有代理转换为指定协议的URI列表
 * POST /api/converter/clash-to-uris
 * 请求体: { config: {...}, protocol: "协议名称" }
 */
router.post('/clash-to-uris', (req, res) => {
  const { config, protocol } = req.body;
  
  if (!config || !protocol) {
    return res.status(400).json({ error: '缺少配置或协议参数' });
  }
  
  if (!converter.getSupportedProtocols().includes(protocol)) {
    return res.status(400).json({ error: `不支持的协议: ${protocol}` });
  }
  
  const uris = converter.clashConfigToUris(config, protocol);
  
  res.json({ uris });
});

/**
 * 将YAML格式的Clash配置字符串解析并转换为指定协议的URI列表
 * POST /api/converter/clash-yaml-to-uris
 * 请求体: { yaml: "yaml字符串", protocol: "协议名称" }
 */
router.post('/clash-yaml-to-uris', (req, res) => {
  const { yaml, protocol } = req.body;
  
  if (!yaml || !protocol) {
    return res.status(400).json({ error: '缺少YAML或协议参数' });
  }
  
  if (!converter.getSupportedProtocols().includes(protocol)) {
    return res.status(400).json({ error: `不支持的协议: ${protocol}` });
  }
  
  try {
    const uris = converter.clashYamlToUris(yaml, protocol);
    res.json({ uris });
  } catch (err) {
    res.status(400).json({ error: `解析YAML失败: ${err.message}` });
  }
});

/**
 * 批量转换 - 将多种协议的URI转换为Clash配置
 * POST /api/converter/batch-convert
 * 请求体: { uris: ["ss://...", "vless://...", "hysteria2://..."] }
 */
router.post('/batch-convert', (req, res) => {
  const { uris } = req.body;
  
  if (!Array.isArray(uris) || uris.length === 0) {
    return res.status(400).json({ error: '缺少有效的URI数组' });
  }
  
  const results = {
    successful: [],
    failed: []
  };
  
  for (const uri of uris) {
    const protocol = converter.detectProtocol(uri);
    const clashConfig = converter.uriToClash(uri);
    
    if (clashConfig) {
      results.successful.push({
        original: uri,
        protocol,
        config: clashConfig
      });
    } else {
      results.failed.push({
        original: uri,
        reason: '无法转换，格式可能不正确或不支持'
      });
    }
  }
  
  res.json(results);
});

/**
 * 检测URI的协议类型
 * POST /api/converter/detect-protocol
 * 请求体: { uri: "协议URI" }
 */
router.post('/detect-protocol', (req, res) => {
  const { uri } = req.body;
  
  if (!uri) {
    return res.status(400).json({ error: '缺少URI参数' });
  }
  
  const protocol = converter.detectProtocol(uri);
  
  if (!protocol) {
    return res.status(400).json({ error: '无法识别的协议' });
  }
  
  res.json({ protocol });
});

module.exports = router;
