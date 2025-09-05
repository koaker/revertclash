/*主函数：生成完整的Clash配置 @param {Object} config "输入配置 @returns {Object} 完整的Clash配置*/
function main(config) {
    let { proxies } = config;

    // 构建最终配置
    return {
        mode: "rule",
        "find-process-mode": "strict",
        "global-client-fingerprint": "chrome",
        "unified-delay": true,
        "tcp-concurrent": true,
        proxies,
        "proxy-groups": [
            {
                "name": "全代理", 
                "type": "select",
                "proxies": [],
                "include-all": true
            }
        ],
        rules: ['MATCH,全代理']
    };
}

function process(nodes) {
  // 将传入的 nodes 数组包装成原始 main 函数期望的 { proxies: [...] } 格式
  const config = { proxies: nodes };
  // 调用文件内原有的核心处理函数
  return main(config);
}

// 导出我们标准化的 process 函数
module.exports = {
  process,
};