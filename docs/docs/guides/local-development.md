---
sidebar_position: 12
---

# 💻 本地开发指南

本指南涵盖在开发环境中设置和使用 Eliza 的步骤。

## 先决条件

在开始之前，请确保您已具备：

```bash
# 必需
Node.js 23+
pnpm
Git

# 可选但推荐
VS Code
Docker（用于数据库开发）
CUDA Toolkit（用于 GPU 加速）
```

## 初始设置

### 1. 仓库设置

```bash
# 克隆仓库
git clone https://github.com/elizaos/eliza.git
cd eliza

# 安装依赖
pnpm install

# 安装可选依赖
pnpm install --include=optional sharp
```

### 2. 环境配置

创建您的开发环境文件：

```bash
cp .env.example .env
```

配置基本的开发变量：

```bash
# 本地开发的最低要求
OPENAI_API_KEY=sk-*           # 可选，用于 OpenAI 功能
X_SERVER_URL=                 # 本地推理时留空
XAI_API_KEY=                 # 本地推理时留空
XAI_MODEL=meta-llama/Llama-3.1-7b-instruct  # 本地模型
```

### 3. 本地模型设置

用于无 API 依赖的本地推理：

```bash
# 为 NVIDIA GPU 安装 CUDA 支持
npx --no node-llama-cpp source download --gpu cuda

# 系统将在首次运行时自动从 Hugging Face 下载模型
```

## 开发工作流程

### 运行开发服务器

```bash
# 使用默认角色启动
pnpm run dev

# 使用特定角色启动
pnpm run dev --characters="characters/my-character.json"

# 使用多个角色启动
pnpm run dev --characters="characters/char1.json,characters/char2.json"
```

### 开发命令

```bash
pnpm run build          # 构建项目
pnpm run clean         # 清理构建产物
pnpm run dev           # 启动开发服务器
pnpm run test          # 运行测试
pnpm run test:watch    # 监视模式下运行测试
pnpm run lint          # 代码检查
```

### 直接客户端聊天界面

```
# 打开终端并使用特定角色启动
pnpm run dev --characters="characters/my-character.json"
```

```
# 打开第二个终端并启动客户端
pnpm start:client
```

查找消息：
`  ➜  Local:   http://localhost:5173/`
点击该链接或在浏览器窗口中打开该位置。完成后，您应该会看到聊天界面与系统连接，并可以开始与您的角色互动。

## 数据库开发

### SQLite（推荐用于开发）

```typescript
import { SqliteDatabaseAdapter } from "@elizaos/core/adapters";
import Database from "better-sqlite3";

const db = new SqliteDatabaseAdapter(new Database("./dev.db"));
```

### 内存数据库（用于测试）

```typescript
import { SqlJsDatabaseAdapter } from "@elizaos/core/adapters";

const db = new SqlJsDatabaseAdapter(new Database(":memory:"));
```

### 模式管理

```bash
# 创建新迁移
pnpm run migration:create

# 运行迁移
pnpm run migration:up

# 回滚迁移
pnpm run migration:down
```

## 测试

### 运行测试

```bash
# 运行所有测试
pnpm test

# 运行特定测试文件
pnpm test tests/specific.test.ts

# 运行带覆盖率的测试
pnpm test:coverage

# 运行特定数据库的测试
pnpm test:sqlite
pnpm test:sqljs
```

### 编写测试

```typescript
import { runAiTest } from "@elizaos/core/test_resources";

describe("Feature Test", () => {
    beforeEach(async () => {
        // 设置测试环境
    });

    it("should perform expected behavior", async () => {
        const result = await runAiTest({
            messages: [
                {
                    user: "user1",
                    content: { text: "test message" },
                },
            ],
            expected: "expected response",
        });
        expect(result.success).toBe(true);
    });
});
```

## 插件开发

### 创建新插件

```typescript
// plugins/my-plugin/src/index.ts
import { Plugin } from "@elizaos/core/types";

export const myPlugin: Plugin = {
    name: "my-plugin",
    description: "My custom plugin",
    actions: [],
    evaluators: [],
    providers: [],
};
```

### 自定义动作开发

