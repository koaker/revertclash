# RevertClash

<!-- 在这里可以添加徽章，例如: -->
<!-- ![GitHub stars](https://img.shields.io/github/stars/spocel/revertclash) -->
<!-- ![GitHub issues](https://img.shields.io/github/issues/spocel/revertclash) -->

> 一款强大的 Clash 配置聚合与管理工具，旨在将多个来源的订阅链接和规则进行智能合并、优化和筛选，并提供 Web UI 和 API 服务。

RevertClash 是一个功能丰富的 Clash 配置处理工具。它能够自动拉取多个订阅源，提取并整合节点，应用预设或自定义的规则集（如去广告、流媒体解锁），最终生成一个优化后的、高质量的 Clash 配置文件。

## ✨ 核心特性

-   **多源聚合**: 自动合并来自多个 URL 的 Clash 配置文件。
-   **智能筛选**: 通过关键词筛选、排除节点，轻松获取高质量节点。
-   **丰富规则集**: 内置大量预定义规则（流媒体、游戏、广告拦截等），开箱即用。
-   **高度自定义**: 支持添加任意自定义规则，满足个性化需求。
-   **Web 用户界面**: 提供直观的 Web UI 来管理订阅链接和用户。
-   **API 服务**: 提供 HTTP API，方便与其他工具集成。
-   **Docker 支持**: 提供 Dockerfile，轻松实现容器化部署。

## 🚀 快速开始 (Getting Started)

请按照以下步骤在你的本地环境中运行 RevertClash。

### 1. 环境准备

-   [Node.js](https://nodejs.org/) (推荐 v18 或更高版本)
-   [Git](https://git-scm.com/)

### 2. 克隆项目

```bash
git clone https://github.com/spocel/revertclash.git
cd revertclash
```

### 3. 安装依赖

```bash
npm install
```

### 4. 进行配置

这是最关键的一步。项目通过 `config/config.yaml` 文件进行配置。

1.  **创建你的配置文件**
    我们提供了一个模板文件，请先复制它：
    ```bash
    cp config/config.example.yaml config/config.yaml
    ```

2.  **编辑配置文件**
    打开 `config/config.yaml`，根据你的需求修改里面的内容。

    > **重要**: `config/config.yaml` 文件已被 `.gitignore` 忽略，不会被提交到代码仓库，请放心在其中填写你的敏感信息。

### 5. 启动服务

```bash
npm start
```

服务启动后，你可以通过浏览器访问 `http://localhost:3000` (或你在配置中指定的端口) 来访问 Web 管理界面。

## 🐳 Docker 部署

如果你更喜欢使用 Docker，我们也提供了便捷的部署方式。

1.  **构建 Docker 镜像**
    ```bash
    docker build -t revertclash-app .
    ```

2.  **运行 Docker 容器**
    ```bash
    docker run -d \
      -p 3000:3000 \
      -v $(pwd)/data:/app/data \
      -v $(pwd)/config:/app/config \
      --name revertclash-server \
      revertclash-app
    ```
    > **说明**: 通过 `-v` 参数将本地的 `data` 和 `config` 目录挂载到容器中，可以实现数据的持久化和配置的外部管理。

## 🔧 使用与配置

### API 接口

项目提供了一个核心 API 接口来获取最终生成的配置文件。

-   `GET /subscribe/:token`: 默认的订阅链接，其中 `:token` 是你在 Web UI 中为特定用户生成的订阅令牌。
    -   **示例**: `http://localhost:3000/subscribe/your-secret-token`

### 自定义规则

你可以在 `clash-configs.js` 的 `USER_RULES` 数组中添加你自己的 Clash 规则。

## 🛠️ 技术栈

-   **后端**: Node.js, Express.js
-   **数据库**: SQLite3
-   **配置**: js-yaml
-   **部署**: Docker

## 🙏 致谢 (Acknowledgements)

-   本项目的 DNS 和部分规则框架的设计灵感来源于 [Phantasia](https://github.com/MarchPhantasia) 的项目。
-   感谢所有为本项目贡献过代码和想法的开发者。

## 📄 许可证 (License)

本项目采用 [MIT License](LICENSE) 开源许可证。
