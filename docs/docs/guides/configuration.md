---
sidebar_position: 9
---

# ⚙️ 配置指南

本指南涵盖了如何为不同的用例和环境配置Eliza。我们将逐步介绍所有可用的配置选项和最佳实践。

## 环境配置

### 基本设置

第一步是创建您的环境配置文件：

```bash
cp .env.example .env
```

### 核心环境变量

以下是您需要配置的基本环境变量：

```bash
# 核心API密钥
OPENAI_API_KEY=sk-your-key # OpenAI功能所需
ANTHROPIC_API_KEY=your-key  # Claude模型所需
TOGETHER_API_KEY=your-key   # Together.ai模型所需

# 默认设置
XAI_MODEL=gpt-4o-mini      # 默认使用的模型
X_SERVER_URL=              # 可选的模型API端点
```

### 客户端特定配置

#### Discord配置

```bash
DISCORD_APPLICATION_ID=     # 您的Discord应用ID
DISCORD_API_TOKEN=         # Discord机器人令牌
```

#### Twitter配置

```bash
TWITTER_USERNAME=          # 机器人Twitter用户名
TWITTER_PASSWORD=          # 机器人Twitter密码
TWITTER_EMAIL=            # Twitter账户邮箱
TWITTER_DRY_RUN=false    # 测试模式，不发布
```

#### Telegram配置

```bash
TELEGRAM_BOT_TOKEN=       # Telegram机器人令牌
```

### 模型提供商设置

您可以配置不同的AI模型提供商：

```bash
# OpenAI设置
OPENAI_API_KEY=sk-*

# Anthropic设置
ANTHROPIC_API_KEY=

# Together.ai设置
TOGETHER_API_KEY=

# Heurist设置
HEURIST_API_KEY=

# Livepeer设置
LIVEPEER_GATEWAY_URL=

# 本地模型设置
XAI_MODEL=meta-llama/Llama-3.1-7b-instruct
```

### 图像生成

在您的角色文件中配置图像生成：

```json
{
    "modelProvider": "heurist",
    "settings": {
        "imageSettings": {
            "steps": 20,
            "width": 1024,
            "height": 1024
        }
    }
}
```

示例用法：

```typescript
const result = await generateImage(
    {
        prompt: 'A cute anime girl with big breasts and straight long black hair wearing orange T-shirt. The T-shirt has "ai16z" texts in the front. The girl is looking at the viewer',
        width: 1024,
        height: 1024,
        numIterations: 20, // 可选
        guidanceScale: 3, // 可选
        seed: -1, // 可选
        modelId: "FLUX.1-dev", // 可选
    },
    runtime,
);
```

## 角色配置

### 角色文件结构

角色文件定义了您的代理的个性和行为。在`characters/`目录中创建它们：

```json
{
    "name": "AgentName",
    "clients": ["discord", "twitter"],
    "modelProvider": "openai",
    "settings": {
        "secrets": {
            "OPENAI_API_KEY": "character-specific-key",
            "DISCORD_TOKEN": "bot-specific-token"
        }
    }
}
```

### 加载角色

您可以通过多种方式加载角色：

```bash
# 加载默认角色
pnpm start

# 加载特定角色
pnpm start --characters="characters/your-character.json"

# 加载多个角色
pnpm start --characters="characters/char1.json,characters/char2.json"
```

## 自定义操作

### 添加自定义操作

1. 创建一个`custom_actions`目录
2. 将您的操作文件添加到该目录
3. 在`elizaConfig.yaml`中配置：

```yaml
actions:
    - name: myCustomAction
      path: ./custom_actions/myAction.ts
```

### 操作配置结构

```typescript
export const myAction: Action = {
    name: "MY_ACTION",
    similes: ["SIMILAR_ACTION", "ALTERNATE_NAME"],
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        // 验证逻辑
        return true;
    },
    description: "操作描述",
    handler: async (runtime: IAgentRuntime, message: Memory) => {
        // 操作逻辑
        return true;
    },
};
```

## 提供商配置

### 数据库提供商

配置不同的数据库后端：

```typescript
// SQLite（推荐用于开发）
import { SqliteDatabaseAdapter } from "@your-org/agent-framework/adapters";
const db = new SqliteDatabaseAdapter("./dev.db");

// PostgreSQL（生产环境）
import { PostgresDatabaseAdapter } from "@your-org/agent-framework/adapters";
const db = new PostgresDatabaseAdapter({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});
```

### 模型提供商

在您的角色文件中配置模型提供商：

```json
{
    "modelProvider": "openai",
    "settings": {
        "model": "gpt-4o-mini",
        "temperature": 0.7,
        "maxTokens": 2000
    }
}
```

## 高级配置

### 运行时设置

微调运行时行为：

```typescript
const settings = {
    // 日志记录
    DEBUG: "eliza:*",
    LOG_LEVEL: "info",

    // 性能
    MAX_CONCURRENT_REQUESTS: 5,
    REQUEST_TIMEOUT: 30000,

    // 内存
    MEMORY_TTL: 3600,
    MAX_MEMORY_ITEMS: 1000,
};
```

### 插件配置

在`elizaConfig.yaml`中启用和配置插件：

```yaml
plugins:
    - name: solana
      enabled: true
      settings:
          network: mainnet-beta
          endpoint: https://api.mainnet-beta.solana.com

    - name: image-generation
      enabled: true
      settings:
          provider: dalle
          size: 1024x1024
```

## 配置最佳实践

1. **环境隔离**

    - 为不同的环境使用不同的`.env`文件
    - 遵循命名约定：`.env.development`，`.env.staging`，`.env.production`

2. **密钥管理**

    - 切勿将密钥提交到版本控制
    - 在生产环境中使用密钥管理服务
    - 定期轮换API密钥

3. **角色配置**

    - 保持角色文件模块化和专注
    - 使用继承共享特性
    - 记录角色行为

4. **插件管理**

    - 仅启用所需的插件
    - 在单独的文件中配置插件特定设置
    - 监控插件性能

5. **数据库配置**
    - 开发环境使用SQLite
    - 为生产环境配置连接池
    - 设置适当的索引

## 故障排除

### 常见问题

1. **环境变量未加载**

    ```bash
    # 检查.env文件位置
    node -e "console.log(require('path').resolve('.env'))"

    # 验证环境变量
    node -e "console.log(process.env)"
    ```

2. **角色加载失败**

    ```bash
    # 验证角色文件
    npx ajv validate -s character-schema.json -d your-character.json
    ```

3. **数据库连接问题**
    ```bash
    # 测试数据库连接
    npx ts-node scripts/test-db-connection.ts
    ```

### 配置验证

使用内置的配置验证器：

```bash
pnpm run validate-config
```

这将检查：

- 环境变量
- 角色文件
- 数据库配置
- 插件设置

## 进一步资源

- [快速入门指南](../quickstart.md) 进行初始设置
- [密钥管理](./secrets-management.md) 进行安全配置
- [本地开发](./local-development.md) 进行开发设置
- [高级用法](./advanced.md) 进行复杂配置