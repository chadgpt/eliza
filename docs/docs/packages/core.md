---
sidebar_position: 1
---

# 📦 核心包

## 概述

核心包 (`@elizaos/core`) 提供了 Eliza 架构的基本构建模块，处理以下关键功能：

- 内存管理与语义搜索
- 消息处理与生成
- 运行环境与状态管理
- 动作与评估系统
- 提供者集成与上下文组合
- 服务基础设施

## 安装

```bash
pnpm add @elizaos/core
```

## 关键组件

### AgentRuntime

AgentRuntime 类作为 Eliza 的中枢神经系统，协调所有主要组件：

```typescript
import { AgentRuntime } from "@elizaos/core";

const runtime = new AgentRuntime({
    // 核心配置
    databaseAdapter,
    token,
    modelProvider: ModelProviderName.OPENAI,
    character,

    // 扩展点
    plugins: [bootstrapPlugin, nodePlugin],
    providers: [],
    actions: [],
    services: [],
    managers: [],

    // 可选设置
    conversationLength: 32,
    agentId: customId,
    fetch: customFetch,
});
```

关键功能：

- 状态组合与管理
- 插件与服务注册
- 内存与关系管理
- 动作处理与评估
- 消息生成与处理

### 内存系统

MemoryManager 处理上下文感知信息的持久存储与检索：

```typescript
class MemoryManager implements IMemoryManager {
    runtime: IAgentRuntime;
    tableName: string;

    // 创建带有嵌入的记忆
    async createMemory(memory: Memory, unique = false): Promise<void> {
        if (!memory.embedding) {
            memory.embedding = await embed(this.runtime, memory.content.text);
        }

        await this.runtime.databaseAdapter.createMemory(
            memory,
            this.tableName,
            unique,
        );
    }

    // 使用嵌入进行语义搜索
    async searchMemoriesByEmbedding(
        embedding: number[],
        opts: {
            match_threshold?: number;
            count?: number;
            roomId: UUID;
            unique?: boolean;
        },
    ): Promise<Memory[]> {
        return this.runtime.databaseAdapter.searchMemories({
            tableName: this.tableName,
            roomId: opts.roomId,
            embedding,
            match_threshold: opts.match_threshold ?? 0.8,
            match_count: opts.count ?? 10,
            unique: opts.unique ?? false,
        });
    }
}
```

### 上下文系统

上下文系统管理状态组合与模板处理：

```typescript
// 模板组合
export const composeContext = ({
    state,
    template,
}: {
    state: State;
    template: string;
}): string => {
    return template.replace(/{{\w+}}/g, (match) => {
        const key = match.replace(/{{|}}/g, "");
        return state[key] ?? "";
    });
};

// 头部处理
export const addHeader = (header: string, body: string): string => {
    return body.length > 0 ? `${header ? header + "\n" : header}${body}\n` : "";
};
```

### 动作系统

动作定义了可用的行为与响应：

```typescript
interface Action {
    name: string;
    similes: string[];
    description: string;
    examples: MessageExample[][];

    validate: (
        runtime: IAgentRuntime,
        message: Memory,
        state?: State,
    ) => Promise<boolean>;

    handler: (
        runtime: IAgentRuntime,
        message: Memory,
        state?: State,
        options?: any,
        callback?: HandlerCallback,
    ) => Promise<void>;
}

// 示例动作实现
const generateImageAction: Action = {
    name: "GENERATE_IMAGE",
    similes: ["CREATE_IMAGE", "MAKE_PICTURE"],
    description: "从文本生成 AI 图像",

    validate: async (runtime, message) => {
        return (
            !!runtime.getSetting("ANTHROPIC_API_KEY") &&
            !!runtime.getSetting("TOGETHER_API_KEY")
        );
    },

    handler: async (runtime, message, state, options, callback) => {
        const images = await generateImage(
            { prompt: message.content.text },
            runtime,
        );

        const captions = await Promise.all(
            images.data.map((image) =>
                generateCaption({ imageUrl: image }, runtime),
            ),
        );

        callback?.(
            {
                text: "生成的图像",
                attachments: images.data.map((image, i) => ({
                    id: crypto.randomUUID(),
                    url: image,
                    title: "生成的图像",
                    description: captions[i].title,
                })),
            },
            [],
        );
    },
};
```

### 评估系统

评估器评估消息并指导代理行为：

```typescript
interface Evaluator {
    name: string;
    similes: string[];
    alwaysRun?: boolean;

    validate: (
        runtime: IAgentRuntime,
        message: Memory,
        state?: State,
    ) => Promise<boolean>;

    handler: (runtime: IAgentRuntime, message: Memory) => Promise<void>;
}

// 示例评估器
const factEvaluator: Evaluator = {
    name: "EVALUATE_FACTS",
    similes: ["CHECK_FACTS"],
    alwaysRun: true,

    validate: async (runtime, message) => {
        return message.content.text.includes("fact:");
    },

    handler: async (runtime, message) => {
        const facts = await runtime.loreManager.searchMemories({
            text: message.content.text,
            threshold: 0.8,
        });

        if (facts.length > 0) {
            await runtime.messageManager.createMemory({
                content: {
                    text: `已验证的事实: ${facts[0].content.text}`,
                },
                roomId: message.roomId,
                userId: runtime.agentId,
            });
        }
    },
};
```

