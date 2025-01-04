# 🔌 提供者

[Providers](/api/interfaces/provider) 是核心模块，它们将动态上下文和实时信息注入到代理交互中。它们充当代理与各种外部系统之间的桥梁，提供市场数据、钱包信息、情感分析和时间上下文的访问。

---

## 概述

提供者的主要目的是：

- 提供动态上下文信息
- 与代理运行时集成
- 为对话模板格式化信息
- 保持一致的数据访问

### 核心结构

```typescript
interface Provider {
    get: (
        runtime: IAgentRuntime,
        message: Memory,
        state?: State,
    ) => Promise<string>;
}
```

---

## 内置提供者

### 时间提供者

为代理交互提供时间上下文：

```typescript
const timeProvider: Provider = {
    get: async (_runtime: IAgentRuntime, _message: Memory) => {
        const currentDate = new Date();
        const currentTime = currentDate.toLocaleTimeString("en-US");
        const currentYear = currentDate.getFullYear();
        return `当前时间是：${currentTime}, ${currentYear}`;
    },
};
```

### 事实提供者

来自引导插件 - 维护对话事实：

```typescript
const factsProvider: Provider = {
    get: async (runtime: IAgentRuntime, message: Memory, state?: State) => {
        // 为最近的消息创建嵌入并检索相关事实
        const recentMessages = formatMessages({
            messages: state?.recentMessagesData?.slice(-10),
            actors: state?.actorsData,
        });
        const embedding = await embed(runtime, recentMessages);
        const memoryManager = new MemoryManager({
            runtime,
            tableName: "facts",
        });
        const recentFactsData = await memoryManager.getMemories({
            roomId: message.roomId,
            count: 10,
            agentId: runtime.agentId,
        });

        // 组合并格式化事实
        const allFacts = [...recentFactsData]; // 如果没有重叠，可以跳过去重
        const formattedFacts = formatFacts(allFacts);

        return `关键事实 ${runtime.character.name} 知道：\n${formattedFacts}`;
    },
};

export { factsProvider };
```

### 无聊提供者

来自引导插件 - 通过计算代理在聊天室中最近消息的无聊程度来管理对话动态和参与度。

1. **数据结构**：

    - **boredomLevels**：一个对象数组，每个对象代表一个无聊级别，具有最小分数和一组反映代理当前参与度的状态消息。
    - **interestWords**、**cringeWords** 和 **negativeWords**：根据消息中出现的词语影响无聊分数的数组。

2. **无聊计算**：

- `boredomProvider` 获取代理在过去 15 分钟内的最近消息。
- 它通过分析这些消息的文本来计算**无聊分数**。分数受以下因素影响：
    - **兴趣词**：减少无聊（减 1 分）。
    - **尴尬词**：增加无聊（加 1 分）。
    - **负面词**：增加无聊（加 1 分）。
    - **感叹号**：增加无聊（加 1 分）。
    - **问号**：根据发送者增加或减少无聊。

3. **无聊级别**：
    - 无聊分数与 `boredomLevels` 数组中的一个级别匹配，该数组定义了代理的参与感。
    - 从选定的无聊级别中随机选择一个状态消息，并将代理的名字插入到消息中。

```typescript
interface BoredomLevel {
    minScore: number;
    statusMessages: string[];
}
```

结果是一个反映代理在对话中感知的参与度水平的消息，基于他们最近的互动。

```typescript
const boredomProvider: Provider = {
    get: async (runtime: IAgentRuntime, message: Memory) => {
        const messages = await runtime.messageManager.getMemories({
            roomId: message.roomId,
            count: 10,
        });

        return messages.length > 0
            ? "积极参与对话"
            : "没有最近的互动";
    },
};
```

特点：

- 参与度跟踪
- 对话流程管理
- 自然脱离
- 情感分析
- 响应适应

---

## 实现

### 基本提供者模板