```typescript
// plugins/my-plugin/src/actions/myAction.ts
export const myAction: Action = {
    name: "MY_ACTION",
    similes: ["SIMILAR_ACTION"],
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        return true;
    },
    handler: async (runtime: IAgentRuntime, message: Memory) => {
        // 实现
        return true;
    },
    examples: [],
};
```

## 调试

### VS Code 配置

创建 `.vscode/launch.json`：

```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "type": "node",
            "request": "launch",
            "name": "Debug Eliza",
            "skipFiles": ["<node_internals>/**"],
            "program": "${workspaceFolder}/src/index.ts",
            "runtimeArgs": ["-r", "ts-node/register"],
            "env": {
                "DEBUG": "eliza:*"
            }
        }
    ]
}
```

### 调试技巧

1. 启用调试日志

```bash
# 添加到您的 .env 文件
DEBUG=eliza:*
```

2. 使用调试点

```typescript
const debug = require("debug")("eliza:dev");

debug("操作详情: %O", {
    operation: "functionName",
    params: parameters,
    result: result,
});
```

3. 内存调试

```bash
# 增加 Node.js 内存用于开发
NODE_OPTIONS="--max-old-space-size=8192" pnpm run dev
```

## 常见开发任务

### 1. 添加新角色

```json
{
    "name": "DevBot",
    "description": "开发测试机器人",
    "modelProvider": "openai",
    "settings": {
        "debug": true,
        "logLevel": "debug"
    }
}
```

### 2. 创建自定义服务

```typescript
class CustomService extends Service {
    static serviceType = ServiceType.CUSTOM;

    async initialize() {
        // 设置代码
    }

    async process(input: any): Promise<any> {
        // 服务逻辑
    }
}
```

### 3. 使用模型

```typescript
// 本地模型配置
const localModel = {
    modelProvider: "llamalocal",
    settings: {
        modelPath: "./models/llama-7b.gguf",
        contextSize: 8192,
    },
};

// 云模型配置
const cloudModel = {
    modelProvider: "openai",
    settings: {
        model: "gpt-4o-mini",
        temperature: 0.7,
    },
};
```

## 性能优化

### CUDA 设置

对于 NVIDIA GPU 用户：

1. 安装带有 cuDNN 和 cuBLAS 的 CUDA Toolkit
2. 设置环境变量：

```bash
CUDA_PATH=/usr/local/cuda  # Windows: C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v11.0
```

### 内存管理

```typescript
class MemoryManager {
    private cache = new Map();
    private maxSize = 1000;

    async cleanup() {
        if (this.cache.size > this.maxSize) {
            // 实现清理逻辑
        }
    }
}
```

## 故障排除

### 常见问题

1. 模型加载问题

```bash
# 清除模型缓存
rm -rf ./models/*
# 重新启动并重新下载
```

2. 数据库连接问题

```bash
# 测试数据库连接
pnpm run test:db-connection
```

3. 内存问题

```bash
# 检查内存使用情况
node --trace-gc index.js
```

### 开发工具

```bash
# 生成 TypeScript 文档
pnpm run docs:generate

# 检查循环依赖
pnpm run madge

# 分析包大小
pnpm run analyze
```

## 最佳实践

1. 代码组织

    - 将自定义动作放在 `custom_actions/`
    - 将角色文件保存在 `characters/`
    - 将测试数据存储在 `tests/fixtures/`

2. 测试策略

    - 为新功能编写单元测试
    - 为插件使用集成测试
    - 使用多个模型提供商进行测试

3. Git 工作流程
    - 创建功能分支
    - 遵循常规提交
    - 保持 PR 集中

## 其他工具

### 角色开发

```bash
# 从 Twitter 数据生成角色
npx tweets2character

# 将文档转换为知识库
npx folder2knowledge <path/to/folder>

# 将知识添加到角色
npx knowledge2character <character-file> <knowledge-file>
```

### 开发脚本

```bash
# 分析代码库
./scripts/analyze-codebase.ts

# 提取训练用推文
./scripts/extracttweets.js

# 清理构建产物
./scripts/clean.sh
```

## 进一步资源

- [配置指南](./configuration.md) 了解设置详情
- [高级用法](./advanced.md) 了解复杂功能
- [API 文档](/api) 完整的 API 参考
- [贡献指南](../contributing.md) 了解贡献指南