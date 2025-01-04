---
sidebar_position: 11
---

# 🔐 Secrets Management

一份详尽的指南，帮助您在Eliza中管理秘密、API密钥和敏感配置。

## 核心概念

### 环境变量

Eliza使用分层的环境变量系统：

1. 角色特定的命名空间环境变量（最高优先级）
2. 角色特定的秘密
3. 环境变量
4. 默认值（最低优先级）

### 秘密类型

您需要管理的常见秘密：

```bash
# API 密钥
OPENAI_API_KEY=sk-*
ANTHROPIC_API_KEY=your-key
ELEVENLABS_XI_API_KEY=your-key
GOOGLE_GENERATIVE_AI_API_KEY=your-key

# 客户端认证
DISCORD_API_TOKEN=your-token
TELEGRAM_BOT_TOKEN=your-token

# 数据库凭证
SUPABASE_URL=your-url
SUPABASE_SERVICE_API_KEY=your-key

# EVM
EVM_PRIVATE_KEY=EXAMPLE_WALLET_PRIVATE_KEY

# Solana
SOLANA_PRIVATE_KEY=EXAMPLE_WALLET_PRIVATE_KEY
SOLANA_PUBLIC_KEY=EXAMPLE_WALLET_PUBLIC_KEY

# 备用钱包配置（已弃用）
WALLET_PRIVATE_KEY=EXAMPLE_WALLET_PRIVATE_KEY
WALLET_PUBLIC_KEY=EXAMPLE_WALLET_PUBLIC_KEY
```

## 实施指南

### 基本设置

1. 从模板创建一个 `.env` 文件：

```bash
cp .env.example .env
```

2. 配置环境发现：

```typescript
import { config } from "dotenv";
import path from "path";

export function findNearestEnvFile(startDir = process.cwd()) {
  let currentDir = startDir;

  while (currentDir !== path.parse(currentDir).root) {
    const envPath = path.join(currentDir, ".env");

    if (fs.existsSync(envPath)) {
      return envPath;
    }

    currentDir = path.dirname(currentDir);
  }

  return null;
}
```

### 角色特定的秘密

在角色文件中定义秘密：

```json
{
  "name": "TradingBot",
  "settings": {
    "secrets": {
      "OPENAI_API_KEY": "character-specific-key",
      "WALLET_PRIVATE_KEY": "character-specific-wallet"
    }
  }
}
```

或者，您可以在 `.env` 文件中使用 `CHARACTER.YOUR_CHARACTER_NAME.SECRET_NAME` 格式。

在代码中访问秘密：

```typescript
const apiKey = runtime.getSetting("OPENAI_API_KEY");
```

### 安全存储

#### 数据库秘密

使用加密连接字符串：

```typescript
class SecureDatabase {
  private connection: Connection;

  constructor(encryptedConfig: string) {
    const config = this.decryptConfig(encryptedConfig);
    this.connection = new Connection(config);
  }

  private decryptConfig(encrypted: string): DatabaseConfig {
    // 实现解密逻辑
    return JSON.parse(decrypted);
  }
}
```

#### 钱包管理

安全处理区块链凭证：

```typescript
class WalletManager {
  private async initializeWallet(runtime: IAgentRuntime) {
    const privateKey =
      runtime.getSetting("SOLANA_PRIVATE_KEY") ??
      runtime.getSetting("WALLET_PRIVATE_KEY");

    if (!privateKey) {
      throw new Error("Wallet private key not configured");
    }

    // 验证密钥格式
    try {
      const keyBuffer = Buffer.from(privateKey, "base64");
      if (keyBuffer.length !== 64) {
        throw new Error("Invalid key length");
      }
    } catch (error) {
      throw new Error("Invalid private key format");
    }

    // 安全初始化钱包
    return new Wallet(privateKey);
  }
}
```

### 秘密轮换

实现自动秘密轮换：

```typescript
class SecretRotation {
  private static readonly SECRET_LIFETIME = 90 * 24 * 60 * 60 * 1000; // 90天

  async shouldRotateSecret(secretName: string): Promise<boolean> {
    const lastRotation = await this.getLastRotation(secretName);
    return Date.now() - lastRotation > SecretRotation.SECRET_LIFETIME;
  }

  async rotateSecret(secretName: string): Promise<void> {
    // 实现轮换逻辑
    const newSecret = await this.generateNewSecret();
    await this.updateSecret(secretName, newSecret);
    await this.recordRotation(secretName);
  }
}
```

### 访问控制

实现适当的访问控制：

