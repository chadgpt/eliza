# 🔧 数据库适配器

## 概述

数据库适配器为Eliza提供持久层，支持存储和检索记忆、关系、目标及其他核心数据。系统通过统一接口支持多种数据库后端。

## 可用适配器

Eliza包含以下数据库适配器：

- **PostgreSQL适配器** (`@eliza/adapter-postgres`) - 适用于生产环境的PostgreSQL数据库适配器
- **SQLite适配器** (`@eliza/adapter-sqlite`) - 轻量级的SQLite适配器，适合开发使用
- **SQL.js适配器** (`@eliza/adapter-sqljs`) - 用于测试的内存SQLite适配器
- **Supabase适配器** (`@eliza/adapter-supabase`) - 云原生的Supabase适配器

## 安装

```bash
# PostgreSQL
pnpm add @eliza/adapter-postgres

# SQLite
pnpm add @eliza/adapter-sqlite

# SQL.js
pnpm add @eliza/adapter-sqljs

# Supabase
pnpm add @eliza/adapter-supabase
```

## 快速开始

### SQLite（开发环境）

```typescript
import { SqliteDatabaseAdapter } from "@eliza/adapter-sqlite";
import Database from "better-sqlite3";

const db = new SqliteDatabaseAdapter(new Database("./dev.db"));
```

### PostgreSQL（生产环境）

```typescript
import { PostgresDatabaseAdapter } from "@eliza/adapter-postgres";

const db = new PostgresDatabaseAdapter({
  connectionString: process.env.DATABASE_URL,
  // 可选的连接池设置
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

### Supabase（云端）

```typescript
import { SupabaseDatabaseAdapter } from "@eliza/adapter-supabase";

const db = new SupabaseDatabaseAdapter(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_API_KEY,
);
```

## 核心概念

### 记忆存储

记忆是Eliza中存储的基本单位。它们表示消息、文档及其他内容，并可选地包含用于语义搜索的嵌入。

```typescript
interface Memory {
  id: UUID;
  content: {
    text: string;
    attachments?: Attachment[];
  };
  embedding?: number[];
  userId: UUID;
  roomId: UUID;
  agentId: UUID;
  createdAt: number;
}
```

### 关系

关系用于跟踪用户和代理之间的连接：

```typescript
interface Relationship {
  userA: UUID;
  userB: UUID;
  status: "FRIENDS" | "BLOCKED";
}
```

### 目标

目标用于跟踪目标及其进展：

```typescript
interface Goal {
  id: UUID;
  roomId: UUID;
  userId: UUID;
  name: string;
  status: GoalStatus;
  objectives: Objective[];
}
```

## 常见操作

### 记忆管理

```typescript
// 创建记忆
await db.createMemory(
  {
    id: uuid(),
    content: { text: "Hello world" },
    userId: user.id,
    roomId: room.id,
    agentId: agent.id,
    createdAt: Date.now(),
  },
  "messages",
);

// 通过嵌入搜索记忆
const similar = await db.searchMemoriesByEmbedding(embedding, {
  match_threshold: 0.8,
  count: 10,
  roomId: room.id,
});

// 获取最近的记忆
const recent = await db.getMemories({
  roomId: room.id,
  count: 10,
  unique: true,
});
```

### 关系管理

```typescript
// 创建关系
await db.createRelationship({
  userA: user1.id,
  userB: user2.id,
});

// 获取用户的关系
const relationships = await db.getRelationships({
  userId: user.id,
});
```

### 目标管理

```typescript
// 创建目标
await db.createGoal({
  id: uuid(),
  roomId: room.id,
  userId: user.id,
  name: "Complete task",
  status: "IN_PROGRESS",
  objectives: [],
});

// 获取活跃目标
const goals = await db.getGoals({
  roomId: room.id,
  onlyInProgress: true,
});
```

## 向量搜索

所有适配器都支持用于记忆检索的向量相似性搜索：

```typescript
// 通过嵌入向量搜索
const memories = await db.searchMemories({
  tableName: "memories",
  roomId: room.id,
  embedding: [0.1, 0.2, ...], // 1536维向量
  match_threshold: 0.8,
  match_count: 10,
  unique: true
});