### 状态管理

状态系统维护对话上下文与代理知识：

```typescript
interface State {
    // 代理身份
    agentId: UUID;
    agentName: string;
    bio: string;
    lore: string;
    adjective?: string;

    // 对话上下文
    senderName?: string;
    actors: string;
    actorsData: Actor[];
    recentMessages: string;
    recentMessagesData: Memory[];

    // 目标
    goals: string;
    goalsData: Goal[];

    // 行为指导
    actions: string;
    actionNames: string;
    evaluators: string;
    evaluatorNames: string;

    // 额外上下文
    providers: string;
    attachments: string;
    characterPostExamples?: string;
    characterMessageExamples?: string;
}
```

## 服务架构

核心实现了基于服务的架构：

```typescript
// 服务基类
class Service {
    static serviceType: ServiceType;

    async initialize(
        device: string | null,
        runtime: IAgentRuntime,
    ): Promise<void>;
}

// 服务注册表
class ServiceRegistry {
    private services = new Map<ServiceType, Service>();

    registerService(service: Service): void {
        const type = (service as typeof Service).serviceType;
        if (this.services.has(type)) {
            console.warn(`服务 ${type} 已注册`);
            return;
        }
        this.services.set(type, service);
    }

    getService<T>(type: ServiceType): T | null {
        return (this.services.get(type) as T) || null;
    }
}
```

## 最佳实践

### 内存管理

```typescript
// 对重要记忆使用唯一标志
await memoryManager.createMemory(memory, true);

// 使用适当的阈值进行搜索
const similar = await memoryManager.searchMemoriesByEmbedding(embedding, {
    match_threshold: 0.8,
    count: 10,
});

// 定期清理旧记忆
await memoryManager.removeAllMemories(roomId, tableName);
```

### 状态组合

```typescript
// 组合完整状态
const state = await runtime.composeState(message, {
    additionalContext: "自定义上下文",
});

// 更新最近消息状态
const updatedState = await runtime.updateRecentMessageState(state);

// 添加自定义提供者
state.providers = addHeader(
    "# 额外信息",
    await Promise.all(providers.map((p) => p.get(runtime, message))).join("\n"),
);
```

### 服务管理

```typescript
// 服务初始化
class CustomService extends Service {
    static serviceType = ServiceType.CUSTOM;

    async initialize(device: string | null, runtime: IAgentRuntime) {
        await this.setupDependencies();
        await this.validateConfig();
        await this.connect();
    }

    async cleanup() {
        await this.disconnect();
        await this.clearResources();
    }
}

// 服务注册
runtime.registerService(new CustomService());

// 服务使用
const service = runtime.getService<CustomService>(ServiceType.CUSTOM);
```

## 错误处理

在整个过程中实现适当的错误处理：

```typescript
try {
    await runtime.processActions(message, responses, state);
} catch (error) {
    if (error instanceof TokenError) {
        await this.refreshToken();
    } else if (error instanceof DatabaseError) {
        await this.reconnectDatabase();
    } else {
        console.error("意外错误:", error);
        throw error;
    }
}
```

## 高级功能

### 自定义内存类型

```typescript
// 创建专门的内存管理器
class DocumentMemoryManager extends MemoryManager {
    constructor(runtime: IAgentRuntime) {
        super({
            runtime,
            tableName: "documents",
            useCache: true,
        });
    }

    async processDocument(doc: Document): Promise<void> {
        const chunks = await splitChunks(doc.content);

        for (const chunk of chunks) {
            await this.createMemory({
                content: { text: chunk },
                metadata: {
                    documentId: doc.id,
                    section: chunk.section,
                },
            });
        }
    }
}
```

### 增强嵌入

```typescript
// 高级嵌入处理
async function enhancedEmbed(
    runtime: IAgentRuntime,
    text: string,
    opts: {
        model?: string;
        dimensions?: number;
        pooling?: "mean" | "max";
    },
): Promise<number[]> {
    // 获取缓存的嵌入（如果有）
    const cached = await runtime.databaseAdapter.getCachedEmbeddings({
        query_input: text,
        query_threshold: 0.95,
    });

    if (cached.length > 0) {
        return cached[0].embedding;
    }

    // 生成新的嵌入
    return embed(runtime, text, opts);
}
```

### 状态持久化

```typescript
class StateManager {
    async saveState(state: State): Promise<void> {
        await this.runtime.databaseAdapter.createMemory(
            {
                content: {
                    type: "state",
                    data: state,
                },
                roomId: state.roomId,
                userId: state.agentId,
            },
            "states",
        );
    }

    async loadState(roomId: UUID): Promise<State | null> {
        const states = await this.runtime.databaseAdapter.getMemories({
            roomId,
            tableName: "states",
            count: 1,
        });

        return states[0]?.content.data || null;
    }
}
```

## 相关文档

- [API 参考](/api/classes/AgentRuntime)

---