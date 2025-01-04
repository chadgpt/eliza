---
sidebar_position: 2
---

# 🤖 代理

代理是 Eliza 框架的核心组件，负责自主交互。每个代理在运行时环境中运行，并可以通过各种客户端（如 Discord、Telegram 等）进行交互，同时保持一致的行为和记忆。

---

## 概述

[AgentRuntime](/api/classes/AgentRuntime) 类是 [IAgentRuntime](/api/interfaces/IAgentRuntime) 接口的主要实现，管理代理的核心功能，包括：

- **消息和记忆处理**：存储、检索和管理对话数据和上下文记忆。
- **状态管理**：组成和更新代理的状态，以实现连贯的持续交互。
- **行为执行**：处理转录媒体、生成图像和跟随房间等行为。
- **评估和响应**：评估响应、管理目标和提取相关信息。

---

## 核心组件

每个代理运行时由关键组件组成，提供灵活和可扩展的功能：

1. **客户端**：支持跨平台通信，如 Discord、Telegram 和 Direct（REST API），并为每个平台提供定制功能。
2. **提供者**：通过集成额外服务（如时间、钱包或自定义数据）扩展代理的能力。
3. **行为**：定义代理行为，如跟随房间、生成图像或处理附件。可以创建自定义行为以满足特定需求。
4. **评估器**：通过评估消息相关性、管理目标、提取事实和构建长期记忆来管理代理响应。

### AgentRuntime 接口

`IAgentRuntime` 接口定义了运行时环境的主要结构，指定了配置和基本组件：

```typescript
interface IAgentRuntime {
    // 核心标识
    agentId: UUID;
    serverUrl: string;
    token: string;

    // 配置
    character: Character;
    modelProvider: ModelProviderName;

    // 组件
    actions: Action[];
    evaluators: Evaluator[];
    providers: Provider[];

    // 数据库和记忆
    databaseAdapter: IDatabaseAdapter;
    messageManager: IMemoryManager;
    descriptionManager: IMemoryManager;
    loreManager: IMemoryManager;
}
```

运行时接口中的每个元素都起着至关重要的作用：

- **标识**：代理 ID、服务器 URL 和令牌用于身份验证和标识。
- **配置**：角色配置和模型提供者定义了代理的个性和语言模型。
- **组件**：行为、评估器和提供者支持可扩展的行为、响应评估和服务集成。
- **记忆管理**：专门的记忆管理器跟踪对话、描述和静态知识，以实现上下文和自适应响应。

---

## 创建代理运行时

本节演示了如何使用基本和可选配置设置代理。它提供了一个工作示例和示例代码，帮助用户快速开始构建：

```typescript
import { AgentRuntime, ModelProviderName } from "@elizaos/core";

// 配置示例
const runtime = new AgentRuntime({
    token: "auth-token",
    modelProvider: ModelProviderName.ANTHROPIC,
    character: characterConfig,
    databaseAdapter: new DatabaseAdapter(),
    conversationLength: 32,
    serverUrl: "http://localhost:7998",
    actions: customActions,
    evaluators: customEvaluators,
    providers: customProviders,
});
```

---

## 状态管理

本节介绍了代理如何管理和更新状态，重点是初始状态组成和更新方法。运行时通过 [State](/api/interfaces/state) 接口维护状态：

```typescript
interface State {
    userId?: UUID;
    agentId?: UUID;
    roomId: UUID;
    bio: string;
    lore: string;
    agentName?: string;
    senderName?: string;
    actors: string;
    actorsData?: Actor[];
    recentMessages: string;
    recentMessagesData: Memory[];
    goals?: string;
    goalsData?: Goal[];
    actions?: string;
    actionNames?: string;
    providers?: string;
}
```

状态组成和更新通过专用方法处理：

```typescript
// 组成初始状态
const state = await runtime.composeState(message, {
    additionalContext: "custom-context",
});

// 更新消息状态
const updatedState = await runtime.updateRecentMessageState(state);
```

