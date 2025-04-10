const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');

// 导入配置处理函数
const clashConfigs = require('./clash-configs.js');

try {
    // 读取YAML文件
    const yamlFile = fs.readFileSync('merged-config.yaml', 'utf8');
    const config = yaml.load(yamlFile);

    // 处理配置
    const newConfig = clashConfigs.main(config);

    // 保存处理后的配置
    const outputPath = 'processed-config.yaml';
    fs.writeFileSync(outputPath, yaml.dump(newConfig, {
        indent: 2,
        lineWidth: -1 // 禁用行宽限制
    }));

    console.log(`配置已处理完成，保存至: ${outputPath}`);
} catch (error) {
    console.error('处理配置时发生错误:', error);
}