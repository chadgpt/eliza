---
sidebar_position: 6
---

# ⚡ 操作

操作是 Eliza 的核心构建模块，定义了代理如何响应和与消息互动。它们允许代理与外部系统交互，修改其行为，并执行超出简单消息响应的任务。

---

## 概述

每个操作包括：

- `name`：操作的唯一标识符
- `similes`：替代名称/变体的数组
- `description`：操作目的的详细说明
- `validate`：检查操作是否适当的函数
- `handler`：操作行为的实现
- `examples`：示例使用模式的数组

---

## 实现

```typescript
interface Action {
    name: string;
    similes: string[];
    description: string;
    examples: ActionExample[][];
    handler: Handler;
    validate: Validator;
    suppressInitialMessage?: boolean;
}
```

来源: https://github.com/elizaos/eliza/packages/core/src/types.ts

---

# 内置操作

---

## 对话流程

### CONTINUE

- 在需要更多上下文时保持对话
- 管理自然对话的进展
- 限制为连续3次继续

### IGNORE

- 优雅地脱离对话
- 处理：
    - 不适当的互动
    - 自然对话结束
    - 结束后的回应

### NONE

- 默认响应操作
- 用于标准对话回复

---

## 外部集成

### TAKE_ORDER

- 记录交易/购买订单
- 处理用户的信念水平
- 验证股票代码和合约地址

```typescript
const take_order: Action = {
    name: "TAKE_ORDER",
    similes: ["BUY_ORDER", "PLACE_ORDER"],
    description: "根据用户的信念水平记录购买订单。",
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        const text = (message.content as Content).text;
        const tickerRegex = /\b[A-Z]{1,5}\b/g;
        return tickerRegex.test(text);
    },
    // ... 其余实现
};
```

来源: https://github.com/elizaos/eliza/packages/plugin-solana/src/actions/takeOrder.ts

---

## 创建自定义操作

1. 实现 Action 接口
2. 定义验证逻辑
3. 实现处理功能
4. 提供使用示例

示例：

```typescript
const customAction: Action = {
    name: "CUSTOM_ACTION",
    similes: ["SIMILAR_ACTION"],
    description: "操作目的",
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        // 验证逻辑
        return true;
    },
    handler: async (runtime: IAgentRuntime, message: Memory) => {
        // 实现
    },
    examples: [],
};
```

### 测试操作

使用内置测试框架：

```typescript
test("验证操作行为", async () => {
    const message: Memory = {
        userId: user.id,
        content: { text: "测试消息" },
        roomId,
    };

    const response = await handleMessage(runtime, message);
    // 验证响应
});
```

---

## 核心概念

### 操作结构

```typescript
interface Action {
    name: string;
    similes: string[];
    description: string;
    validate: (runtime: IAgentRuntime, message: Memory) => Promise<boolean>;
    handler: (
        runtime: IAgentRuntime,
        message: Memory,
        state?: State,
    ) => Promise<void>;
    examples: ActionExample[][];
    suppressInitialMessage?: boolean;
}
```

### 关键组件

- **name**：操作的唯一标识符
- **similes**：操作的替代名称/触发器
- **description**：解释何时以及如何使用该操作
- **validate**：确定操作是否可以执行
- **handler**：实现操作的行为
- **examples**：展示正确使用模式
- **suppressInitialMessage**：为 true 时，在处理操作之前抑制初始响应消息。适用于生成自身响应的操作（如图像生成）

---

## 内置操作

### CONTINUE

在适当时继续对话：

```typescript
const continueAction: Action = {
    name: "CONTINUE",
    similes: ["ELABORATE", "KEEP_TALKING"],
    description:
        "用于需要跟进的消息。当对话结束时不要使用。",
    validate: async (runtime, message) => {
        // 验证逻辑
        return true;
    },
    handler: async (runtime, message, state) => {
        // 继续逻辑
    },
};
```

### IGNORE

停止响应无关或已完成的对话：

```typescript
const ignoreAction: Action = {
    name: "IGNORE",
    similes: ["STOP_TALKING", "STOP_CHATTING"],
    description:
        "在适当时忽略用户（对话结束，用户具有攻击性等）",
    handler: async (runtime, message) => {
        return true;
    },
};
```

### FOLLOW_ROOM

积极参与对话：

```typescript
const followRoomAction: Action = {
    name: "FOLLOW_ROOM",
    similes: ["FOLLOW_CHAT", "FOLLOW_CONVERSATION"],
    description:
        "开始关注频道，响应不明确提及的消息。",
    handler: async (runtime, message) => {
        // 关注房间逻辑
    },
};
```

---

## 创建自定义操作

### 基本操作模板

```typescript
const customAction: Action = {
    name: "CUSTOM_ACTION",
    similes: ["ALTERNATE_NAME", "OTHER_TRIGGER"],
    description: "详细描述何时以及如何使用此操作",
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        // 验证逻辑
        return true;
    },
    handler: async (runtime: IAgentRuntime, message: Memory) => {
        // 实现逻辑
        return true;
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: { text: "触发消息" },
            },
            {
                user: "{{user2}}",
                content: { text: "响应", action: "CUSTOM_ACTION" },
            },
        ],
    ],
};
```

### 高级操作示例