```typescript
class SecretAccess {
  private static readonly ALLOWED_KEYS = [
    "OPENAI_API_KEY",
    "DISCORD_TOKEN",
    // ... 其他允许的密钥
  ];

  static validateAccess(key: string): boolean {
    return this.ALLOWED_KEYS.includes(key);
  }

  static async getSecret(
    runtime: IAgentRuntime,
    key: string,
  ): Promise<string | null> {
    if (!this.validateAccess(key)) {
      throw new Error(`Unauthorized access to secret: ${key}`);
    }

    return runtime.getSetting(key);
  }
}
```

### 静态加密

实现存储秘密的加密：

```typescript
import { createCipheriv, createDecipheriv } from "crypto";

class SecretEncryption {
  static async encrypt(value: string, key: Buffer): Promise<string> {
    const iv = crypto.randomBytes(16);
    const cipher = createCipheriv("aes-256-gcm", key, iv);

    let encrypted = cipher.update(value, "utf8", "hex");
    encrypted += cipher.final("hex");

    return JSON.stringify({
      iv: iv.toString("hex"),
      encrypted,
      tag: cipher.getAuthTag().toString("hex"),
    });
  }

  static async decrypt(encrypted: string, key: Buffer): Promise<string> {
    const { iv, encrypted: encryptedData, tag } = JSON.parse(encrypted);

    const decipher = createDecipheriv(
      "aes-256-gcm",
      key,
      Buffer.from(iv, "hex"),
    );

    decipher.setAuthTag(Buffer.from(tag, "hex"));

    let decrypted = decipher.update(encryptedData, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  }
}
```

## 最佳实践

### 1. 环境隔离

维护单独的环境文件：

```bash
.env.development    # 本地开发设置
.env.staging       # 预发布环境
.env.production    # 生产设置
```

### 2. Git 安全

排除敏感文件：

```gitignore
# .gitignore
.env
.env.*
characters/**/secrets.json
**/serviceAccount.json
```

### 3. 秘密验证

在使用前验证秘密：

```typescript
async function validateSecrets(character: Character): Promise<void> {
  const required = ["OPENAI_API_KEY"];
  const missing = required.filter((key) => !character.settings.secrets[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required secrets: ${missing.join(", ")}`);
  }
}
```

### 4. 错误处理

安全的错误消息：

```typescript
try {
  await loadSecrets();
} catch (error) {
  if (error.code === "ENOENT") {
    console.error("Environment file not found");
  } else if (error instanceof ValidationError) {
    console.error("Invalid secret format");
  } else {
    // 安全记录日志，不暴露秘密值
    console.error("Error loading secrets");
  }
}
```

## 安全考虑

### 1. 处理API密钥

```typescript
class APIKeyManager {
  private validateAPIKey(key: string): boolean {
    if (key.startsWith("sk-")) {
      return key.length > 20;
    }
    return false;
  }

  async rotateAPIKey(provider: string): Promise<void> {
    // 实现密钥轮换逻辑
  }
}
```

### 2. 安全配置加载

```typescript
class ConfigLoader {
  private static sanitizePath(path: string): boolean {
    return !path.includes("../") && !path.startsWith("/");
  }

  async loadConfig(path: string): Promise<Config> {
    if (!this.sanitizePath(path)) {
      throw new Error("Invalid config path");
    }
    // 加载配置
  }
}
```

### 3. 内存安全

```typescript
class SecureMemory {
  private secrets: Map<string, WeakRef<string>> = new Map();

  set(key: string, value: string): void {
    this.secrets.set(key, new WeakRef(value));
  }

  get(key: string): string | null {
    const ref = this.secrets.get(key);
    return ref?.deref() ?? null;
  }
}
```

## 故障排除

### 常见问题

1. 缺少秘密

```typescript
if (!process.env.OPENAI_API_KEY) {
  throw new Error(
    "OpenAI API key not found in environment or character settings",
  );
}
```

2. 无效的秘密格式

```typescript
function validateApiKey(key: string): boolean {
  // OpenAI 密钥以 'sk-' 开头
  if (key.startsWith("sk-")) {
    return key.length > 20;
  }
  return false;
}
```

3. 秘密加载错误

```typescript
try {
  await loadSecrets();
} catch (error) {
  if (error.response) {
    console.error("Response data:", error.response.data);
    console.error("Response status:", error.response.status);
  } else if (error.request) {
    console.error("No response received:", error.request);
  } else {
    console.error("Error setting up request:", error.message);
  }
}
```

## 相关资源

- [配置指南](./configuration.md) 用于一般设置
- [本地开发](./local-development.md) 用于开发环境
- [基础设施指南](../advanced/infrastructure.md) 用于部署安全

---