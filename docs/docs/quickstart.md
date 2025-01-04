---
sidebar_position: 2
---

# 快速入门指南

## 先决条件

在开始使用 Eliza 之前，请确保您具备以下条件：

- [Node.js 23+](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)
- [pnpm 9+](https://pnpm.io/installation)
- 用于版本控制的 Git
- 代码编辑器（推荐 [VS Code](https://code.visualstudio.com/) 或 [VSCodium](https://vscodium.com)）
- [CUDA Toolkit](https://developer.nvidia.com/cuda-toolkit)（可选，用于 GPU 加速）

## 安装

1. **克隆并安装**

    请务必检查 [最新可用的稳定版本标签](https://github.com/elizaos/eliza/tags)。

    克隆仓库

    ```bash
    git clone https://github.com/elizaos/eliza.git
    ```

    进入目录

    ```bash
    cd eliza
    ```

    切换到最新的标签版本

    ```bash
     # 检出最新版本
     # 该项目迭代迅速，因此我们建议检出最新版本
     git checkout $(git describe --tags --abbrev=0)
    ```

    安装依赖项（首次运行时）

    ```bash
    pnpm install --no-frozen-lockfile
    ```

    # 快速入门指南更新

**关于 pnpm 锁文件管理的重要说明**

默认情况下，基于 .npmrc frozen-lockfile=true 的安装过程中，`pnpm` 锁文件不会更新。要更新锁文件，您需要运行以下命令：

```bash
pnpm install --no-frozen-lockfile
```

请仅在首次初始化仓库或升级包版本或向 package.json 添加新包时使用此命令。此做法有助于保持项目依赖项的一致性，并防止锁文件的意外更改。

构建本地库

```bash
pnpm build
```

2. **配置环境**

    复制示例环境文件

    ```bash
    cp .env.example .env
    ```

    编辑 `.env` 并添加您的值：

    ```bash
    # 建议的快速入门环境变量
    DISCORD_APPLICATION_ID=  # 用于 Discord 集成
    DISCORD_API_TOKEN=      # 机器人令牌
    HEURIST_API_KEY=       # Heurist API 密钥，用于 LLM 和图像生成
    OPENAI_API_KEY=        # OpenAI API 密钥
    GROK_API_KEY=          # Grok API 密钥
    ELEVENLABS_XI_API_KEY= # 来自 elevenlabs 的 API 密钥（用于语音）
    LIVEPEER_GATEWAY_URL=  # Livepeer 网关 URL
    ```

## 选择您的模型

Eliza 支持多种 AI 模型：

- **Heurist**：在角色文件中设置 `modelProvider: "heurist"`。大多数模型未经过审查。
    - LLM：在 [此处](https://docs.heurist.ai/dev-guide/supported-models#large-language-models-llms) 选择可用的 LLM，并配置 `SMALL_HEURIST_MODEL`、`MEDIUM_HEURIST_MODEL`、`LARGE_HEURIST_MODEL`
    - 图像生成：在 [此处](https://docs.heurist.ai/dev-guide/supported-models#image-generation-models) 选择可用的 Stable Diffusion 或 Flux 模型，并配置 `HEURIST_IMAGE_MODEL`（默认是 FLUX.1-dev）
- **Llama**：设置 `XAI_MODEL=meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo`
- **Grok**：设置 `XAI_MODEL=grok-beta`
- **OpenAI**：设置 `XAI_MODEL=gpt-4o-mini` 或 `gpt-4o`
- **Livepeer**：设置 `LIVEPEER_IMAGE_MODEL` 为您选择的 Livepeer 图像模型，可用模型在 [此处](https://livepeer-eliza.com/)

您可以在角色 JSON 文件中设置使用哪个模型

### 本地推理

    #### 对于 llama_local 推理：

      1. 设置 `XAI_MODEL` 为您选择的模型
      2. 保持 `X_SERVER_URL` 和 `XAI_API_KEY` 为空
      3. 系统将自动从 Hugging Face 下载模型
      4. `LOCAL_LLAMA_PROVIDER` 可以为空

      注意：llama_local 需要 GPU，目前不支持 CPU 推理

    #### 对于 Ollama 推理：

      - 如果 `OLLAMA_SERVER_URL` 为空，默认为 `localhost:11434`
      - 如果 `OLLAMA_EMBEDDING_MODE` 为空，默认为 `mxbai-embed-large`

## 创建您的第一个代理

1. **创建角色文件**

    查看 `characters/trump.character.json` 或 `characters/tate.character.json` 作为模板，您可以用来复制和自定义代理的个性和行为。
    此外，您还可以阅读 `core/src/core/defaultCharacter.ts`（在 0.0.10 版本中，但重构后将在 `packages/core/src/defaultCharacter.ts` 中）

    📝 [角色文档](./core/characterfile.md)

2. **启动代理**

    告诉它您要运行哪个角色：

    ```bash
    pnpm start --character="characters/trump.character.json"
    ```

    您还可以使用逗号分隔的列表加载多个角色：

    ```bash
    pnpm start --characters="characters/trump.character.json,characters/tate.character.json"
    ```

3. **与代理互动**

    现在您可以开始与您的代理对话了！
    打开一个新的终端窗口

    ```bash
    pnpm start:client
    ```

    一旦客户端运行，您将看到如下消息：

```
➜  Local:   http://localhost:5173/
```

只需点击链接或打开浏览器到 `http://localhost:5173/`。您将看到聊天界面连接到系统，并可以开始与您的角色互动。

## 平台集成

### Discord 机器人设置

1. 在 [Discord 开发者门户](https://discord.com/developers/applications) 创建一个新应用
2. 创建一个机器人并获取令牌
3. 使用 OAuth2 URL 生成器将机器人添加到您的服务器
4. 在 `.env` 中设置 `DISCORD_API_TOKEN` 和 `DISCORD_APPLICATION_ID`

### Twitter 集成

在 `.env` 中添加：

```bash
TWITTER_USERNAME=  # 账户用户名
TWITTER_PASSWORD=  # 账户密码
TWITTER_EMAIL=    # 账户邮箱
```

**重要提示：** 登录 [Twitter 开发者门户](https://developer.twitter.com) 并为您的账户启用“自动化”标签，以避免被标记为不真实。

### Telegram 机器人

1. 创建一个机器人
2. 将您的机器人令牌添加到 `.env`：

```bash
TELEGRAM_BOT_TOKEN=your_token_here
```

## 可选：GPU 加速

如果您有 NVIDIA GPU：

```bash
# 安装 CUDA 支持
npx --no node-llama-cpp source download --gpu cuda

# 确保已安装 CUDA Toolkit、cuDNN 和 cuBLAS
```

## 基本使用示例

### 与您的代理聊天

```bash
# 启动聊天界面
pnpm start
```

### 运行多个代理

```bash
pnpm start --characters="characters/trump.character.json,characters/tate.character.json"
```

## 常见问题及解决方案

1. **Node.js 版本**

   - 确保已安装 Node.js 23.3.0
   - 使用 `node -v` 检查版本
   - 考虑使用 [nvm](https://github.com/nvm-sh/nvm) 管理 Node 版本

   注意：pnpm 可能捆绑了不同的 node 版本，忽略 nvm。如果是这种情况，您可以使用
   ```bash
   pnpm env use --global 23.3.0
   ```
   强制使用正确的版本。

2. **Sharp 安装**
   如果看到与 Sharp 相关的错误：

    ```bash
    pnpm install --include=optional sharp
    ```

3. **CUDA 设置**

    - 验证 CUDA Toolkit 安装
    - 检查 GPU 与工具包的兼容性
    - 确保设置了正确的环境变量

4. **退出状态 1**
   如果看到

    ```
    triggerUncaughtException(
    ^
    [Object: null prototype] {
    [Symbol(nodejs.util.inspect.custom)]: [Function: [nodejs.util.inspect.custom]]
    }
    ```

    您可以尝试以下步骤，旨在将 `@types/node` 添加到项目的各个部分

    ```
    # 将依赖项添加到工作区根目录
    pnpm add -w -D ts-node typescript @types/node

    # 将依赖项添加到代理包中
    pnpm add -D ts-node typescript @types/node --filter "@elizaos/agent"

    # 还需要添加到核心包中
    pnpm add -D ts-node typescript @types/node --filter "@elizaos/core"

    # 首先清理所有内容
    pnpm clean

    # 递归安装所有依赖项
    pnpm install -r

    # 构建项目
    pnpm build

    # 然后尝试启动
    pnpm start
    ```

5. **Better sqlite3 是针对不同的 Node.js 版本编译的**
   如果看到

    ```
    Error starting agents: Error: The module '.../eliza-agents/dv/eliza/node_modules/better-sqlite3/build/Release/better_sqlite3.node'
    was compiled against a different Node.js version using
    NODE_MODULE_VERSION 131. This version of Node.js requires
    NODE_MODULE_VERSION 127. Please try re-compiling or re-installing
    ```

    您可以尝试以下方法，尝试重建 better-sqlite3。

    ```bash
    pnpm rebuild better-sqlite3
    ```

    如果这不起作用，请尝试清除根文件夹中的 node_modules

    ```bash
    rm -fr node_modules; pnpm store prune
    ```

    然后重新安装依赖项

    ```bash
    pnpm i
    ```

## 下一步

一旦您的代理运行起来，探索：

1. 🤖 [了解代理](./core/agents.md)
2. 📝 [创建自定义角色](./core/characterfile.md)
3. ⚡ [添加自定义操作](./core/actions.md)
4. 🔧 [高级配置](./guides/configuration.md)

有关详细的 API 文档、故障排除和高级功能，请查看我们的 [完整文档](https://elizaos.github.io/eliza/)。

加入我们的 [Discord 社区](https://discord.gg/ai16z) 获取支持和更新！