```typescript
const complexAction: Action = {
    name: "PROCESS_DOCUMENT",
    similes: ["READ_DOCUMENT", "ANALYZE_DOCUMENT"],
    description: "处理和分析上传的文档",
    validate: async (runtime, message) => {
        const hasAttachment = message.content.attachments?.length > 0;
        const supportedTypes = ["pdf", "txt", "doc"];
        return (
            hasAttachment &&
            supportedTypes.includes(message.content.attachments[0].type)
        );
    },
    handler: async (runtime, message, state) => {
        const attachment = message.content.attachments[0];

        // 处理文档
        const content = await runtime
            .getService<IDocumentService>(ServiceType.DOCUMENT)
            .processDocument(attachment);

        // 存储在内存中
        await runtime.documentsManager.createMemory({
            id: generateId(),
            content: { text: content },
            userId: message.userId,
            roomId: message.roomId,
        });

        return true;
    },
};
```

---

## 实现模式

### 基于状态的操作

```typescript
const stateAction: Action = {
    name: "UPDATE_STATE",
    handler: async (runtime, message, state) => {
        const newState = await runtime.composeState(message, {
            additionalData: "new-data",
        });

        await runtime.updateState(newState);
        return true;
    },
};
```

### 服务集成

```typescript
const serviceAction: Action = {
    name: "TRANSCRIBE_AUDIO",
    handler: async (runtime, message) => {
        const transcriptionService = runtime.getService<ITranscriptionService>(
            ServiceType.TRANSCRIPTION,
        );

        const result = await transcriptionService.transcribe(
            message.content.attachments[0],
        );

        return true;
    },
};
```

---

## 最佳实践

### 操作设计

1. **明确目的**

    - 单一责任原则
    - 明确的触发条件
    - 清晰的成功标准

2. **健壮的验证**

    - 检查前提条件
    - 验证输入数据
    - 处理边缘情况

3. **错误处理**
    - 优雅地失败
    - 提供有意义的错误消息
    - 状态恢复

### 示例组织

1. **全面覆盖**

```typescript
examples: [
    // 正常路径
    [basicUsageExample],
    // 边缘情况
    [edgeCaseExample],
    // 错误情况
    [errorCaseExample],
];
```

2. **清晰的上下文**

```typescript
examples: [
    [
        {
            user: "{{user1}}",
            content: {
                text: "显示操作需要的上下文消息",
            },
        },
        {
            user: "{{user2}}",
            content: {
                text: "清晰的响应，展示操作使用",
                action: "ACTION_NAME",
            },
        },
    ],
];
```

---

## 故障排除

### 常见问题

1. **操作未触发**

    - 检查验证逻辑
    - 验证 similes 列表
    - 审查示例模式

2. **处理程序失败**

    - 验证服务可用性
    - 检查状态要求
    - 审查错误日志

3. **状态不一致**
    - 验证状态更新
    - 检查并发修改
    - 审查状态转换

## 高级功能

### 操作组合

```typescript
const compositeAction: Action = {
    name: "PROCESS_AND_RESPOND",
    handler: async (runtime, message) => {
        // 处理第一个操作
        await runtime.processAction("ANALYZE_CONTENT", message);

        // 处理第二个操作
        await runtime.processAction("GENERATE_RESPONSE", message);

        return true;
    },
};
```

### 操作链

```typescript
const chainedAction: Action = {
    name: "WORKFLOW",
    handler: async (runtime, message) => {
        const actions = ["VALIDATE", "PROCESS", "RESPOND"];

        for (const actionName of actions) {
            await runtime.processAction(actionName, message);
        }

        return true;
    },
};
```

---

## 示例：完整的操作实现

```typescript
import { Action, IAgentRuntime, Memory, State } from "@elizaos/core";

const documentAnalysisAction: Action = {
    name: "ANALYZE_DOCUMENT",
    similes: ["READ_DOCUMENT", "PROCESS_DOCUMENT", "REVIEW_DOCUMENT"],
    description: "分析上传的文档并提供见解",

    validate: async (runtime: IAgentRuntime, message: Memory) => {
        // 检查文档附件
        if (!message.content.attachments?.length) {
            return false;
        }

        // 验证文档类型
        const attachment = message.content.attachments[0];
        return ["pdf", "txt", "doc"].includes(attachment.type);
    },

    handler: async (runtime: IAgentRuntime, message: Memory, state?: State) => {
        try {
            // 获取文档服务
            const docService = runtime.getService<IDocumentService>(
                ServiceType.DOCUMENT,
            );

            // 处理文档
            const content = await docService.processDocument(
                message.content.attachments[0],
            );

            // 存储分析结果
            await runtime.documentsManager.createMemory({
                id: generateId(),
                content: {
                    text: content,
                    analysis: await docService.analyze(content),
                },
                userId: message.userId,
                roomId: message.roomId,
                createdAt: Date.now(),
            });

            return true;
        } catch (error) {
            console.error("文档分析失败:", error);
            return false;
        }
    },

    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "你能分析这个文档吗？",
                    attachments: [{ type: "pdf", url: "document.pdf" }],
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "我会为你分析这个文档",
                    action: "ANALYZE_DOCUMENT",
                },
            },
        ],
    ],
};
```

---

# 最佳实践

1. **验证**

    - 彻底检查输入参数
    - 验证运行时条件
    - 处理边缘情况

2. **错误处理**

    - 实现全面的错误捕捉
    - 提供清晰的错误消息
    - 正确清理资源

3. **文档**
    - 包含清晰的使用示例
    - 记录预期的输入/输出
    - 解释错误场景

---

## 延伸阅读

- [提供者系统](./providers.md)
- [服务集成](#)
- [内存管理](../../packages/core)

---