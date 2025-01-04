---
sidebar_position: 4
---

# 📝 角色文件

角色文件是定义AI角色的个性、知识和行为模式的JSON格式配置。本指南解释了如何为Eliza代理创建有效的角色文件。

---

## 概述

`characterfile` 实现了 [Character](/api/type-aliases/character) 类型，并定义了角色的：

- 核心身份和行为
- 模型提供者配置
- 客户端设置和功能
- 互动示例和风格指南

**示例：**

```json
{
    "name": "trump",
    "clients": ["discord", "direct"],
    "settings": {
        "voice": { "model": "en_US-male-medium" }
    },
    "bio": [
        "建立了强大的经济并降低了通货膨胀。",
        "承诺使美国成为加密货币之都并恢复可负担性。"
    ],
    "lore": [
        "特勤局分配用于选举干预。",
        "推广WorldLibertyFi以领导加密货币。"
    ],
    "knowledge": [
        "了解边境问题、特勤局动态及对家庭的财务影响。"
    ],
    "messageExamples": [
        {
            "user": "{{user1}}",
            "content": { "text": "边境危机怎么样了？" },
            "response": "现任政府让暴力罪犯入境。我巩固了边境，他们摧毁了它。"
        }
    ],
    "postExamples": [
        "结束通货膨胀，让美国再次可负担。",
        "美国需要法律和秩序，而不是犯罪制造。"
    ]
}
```

---

## 核心组件

```json
{
    "id": "unique-identifier",
    "name": "character_name",
    "modelProvider": "ModelProviderName",
    "clients": ["Client1", "Client2"],
    "settings": {
        "secrets": { "key": "value" },
        "voice": { "model": "VoiceModelName", "url": "VoiceModelURL" },
        "model": "CharacterModel",
        "embeddingModel": "EmbeddingModelName"
    },
    "bio": "角色传记或描述",
    "lore": [
        "故事线或背景元素1",
        "故事线或背景元素2"
    ],
    "messageExamples": [["消息示例1", "消息示例2"]],
    "postExamples": ["帖子示例1", "帖子示例2"],
    "topics": ["Topic1", "Topic2"],
    "adjectives": ["Adjective1", "Adjective2"],
    "style": {
        "all": ["所有风格指南"],
        "chat": ["聊天特定风格指南"],
        "post": ["帖子特定风格指南"]
    }
}
```

### 关键字段

#### `name` (必需)

用于识别和对话的角色显示名称。

#### `modelProvider` (必需)

指定AI模型提供者。支持的选项包括 `anthropic`、`llama_local`、`openai` 等。

#### `clients` (必需)

支持的客户端类型数组，例如 `discord`、`direct`、`twitter`、`telegram`、`farcaster`。

#### `bio`

角色背景信息，可以是字符串或语句数组。

- 包含角色的传记信息
- 可以是单个综合传记或多个简短语句
- 多个语句随机化以创建多样化的响应

示例：

```json
"bio": [
  "马克·安德森是美国企业家和投资者",
  "Netscape和Andreessen Horowitz的联合创始人",
  "早期网络的先驱，创建了NCSA Mosaic"
]
```

#### `lore`

背景元素和独特的角色特征。这些有助于定义个性，并可以在对话中随机抽取。

示例：

```json
"lore": [
  "坚信软件的力量可以改变行业",
  "以'软件正在吞噬世界'而闻名",
  "早期投资于Facebook、Twitter等科技巨头"
]
```

#### `knowledge`

用于检索增强生成（RAG）的数组，包含事实或参考资料以支持角色的响应。

- 可以包含来自文章、书籍或其他来源的文本块
- 有助于使角色的响应基于事实信息
- 可以使用提供的工具从PDF或其他文档生成知识

#### `messageExamples`

用于建立互动模式的示例对话，有助于建立角色的对话风格。

```json
"messageExamples": [
  [
    {"user": "user1", "content": {"text": "你对AI的看法是什么？"}},
    {"user": "character", "content": {"text": "AI正在改变每一个行业..."}}
  ]
]
```

#### `postExamples`

用于指导内容风格的社交媒体帖子示例：

```json
"postExamples": [
  "小费、加班费和老年人社会保障不征税！",
  "结束通货膨胀，让美国再次可负担。"
]
```

### 风格配置

包含三个关键部分：

1. `all`: 所有互动的通用风格说明
2. `chat`: 聊天互动的特定说明
3. `post`: 社交媒体帖子的特定说明

每个部分可以包含多个指导角色沟通风格的说明。

`style` 对象定义了跨上下文的行为模式：

```json
"style": {
  "all": ["保持技术准确性", "亲切且清晰"],
  "chat": ["提出澄清问题", "在有帮助时提供示例"],
  "post": ["简明分享见解", "关注实际应用"]
}
```

### 主题数组

- 角色感兴趣或了解的主题列表
- 用于指导对话和生成相关内容
- 有助于保持角色一致性