**最佳实践**

- 尽可能保持状态不可变
- 使用 `composeState` 创建初始状态
- 使用 `updateRecentMessageState` 进行更新
- 缓存频繁访问的状态数据

---

## 记忆系统

Eliza 框架使用多种类型的记忆来支持代理的长期参与、上下文理解和自适应响应。每种类型的记忆都有特定的用途：

- **消息历史**：存储最近的对话，以在会话中提供连续性。这有助于代理在短期交流中保持对话上下文，避免重复响应。

- **事实记忆**：保存关于用户或环境的特定上下文事实，如用户偏好、最近活动或先前交互中提到的具体细节。这种类型的记忆使代理能够在会话之间回忆用户特定的信息。

- **知识库**：包含代理可能需要的常识，以响应更广泛的查询或提供信息性答案。这种记忆更为静态，帮助代理检索预定义的数据、常见响应或静态角色背景。

- **关系跟踪**：管理代理对其与用户关系的理解，包括用户-代理交互频率、情感和连接历史。它特别有助于建立融洽关系，并随着时间的推移提供更个性化的交互体验。

- **RAG 集成**：使用向量搜索基于相似性匹配执行上下文回忆。这使代理能够根据当前对话的内容和意图检索相关的记忆片段或知识，使其响应更具上下文相关性。

运行时使用多个专门的 [IMemoryManager](/api/interfaces/IMemoryManager) 实例：

- `messageManager` - 对话消息和响应
- `descriptionManager` - 用户描述和配置文件
- `loreManager` - 静态角色知识

---

## 消息处理

运行时的消息处理通过 [processActions](/api/classes/AgentRuntime#processactions) 方法处理：

```typescript
// 使用行为处理消息
await runtime.processActions(message, responses, state, async (newMessages) => {
    // 处理新消息
    return [message];
});
```

---

## 服务和记忆管理

服务通过 [getService](/api/classes/AgentRuntime#getservice) 和 [registerService](/api/classes/AgentRuntime#registerservice) 方法管理：

```typescript
// 注册服务
runtime.registerService(new TranscriptionService());

// 获取服务
const service = runtime.getService<ITranscriptionService>(
    ServiceType.TRANSCRIPTION,
);
```

### 记忆管理

记忆管理器通过 [getMemoryManager](/api/classes/AgentRuntime#getmemorymanager) 访问：

```typescript
// 获取记忆管理器
const memoryManager = runtime.getMemoryManager("messages");

// 创建记忆
await memoryManager.createMemory({
    id: messageId,
    content: { text: "Message content" },
    userId: userId,
    roomId: roomId,
});
```

**最佳实践**

- 为不同数据类型使用适当的记忆管理器
- 存储数据时考虑记忆限制，定期清理记忆
- 使用 `unique` 标志进行去重存储
- 定期清理旧记忆
- 在状态管理中使用不可变性
- 记录错误并在服务故障期间保持稳定性

---

## 评估系统

运行时的 [evaluate](/api/classes/AgentRuntime#evaluate) 方法处理评估：

```typescript
// 评估消息
const evaluationResults = await runtime.evaluate(message, state, didRespond);
```

---

## 使用示例

1. **消息处理**：

```typescript
await runtime.processActions(message, responses, state, (newMessages) => {
    return [message];
});
```

2. **状态管理**：

```typescript
const state = await runtime.composeState(message, {
    additionalContext: "custom-context",
});
```

3. **记忆管理**：

```typescript
const memoryManager = runtime.getMemoryManager("messages");
await memoryManager.createMemory({
    id: messageId,
    content: { text: "Message content" },
    userId,
    roomId,
});
```

---

## 延伸阅读

- [行为文档](./actions.md)
- [评估器文档](./evaluators.md)
- [提供者文档](./providers.md)
- [完整 API 参考](/api)

---