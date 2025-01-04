---
sidebar_position: 5
---

# 📊 评估器

[评估器](/api/interfaces/evaluator) 是评估和提取对话信息的核心组件。它们与 [AgentRuntime](/api/classes/AgentRuntime) 的评估系统集成。

---

## 概述

评估器使代理能够：

- 构建长期记忆
- 跟踪目标进展
- 提取事实和见解
- 保持上下文意识

---

## 快速开始

1. 导入必要的评估器类型：

```typescript
import { Evaluator, IAgentRuntime, Memory, State } from "@elizaos/core-core";
```

2. 选择或创建一个评估器：

```typescript
const evaluator: Evaluator = {
    name: "BASIC_EVALUATOR",
    similes: ["SIMPLE_EVALUATOR"],
    description: "评估基本对话元素",
    validate: async (runtime: IAgentRuntime, message: Memory) => true,
    handler: async (runtime: IAgentRuntime, message: Memory) => {
        // 评估逻辑
        return result;
    },
    examples: [],
};
```

---

## 内置评估器

### 事实评估器

事实评估器从对话中提取并存储事实信息。

```typescript
interface Fact {
    claim: string;
    type: "fact" | "opinion" | "status";
    in_bio: boolean;
    already_known: boolean;
}
```

来源: https://github.com/elizaos/eliza/blob/main/packages/core/src/types.ts

**示例事实:**

```json
{
    "claim": "用户完成了马拉松训练",
    "type": "fact",
    "in_bio": false,
    "already_known": false
}
```

### 目标评估器

来自 bootstrap 插件 - 跟踪对话目标：

```typescript
interface Goal {
    id: string;
    name: string;
    status: "IN_PROGRESS" | "DONE" | "FAILED";
    objectives: Objective[];
}

interface Objective {
    description: string;
    completed: boolean;
}
```

---

## 最佳实践

### 事实提取

- 在存储前验证事实
- 避免重复条目
- 包含相关上下文
- 正确分类信息类型

### 目标跟踪

- 定义明确、可衡量的目标
- 仅更新已更改的目标
- 优雅地处理失败
- 跟踪部分进展

### 验证

- 保持验证逻辑高效
- 首先检查先决条件
- 考虑消息内容和状态
- 使用适当的内存管理器

### 处理程序实现

- 适当地使用运行时服务
- 将结果存储在正确的内存管理器中
- 优雅地处理错误
- 保持状态一致性

### 示例

- 提供清晰的上下文描述
- 显示典型的触发消息
- 记录预期结果
- 覆盖边缘情况

---

## 创建自定义评估器

实现 Evaluator 接口：

```typescript
interface Evaluator {
    name: string;
    similes: string[];
    description: string;
    validate: (runtime: IAgentRuntime, message: Memory) => Promise<boolean>;
    handler: (
        runtime: IAgentRuntime,
        message: Memory,
        state?: State,
        options?: any,
    ) => Promise<any>;
    examples: EvaluatorExample[];
}
```

来源: https://github.com/elizaos/eliza/blob/main/packages/core/src/types.ts

### 内存集成

存储评估结果的示例：

```typescript
try {
    const memory = await runtime.memoryManager.addEmbeddingToMemory({
        userId: user?.id,
        content: { text: evaluationResult },
        roomId: roomId,
        embedding: await embed(runtime, evaluationResult),
    });

    await runtime.memoryManager.createMemory(memory);
} catch (error) {
    console.error("存储评估结果失败:", error);
}
```

来源: https://github.com/elizaos/eliza/blob/main/packages/core/src/tests/memory.test.ts

### 内存使用

评估器应使用运行时内存管理器进行存储：

```typescript
const memoryEvaluator: Evaluator = {
    name: "MEMORY_EVAL",
    handler: async (runtime: IAgentRuntime, message: Memory) => {
        // 存储在消息内存中
        await runtime.messageManager.createMemory({
            id: message.id,
            content: message.content,
            roomId: message.roomId,
            userId: message.userId,
            agentId: runtime.agentId,
        });

        // 存储在描述内存中
        await runtime.descriptionManager.createMemory({
            id: message.id,
            content: { text: "用户描述" },
            roomId: message.roomId,
            userId: message.userId,
            agentId: runtime.agentId,
        });
    },
};
```

---

## 与 Agent Runtime 的集成

[AgentRuntime](/api/classes/AgentRuntime) 通过其 [evaluate](/api/classes/AgentRuntime#evaluate) 方法处理评估器：

```typescript
// 注册评估器
runtime.registerEvaluator(customEvaluator);

// 处理评估
const results = await runtime.evaluate(message, state);
```

---

## 错误处理

```typescript
const robustEvaluator: Evaluator = {
    name: "ROBUST_EVAL",
    handler: async (runtime: IAgentRuntime, message: Memory) => {
        try {
            // 尝试评估
            await runtime.messageManager.createMemory({
                id: message.id,
                content: message.content,
                roomId: message.roomId,
                userId: message.userId,
                agentId: runtime.agentId,
            });
        } catch (error) {
            // 记录错误并优雅地处理
            console.error("评估失败:", error);

            // 如果需要，存储错误状态
            await runtime.messageManager.createMemory({
                id: message.id,
                content: { text: "评估失败" },
                roomId: message.roomId,
                userId: message.userId,
                agentId: runtime.agentId,
            });
        }
    },
};
```

---