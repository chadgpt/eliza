---
sidebar_position: 14
---

# 🏗️ 基础设施指南

## 概述

Eliza的基础设施建立在灵活的数据库架构上，支持多种适配器和高效的数据存储机制，用于AI代理交互、内存管理和关系跟踪。

## 核心组件

### 数据库适配器

Eliza通过可插拔的适配器系统支持多种数据库后端：

- **PostgreSQL** - 功能齐全的适配器，具备向量搜索功能
- **SQLite** - 轻量级本地数据库选项
- **SQL.js** - 用于测试和开发的内存数据库
- **Supabase** - 具有附加功能的云托管PostgreSQL

### 架构结构

数据库架构包括几个关键表：

```sql
- accounts: 用户和代理身份
- rooms: 对话空间
- memories: 向量索引的消息存储
- goals: 代理目标和进度
- participants: 房间成员跟踪
- relationships: 代理间连接
```

## 设置基础设施

### PostgreSQL 设置

1. **安装 PostgreSQL 扩展**

```sql
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

2. **初始化核心表**

```sql
-- 创建基础表
CREATE TABLE accounts (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT,
    "username" TEXT UNIQUE,
    "email" TEXT NOT NULL UNIQUE,
    "avatarUrl" TEXT,
    "details" JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE rooms (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE memories (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "content" JSONB NOT NULL,
    "embedding" vector(1536),
    "userId" UUID REFERENCES accounts("id"),
    "agentId" UUID REFERENCES accounts("id"),
    "roomId" UUID REFERENCES rooms("id"),
    "isUnique" BOOLEAN DEFAULT true NOT NULL
);

CREATE TABLE participants (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID REFERENCES accounts("id"),
    "roomId" UUID REFERENCES rooms("id"),
    "joinedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

3. **设置索引**

```sql
CREATE INDEX idx_memories_embedding ON memories
    USING hnsw ("embedding" vector_cosine_ops);

CREATE INDEX idx_memories_type_room ON memories("type", "roomId");

CREATE INDEX idx_participants_user ON participants("userId");
CREATE INDEX idx_participants_room ON participants("roomId");

```

### 连接配置

```typescript
// PostgreSQL 配置
const postgresConfig = {
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

// Supabase 配置
const supabaseConfig = {
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_KEY,
};
```

## 内存管理

### 向量存储

内存系统使用向量嵌入进行语义搜索：

```typescript
async function storeMemory(runtime: IAgentRuntime, content: string) {
  const embedding = await runtime.embed(content);

  await runtime.databaseAdapter.createMemory({
    type: "message",
    content: { text: content },
    embedding,
    roomId: roomId,
    userId: userId,
  });
}
```

### 内存检索

```typescript
async function searchMemories(runtime: IAgentRuntime, query: string) {
  const embedding = await runtime.embed(query);

  return runtime.databaseAdapter.searchMemoriesByEmbedding(embedding, {
    match_threshold: 0.8,
    count: 10,
    tableName: "memories",
  });
}
```

## 扩展考虑

### 数据库优化

1. **索引管理**

   - 使用HNSW索引进行向量相似性搜索
   - 为频繁查询模式创建适当的索引
   - 定期分析和更新索引统计信息

2. **连接池管理**

   ```typescript
   const pool = new Pool({
     max: 20, // 最大池大小
     idleTimeoutMillis: 30000,
     connectionTimeoutMillis: 2000,
   });
   ```

3. **查询优化**
   - 使用预处理语句
   - 实现高效分页
   - 优化向量相似性搜索

### 高可用性

1. **数据库复制**

   - 设置只读副本以扩展读取操作
   - 配置流复制以进行故障转移
   - 实现连接重试逻辑

2. **备份策略**

   ```sql
   -- 定期备份
   pg_dump -Fc mydb > backup.dump

   -- 时间点恢复
   pg_basebackup -D backup -Fp -Xs -P
   ```

## 安全

### 访问控制

1. **行级安全**

```sql
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "memories_isolation" ON memories
    USING (auth.uid() = "userId" OR auth.uid() = "agentId");
```

2. **角色管理**

```sql
-- 创建应用角色
CREATE ROLE app_user;

-- 授予必要权限
GRANT SELECT, INSERT ON memories TO app_user;
GRANT USAGE ON SCHEMA public TO app_user;
```

### 数据保护

1. **加密**

   - 使用TLS进行连接
   - 对静态敏感数据进行加密
   - 实现密钥轮换

2. **审计日志**

```sql
CREATE TABLE logs (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "userId" UUID NOT NULL REFERENCES accounts("id"),
    "body" JSONB NOT NULL,
    "type" TEXT NOT NULL,
    "roomId" UUID NOT NULL REFERENCES rooms("id")
);
```

## 监控

### 健康检查

```typescript
async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await db.query("SELECT 1");
    return true;
  } catch (error) {
    console.error("Database health check failed:", error);
    return false;
  }
}
```

### 性能指标

跟踪关键指标：

- 查询性能
- 连接池利用率
- 内存使用情况
- 向量搜索延迟

## 维护

### 定期任务

1. **真空操作**

```sql
-- 定期真空
VACUUM ANALYZE memories;

-- 分析统计信息
ANALYZE memories;
```

2. **索引维护**

```sql
-- 重新索引向量相似性索引
REINDEX INDEX idx_memories_embedding;
```

### 数据生命周期

1. **归档策略**

   - 归档旧对话
   - 压缩非活动内存
   - 实施数据保留策略

2. **清理作业**

```typescript
async function cleanupOldMemories() {
  const cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() - 6);

  await db.query(
    `
        DELETE FROM memories 
        WHERE "createdAt" < $1
    `,
    [cutoffDate],
  );
}
```

## 故障排除

### 常见问题

1. **连接问题**

   - 检查连接池设置
   - 验证网络连接
   - 查看防火墙规则

2. **性能问题**

   - 分析查询计划
   - 检查索引使用情况
   - 监控资源利用率

3. **向量搜索问题**
   - 验证嵌入维度
   - 检查相似性阈值
   - 查看索引配置

### 诊断查询

```sql
-- 检查连接状态
SELECT * FROM pg_stat_activity;

-- 分析查询性能
EXPLAIN ANALYZE
SELECT * FROM memories
WHERE embedding <-> $1 < 0.3
LIMIT 10;

-- 监控索引使用情况
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes;
```

## 延伸阅读

- [PostgreSQL 文档](https://www.postgresql.org/docs/)

---