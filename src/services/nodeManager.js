const yaml = require('js-yaml');

/**
 * 节点管理器类
 * 负责解析、管理和选择Clash配置中的节点
 */
class NodeManager {
    constructor() {
        this.nodes = new Map(); // 存储节点信息
        this.selectedNodes = new Set(); // 存储选中的节点
    }

    /**
     * 解析配置文件中的节点信息
     * @param {Object|String} config - Clash配置对象或YAML字符串
     * @returns {Array} - 格式化的节点列表
     */
    async parseNodes(config) {
        // 如果传入的是字符串，则解析为对象
        let configObj = config;
        if (typeof config === 'string') {
            try {
                configObj = yaml.load(config);
            } catch (err) {
                throw new Error('无效的YAML格式: ' + err.message);
            }
        }

        // 检查配置是否包含proxies部分
        if (!configObj.proxies || !Array.isArray(configObj.proxies)) {
            return [];
        }

        // 清空现有节点
        this.nodes.clear();

        // 解析节点信息
        configObj.proxies.forEach(proxy => {
            // 提取基本信息
            const node = {
                name: proxy.name,
                type: proxy.type,
                server: proxy.server,
                port: proxy.port,
                selected: this.selectedNodes.has(proxy.name),
                details: { ...proxy } // 保存完整节点信息
            };

            this.nodes.set(proxy.name, node);
        });

        return this.getNodes();
    }

    /**
     * 获取节点列表
     * @returns {Array} - 节点列表
     */
    getNodes() {
        return Array.from(this.nodes.values());
    }

    /**
     * 获取节点详细信息
     * @param {String} nodeName - 节点名称
     * @returns {Object|null} - 节点详细信息
     */
    getNodeDetails(nodeName) {
        const node = this.nodes.get(nodeName);
        return node ? node.details : null;
    }

    /**
     * 选择/取消选择节点
     * @param {String} nodeName - 节点名称
     * @returns {Boolean} - 操作后的选择状态
     */
    toggleNode(nodeName) {
        if (!this.nodes.has(nodeName)) {
            throw new Error(`节点 "${nodeName}" 不存在`);
        }

        if (this.selectedNodes.has(nodeName)) {
            this.selectedNodes.delete(nodeName);
            this.nodes.get(nodeName).selected = false;
            return false;
        } else {
            this.selectedNodes.add(nodeName);
            this.nodes.get(nodeName).selected = true;
            return true;
        }
    }

    /**
     * 批量选择节点
     * @param {Array} nodeNames - 节点名称数组
     */
    selectNodes(nodeNames) {
        nodeNames.forEach(name => {
            if (this.nodes.has(name)) {
                this.selectedNodes.add(name);
                this.nodes.get(name).selected = true;
            }
        });
    }

    /**
     * 批量取消选择节点
     * @param {Array} nodeNames - 节点名称数组
     */
    deselectNodes(nodeNames) {
        nodeNames.forEach(name => {
            this.selectedNodes.delete(name);
            if (this.nodes.has(name)) {
                this.nodes.get(name).selected = false;
            }
        });
    }

    /**
     * 全选所有节点
     */
    selectAll() {
        this.nodes.forEach((node, name) => {
            this.selectedNodes.add(name);
            node.selected = true;
        });
    }

    /**
     * 取消选择所有节点
     */
    deselectAll() {
        this.selectedNodes.clear();
        this.nodes.forEach(node => {
            node.selected = false;
        });
    }

    /**
     * 获取选中的节点
     * @returns {Array} - 选中的节点列表
     */
    getSelectedNodes() {
        return this.getNodes().filter(node => node.selected);
    }

    /**
     * 按类型筛选节点
     * @param {String} type - 节点类型
     * @returns {Array} - 筛选后的节点列表
     */
    filterByType(type) {
        return this.getNodes().filter(node => node.type === type);
    }

    /**
     * 按名称搜索节点
     * @param {String} keyword - 搜索关键词
     * @returns {Array} - 搜索结果
     */
    searchByName(keyword) {
        const lowerKeyword = keyword.toLowerCase();
        return this.getNodes().filter(node => 
            node.name.toLowerCase().includes(lowerKeyword)
        );
    }
}

module.exports = NodeManager;