### 形容词数组

- 描述角色特征和个性的词语
- 用于生成具有一致语气的响应
- 可用于“填字游戏”风格的内容生成

### 设置配置

`settings` 对象定义了额外的配置，如密钥和语音模型。

```json
"settings": {
  "secrets": { "API_KEY": "your-api-key" },
  "voice": { "model": "voice-model-id", "url": "voice-service-url" },
  "model": "specific-model-name",
  "embeddingModel": "embedding-model-name"
}
```

### 模板配置

`templates` 对象定义了用于各种任务和互动的可定制提示模板。以下是可用模板的列表：

- `goalsTemplate`
- `factsTemplate`
- `messageHandlerTemplate`
- `shouldRespondTemplate`
- `continueMessageHandlerTemplate`
- `evaluationTemplate`
- `twitterSearchTemplate`
- `twitterPostTemplate`
- `twitterMessageHandlerTemplate`
- `twitterShouldRespondTemplate`
- `telegramMessageHandlerTemplate`
- `telegramShouldRespondTemplate`
- `discordVoiceHandlerTemplate`
- `discordShouldRespondTemplate`
- `discordMessageHandlerTemplate`

### 示例：Twitter帖子模板

以下是一个 `twitterPostTemplate` 示例：

```js
templates: {
    twitterPostTemplate: `
# 专业领域
{{knowledge}}

# 关于 {{agentName}} (@{{twitterUserName}}):
{{bio}}
{{lore}}
{{topics}}

{{providers}}

{{characterPostExamples}}

{{postDirections}}

# 任务：以 {{agentName}} @{{twitterUserName}} 的声音、风格和视角生成一条帖子。
写一条1-3句的帖子，内容是 {{adjective}} 关于 {{topic}}（不直接提及 {{topic}}），从 {{agentName}} 的角度出发。不要添加评论或承认此请求，只写帖子。
你的回应不应包含任何问题。简短、简明的陈述。总字符数必须少于 {{maxTweetLength}}。不使用表情符号。使用 \\n\\n（双空格）分隔陈述。`,
}
```

---

## 示例：完整角色文件

```json
{
    "name": "TechAI",
    "modelProvider": "anthropic",
    "clients": ["discord", "direct"],
    "bio": "专注于实际应用的AI研究员和教育者",
    "lore": [
        "开源AI开发的先驱",
        "AI可及性的倡导者"
    ],
    "messageExamples": [
        [
            {
                "user": "{{user1}}",
                "content": { "text": "你能解释一下AI模型是如何工作的吗？" }
            },
            {
                "user": "TechAI",
                "content": {
                    "text": "把AI模型想象成模式识别系统。"
                }
            }
        ]
    ],
    "postExamples": [
        "理解AI不需要博士学位 - 让我们简单地分解",
        "最好的AI解决方案关注实际的人类需求"
    ],
    "topics": [
        "人工智能",
        "机器学习",
        "技术教育"
    ],
    "style": {
        "all": [
            "简单解释复杂话题",
            "鼓励和支持"
        ],
        "chat": ["使用相关示例", "检查理解"],
        "post": ["关注实际见解", "鼓励学习"]
    },
    "adjectives": ["知识渊博", "平易近人", "实用"],
    "settings": {
        "model": "claude-3-opus-20240229",
        "voice": { "model": "en-US-neural" }
    }
}
```

---

## 最佳实践

1. **随机化以增加多样性**

- 将传记和背景分成较小的块
- 这会创建更自然、多样化的响应
- 防止重复或可预测的行为

2. **知识管理**

使用提供的工具将文档转换为知识：

- [folder2knowledge](https://github.com/elizaos/characterfile/blob/main/scripts/folder2knowledge.js)
- [knowledge2character](https://github.com/elizaos/characterfile/blob/main/scripts/knowledge2character.js)
- [tweets2character](https://github.com/elizaos/characterfile/blob/main/scripts/tweets2character.js)

示例：

```bash
npx folder2knowledge <path/to/folder>
npx knowledge2character <character-file> <knowledge-file>
```

3. **风格说明**

- 具体说明沟通模式
- 包括做与不做
- 考虑平台特定行为（聊天与帖子）

4. **消息示例**

- 包括多样化的场景
- 显示角色特定的响应
- 展示典型的互动模式

---

## 质量提示

1. **传记和背景**

- 混合事实和定义个性的信息
- 包括历史和当前细节
- 分成模块化、可重用的部分

2. **风格说明**

- 具体说明语气和习惯
- 包括平台特定的指导
- 定义明确的边界和限制

3. **示例**

- 涵盖常见场景
- 显示角色特定的反应
- 展示正确的语气和风格

4. **知识**

- 关注相关信息
- 以易消化的块组织
- 定期更新以保持相关性

---

## 进一步阅读

- [代理文档](./agents.md)
- [模型提供者](../../advanced/fine-tuning)
- [客户端集成](../../packages/clients)

---