// 获取缓存的嵌入
const cached = await db.getCachedEmbeddings({
  query_table_name: "memories",
  query_threshold: 0.8,
  query_input: "search text",
  query_field_name: "content",
  query_field_sub_name: "text",
  query_match_count: 10
});
```

## 性能优化

### 连接池（PostgreSQL）

```typescript
const db = new PostgresDatabaseAdapter({
  connectionString: process.env.DATABASE_URL,
  max: 20, // 最大池大小
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

### 内存使用（SQLite）

```typescript
const db = new SqliteDatabaseAdapter(
  new Database("./dev.db", {
    memory: true, // 内存数据库
    readonly: false,
    fileMustExist: false,
  }),
);
```

### 缓存（所有适配器）

```typescript
// 启用内存缓存
const memory = new MemoryManager({
  runtime,
  tableName: "messages",
  cacheSize: 1000,
  cacheTTL: 3600,
});
```

## 模式管理

### PostgreSQL迁移

```sql
-- migrations/20240318103238_remote_schema.sql
CREATE TABLE memories (
  id UUID PRIMARY KEY,
  type TEXT NOT NULL,
  content JSONB NOT NULL,
  embedding vector(1536),
  "userId" UUID NOT NULL,
  "roomId" UUID NOT NULL,
  "agentId" UUID NOT NULL,
  "unique" BOOLEAN DEFAULT FALSE,
  "createdAt" TIMESTAMP NOT NULL
);
```

### SQLite模式

```typescript
const sqliteTables = `
CREATE TABLE IF NOT EXISTS memories (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  embedding BLOB,
  userId TEXT NOT NULL,
  roomId TEXT NOT NULL,
  agentId TEXT NOT NULL,
  "unique" INTEGER DEFAULT 0,
  createdAt INTEGER NOT NULL
);
`;
```

## 错误处理

```typescript
try {
  await db.createMemory(memory);
} catch (error) {
  if (error.code === "SQLITE_CONSTRAINT") {
    // 处理唯一约束违规
  } else if (error.code === "23505") {
    // 处理Postgres唯一违规
  } else {
    // 处理其他错误
  }
}
```

## 扩展适配器

要创建自定义适配器，实现`DatabaseAdapter`接口：

```typescript
class CustomDatabaseAdapter extends DatabaseAdapter {
  async createMemory(memory: Memory, tableName: string): Promise<void> {
    // 自定义实现
  }

  async getMemories(params: {
    roomId: UUID;
    count?: number;
    unique?: boolean;
  }): Promise<Memory[]> {
    // 自定义实现
  }

  // 实现其他必需的方法...
}
```

## 最佳实践

1. **连接管理**

   - 对PostgreSQL使用连接池
   - 使用SQLite时正确关闭连接
   - 优雅地处理连接错误

2. **向量搜索**

   - 根据用例设置适当的匹配阈值
   - 为嵌入列创建索引以提高性能
   - 缓存频繁访问的嵌入

3. **内存管理**

   - 实施旧记忆的清理策略
   - 使用唯一标志防止重复
   - 考虑对大表进行分区

4. **错误处理**
   - 对于瞬态故障实施重试
   - 记录带有上下文的数据库错误
   - 对于原子操作使用事务

## 故障排除

### 常见问题

1. **连接超时**

```typescript
// 增加连接超时
const db = new PostgresDatabaseAdapter({
  connectionTimeoutMillis: 5000,
});
```

2. **内存泄漏**

```typescript
// 定期清理旧记忆
await db.removeAllMemories(roomId, tableName);
```

3. **向量搜索性能**

```typescript
// 创建适当的索引
CREATE INDEX embedding_idx ON memories
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

## 相关资源

- [记忆管理器文档](../packages/core)
- [向量搜索指南](../packages/database-adapters)
- [数据库模式参考](/api)