```typescript
import { Provider, IAgentRuntime, Memory, State } from "@elizaos/core";

const customProvider: Provider = {
    get: async (runtime: IAgentRuntime, message: Memory, state?: State) => {
        // 使用运行时服务获取相关数据
        const memories = await runtime.messageManager.getMemories({
            roomId: message.roomId,
            count: 5,
        });

        // 格式化并返回上下文
        return formatContextString(memories);
    },
};
```

### 内存集成

```typescript
const memoryProvider: Provider = {
    get: async (runtime: IAgentRuntime, message: Memory) => {
        // 获取最近的消息
        const messages = await runtime.messageManager.getMemories({
            roomId: message.roomId,
            count: 5,
            unique: true,
        });

        // 获取用户描述
        const descriptions = await runtime.descriptionManager.getMemories({
            roomId: message.roomId,
            userId: message.userId,
        });

        // 组合并格式化
        return `
最近活动：
${formatMessages(messages)}

用户上下文：
${formatDescriptions(descriptions)}
    `.trim();
    },
};
```

---

## 最佳实践

### 1. 数据管理

- 实施强大的缓存策略
- 为不同的数据类型使用适当的 TTL
- 在缓存之前验证数据

### 2. 性能

```typescript
// 优化数据获取示例
async function fetchDataWithCache<T>(
    key: string,
    fetcher: () => Promise<T>,
): Promise<T> {
    const cached = await cache.get(key);
    if (cached) return cached;

    const data = await fetcher();
    await cache.set(key, data);
    return data;
}
```

### 3. 错误处理

- 实施重试机制
- 提供备用值
- 全面记录错误
- 处理 API 超时

### 4. 安全

- 验证输入参数
- 清理返回的数据
- 实施速率限制
- 适当处理敏感数据

---

## 与运行时集成

提供者通过 [AgentRuntime](/api/classes/AgentRuntime) 注册：

```typescript
// 注册提供者
runtime.registerContextProvider(customProvider);

// 提供者通过 composeState 访问
const state = await runtime.composeState(message);
```

## 示例：完整提供者

```typescript
import { Provider, IAgentRuntime, Memory, State } from "@elizaos/core";

const comprehensiveProvider: Provider = {
    get: async (runtime: IAgentRuntime, message: Memory, state?: State) => {
        try {
            // 获取最近的消息
            const messages = await runtime.messageManager.getMemories({
                roomId: message.roomId,
                count: 5,
            });

            // 获取用户上下文
            const userContext = await runtime.descriptionManager.getMemories({
                roomId: message.roomId,
                userId: message.userId,
            });

            // 获取相关事实
            const facts = await runtime.messageManager.getMemories({
                roomId: message.roomId,
                tableName: "facts",
                count: 3,
            });

            // 格式化综合上下文
            return `
# 对话上下文
${messages.map((m) => `- ${m.content.text}`).join("\n")}

# 用户信息
${userContext.map((c) => c.content.text).join("\n")}

# 相关事实
${facts.map((f) => `- ${f.content.text}`).join("\n")}
      `.trim();
        } catch (error) {
            console.error("提供者错误：", error);
            return "上下文暂时不可用";
        }
    },
};
```

---

## 故障排除

1. **数据陈旧**

    ```typescript
    // 实施缓存失效
    const invalidateCache = async (pattern: string) => {
        const keys = await cache.keys(pattern);
        await Promise.all(keys.map((k) => cache.del(k)));
    };
    ```

2. **速率限制**

    ```typescript
    // 实施退避策略
    const backoff = async (attempt: number) => {
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
        await new Promise((resolve) => setTimeout(resolve, delay));
    };
    ```

3. **API 失败**
    ```typescript
    // 实施备用数据源
    const getFallbackData = async () => {
        // 尝试替代数据源
    };
    ```

---

## 进一步阅读

- [代理运行时](./agents.md)
- [内存系统](../../packages/core)

---