# 🤖 代理包

## 概述

代理包 (`@eliza/agent`) 提供了 Eliza 的高级编排层，管理代理生命周期、角色加载、客户端初始化和运行时协调。

## 安装

```bash
pnpm add @eliza/agent
```

## 快速开始

```typescript
import { startAgents, loadCharacters } from "@eliza/agent";

// 使用默认或自定义角色启动代理
const args = parseArguments();
const characters = await loadCharacters(args.characters);

// 初始化代理
await startAgents();
```

## 核心组件

### 代理创建

```typescript
export async function createAgent(
  character: Character,
  db: IDatabaseAdapter,
  token: string,
): Promise<AgentRuntime> {
  return new AgentRuntime({
    databaseAdapter: db,
    token,
    modelProvider: character.modelProvider,
    character,
    plugins: [
      bootstrapPlugin,
      nodePlugin,
      // 条件插件
      character.settings.secrets.WALLET_PUBLIC_KEY ? solanaPlugin : null,
    ].filter(Boolean),
    providers: [],
    actions: [],
    services: [],
    managers: [],
  });
}
```

### 角色加载

```typescript
export async function loadCharacters(
  charactersArg: string,
): Promise<Character[]> {
  // 解析角色路径
  let characterPaths = charactersArg
    ?.split(",")
    .map((path) => path.trim())
    .map((path) => normalizePath(path));

  const loadedCharacters = [];

  // 加载每个角色文件
  for (const path of characterPaths) {
    try {
      const character = JSON.parse(fs.readFileSync(path, "utf8"));

      // 如果指定了插件，则加载插件
      if (character.plugins) {
        character.plugins = await loadPlugins(character.plugins);
      }

      loadedCharacters.push(character);
    } catch (error) {
      console.error(`从 ${path} 加载角色时出错: ${error}`);
    }
  }

  // 如果没有加载任何角色，则回退到默认角色
  if (loadedCharacters.length === 0) {
    loadedCharacters.push(defaultCharacter);
  }

  return loadedCharacters;
}
```

### 客户端初始化

```typescript
export async function initializeClients(
  character: Character,
  runtime: IAgentRuntime,
) {
  const clients = [];
  const clientTypes = character.clients?.map((str) => str.toLowerCase()) || [];

  if (clientTypes.includes(Clients.DISCORD)) {
    clients.push(await DiscordClientInterface.start(runtime));
  }
  if (clientTypes.includes(Clients.TELEGRAM)) {
    clients.push(await TelegramClientInterface.start(runtime));
  }
  if (clientTypes.includes(Clients.TWITTER)) {
    clients.push(await TwitterClientInterface.start(runtime));
  }
  if (clientTypes.includes(Clients.DIRECT)) {
    clients.push(await AutoClientInterface.start(runtime));
  }

  return clients;
}
```

## 数据库管理

```typescript
function initializeDatabase(): IDatabaseAdapter {
  // 如果提供了 URL，则使用 PostgreSQL
  if (process.env.POSTGRES_URL) {
    return new PostgresDatabaseAdapter({
      connectionString: process.env.POSTGRES_URL,
    });
  }

  // 回退到 SQLite
  return new SqliteDatabaseAdapter(new Database("./db.sqlite"));
}
```

## 令牌管理

```typescript
export function getTokenForProvider(
  provider: ModelProviderName,
  character: Character,
) {
  switch (provider) {
    case ModelProviderName.OPENAI:
      return (
        character.settings?.secrets?.OPENAI_API_KEY || settings.OPENAI_API_KEY
      );

    case ModelProviderName.ANTHROPIC:
      return (
        character.settings?.secrets?.ANTHROPIC_API_KEY ||
        character.settings?.secrets?.CLAUDE_API_KEY ||
        settings.ANTHROPIC_API_KEY
      );

    // 处理其他提供者...
  }
}
```

## 代理生命周期管理

### 启动代理

```typescript
async function startAgent(character: Character, directClient: any) {
  try {
    // 获取提供者令牌
    const token = getTokenForProvider(character.modelProvider, character);

    // 初始化数据库
    const db = initializeDatabase();

    // 创建运行时
    const runtime = await createAgent(character, db, token);

    // 初始化客户端
    const clients = await initializeClients(character, runtime);

    // 向直接客户端注册代理
    directClient.registerAgent(runtime);

    return clients;
  } catch (error) {
    console.error(
      `启动角色 ${character.name} 的代理时出错:`,
      error,
    );
    throw error;
  }
}
```

### Shell 接口

```typescript
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function handleUserInput(input, agentId) {
  if (input.toLowerCase() === "exit") {
    rl.close();
    return;
  }

  try {
    const response = await fetch(
      `http://localhost:${serverPort}/${agentId}/message`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: input,
          userId: "user",
          userName: "User",
        }),
      },
    );

    const data = await response.json();
    data.forEach((message) => console.log(`代理: ${message.text}`));
  } catch (error) {
    console.error("错误:", error);
  }
}
```

## 高级功能

### 插件管理

```typescript
async function loadPlugins(pluginPaths: string[]) {
  return await Promise.all(
    pluginPaths.map(async (plugin) => {
      const importedPlugin = await import(plugin);
      return importedPlugin;
    }),
  );
}
```

### 角色热重载

```typescript
async function reloadCharacter(runtime: IAgentRuntime, characterPath: string) {
  // 加载新角色
  const character = JSON.parse(fs.readFileSync(characterPath, "utf8"));

  // 更新运行时
  runtime.character = character;

  // 重新加载插件
  if (character.plugins) {
    const plugins = await loadPlugins(character.plugins);
    runtime.registerPlugins(plugins);
  }
}
```

### 多代理协调

```typescript
class AgentCoordinator {
  private agents: Map<string, IAgentRuntime>;

  async broadcast(message: Memory) {
    const responses = await Promise.all(
      Array.from(this.agents.values()).map((agent) =>
        agent.processMessage(message),
      ),
    );
    return responses;
  }

  async coordinate(agents: string[], task: Task) {
    // 协调多个代理执行任务
    const selectedAgents = agents.map((id) => this.agents.get(id));

    return await this.executeCoordinatedTask(selectedAgents, task);
  }
}
```

## 最佳实践

### 角色管理

```typescript
// 在加载前验证角色
function validateCharacter(character: Character) {
  if (!character.name) {
    throw new Error("角色必须有一个名称");
  }

  if (!character.modelProvider) {
    throw new Error("必须指定模型提供者");
  }
}

// 使用角色版本控制
const character = {
  name: "Agent",
  version: "1.0.0",
  // ...
};
```

### 错误处理

```typescript
async function handleAgentError(error: Error, character: Character) {
  // 记录带有上下文的错误
  console.error(`代理 ${character.name} 错误:`, error);

  // 尝试恢复
  if (error.code === "TOKEN_EXPIRED") {
    await refreshToken(character);
  }

  // 通知监控
  await notify({
    level: "error",
    character: character.name,
    error,
  });
}
```

### 资源管理

```typescript
class ResourceManager {
  async cleanup() {
    // 关闭数据库连接
    await this.db.close();

    // 关闭客户端
    await Promise.all(this.clients.map((client) => client.stop()));

    // 清除缓存
    this.cache.clear();
  }

  async monitor() {
    // 监控资源使用情况
    const usage = process.memoryUsage();
    if (usage.heapUsed > threshold) {
      await this.cleanup();
    }
  }
}
```

## 故障排除

### 常见问题

1. **角色加载失败**

```typescript
try {
  await loadCharacters(charactersArg);
} catch (error) {
  if (error.code === "ENOENT") {
    console.error("角色文件未找到");
  } else if (error instanceof SyntaxError) {
    console.error("无效的角色 JSON");
  }
}
```

2. **客户端初始化错误**

```typescript
async function handleClientError(error: Error) {
  if (error.message.includes("rate limit")) {
    await wait(exponentialBackoff());
  } else if (error.message.includes("auth")) {
    await refreshAuth();
  }
}
```

3. **数据库连接问题**

```typescript
async function handleDbError(error: Error) {
  if (error.message.includes("connection")) {
    await reconnectDb();
  } else if (error.message.includes("locked")) {
    await waitForLock();
  }
}
```

## 相关资源

- [角色创建指南](#)
- [客户端配置](#)
- [插件开发](#)
- [多代理设置](../packages/agents)