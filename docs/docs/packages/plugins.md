# 🧩 插件

## 概述

Eliza 的插件系统提供了一种模块化的方法，通过附加功能、操作、评估器和提供者来扩展核心功能。插件是自包含的模块，可以轻松添加或移除，以定制您的代理功能。

## 核心插件概念

### 插件结构

Eliza 中的每个插件都必须实现 `Plugin` 接口，并包含以下属性：

```typescript
interface Plugin {
    name: string; // 插件的唯一标识符
    description: string; // 插件功能的简要描述
    actions?: Action[]; // 插件提供的自定义操作
    evaluators?: Evaluator[]; // 行为评估的自定义评估器
    providers?: Provider[]; // 消息生成的上下文提供者
    services?: Service[]; // 额外的服务（可选）
}
```

## 使用插件

### 安装

1. 安装所需的插件包：

```bash
pnpm add @elizaos/plugin-[name]
```

2. 在角色配置中导入并注册插件：

```typescript
import { bootstrapPlugin } from "@eliza/plugin-bootstrap";
import { imageGenerationPlugin } from "@eliza/plugin-image-generation";
import { buttplugPlugin } from "@eliza/plugin-buttplug";
const character = {
    // ... 其他角色配置
    plugins: [bootstrapPlugin, imageGenerationPlugin, buttplugPlugin],
};
```

---

### 可用插件

#### 1. Bootstrap 插件 (`@eliza/plugin-bootstrap`)

Bootstrap 插件提供基本的基础功能：

**操作：**

- `continue` - 继续当前对话流程
- `followRoom` - 关注房间以获取更新
- `unfollowRoom` - 取消关注房间
- `ignore` - 忽略特定消息
- `muteRoom` - 静音房间通知
- `unmuteRoom` - 取消静音房间通知

**评估器：**

- `fact` - 评估事实准确性
- `goal` - 评估目标完成情况

**提供者：**

- `boredom` - 管理参与度
- `time` - 提供时间上下文
- `facts` - 提供事实信息

#### 2. 图像生成插件 (`@eliza/plugin-image-generation`)

启用 AI 图像生成功能：

**操作：**

- `GENERATE_IMAGE` - 根据文本描述创建图像
- 支持多种图像生成服务（Anthropic、Together）
- 自动生成图像的标题

#### 3. Node 插件 (`@eliza/plugin-node`)

提供基于 Node.js 的核心服务：

**服务：**

- `BrowserService` - 网页浏览功能
- `ImageDescriptionService` - 图像分析
- `LlamaService` - LLM 集成
- `PdfService` - PDF 处理
- `SpeechService` - 文本转语音
- `TranscriptionService` - 语音转文本
- `VideoService` - 视频处理

#### 4. Solana 插件 (`@eliza/plugin-solana`)

集成 Solana 区块链功能：

**评估器：**

- `trustEvaluator` - 评估交易信任分数

**提供者：**

- `walletProvider` - 钱包管理
- `trustScoreProvider` - 交易信任指标

##### 慈善捐款

所有 Coinbase 交易和转账会自动捐赠 1% 的交易金额给慈善机构。目前，慈善地址是根据交易使用的网络硬编码的，当前支持的慈善机构为 X。

每个网络的慈善地址如下：

- **Base**: `0x1234567890123456789012345678901234567890`
- **Solana**: `pWvDXKu6CpbKKvKQkZvDA66hgsTB6X2AgFxksYogHLV`
- **Ethereum**: `0x750EF1D7a0b4Ab1c97B7A623D7917CcEb5ea779C`
- **Arbitrum**: `0x1234567890123456789012345678901234567890`
- **Polygon**: `0x1234567890123456789012345678901234567890`

未来，我们计划与 The Giving Block API 集成，以实现动态和可配置的捐赠，支持更多的慈善组织。

#### 5. Coinbase Commerce 插件 (`@eliza/plugin-coinbase`)

集成 Coinbase Commerce 进行支付和交易管理：

**操作：**

- `CREATE_CHARGE` - 使用 Coinbase Commerce 创建支付费用
- `GET_ALL_CHARGES` - 获取所有支付费用
- `GET_CHARGE_DETAILS` - 检索特定费用的详细信息

**描述：**
此插件使 Eliza 能够与 Coinbase Commerce API 交互，以创建和管理支付费用，提供与加密货币支付系统的无缝集成。

---

##### Coinbase 钱包管理

该插件会自动处理钱包创建，或在首次运行时使用现有钱包（如果提供了所需的详细信息）。

1. **首次运行时生成钱包**
   如果未提供钱包信息（`COINBASE_GENERATED_WALLET_HEX_SEED` 和 `COINBASE_GENERATED_WALLET_ID`），插件将：

    - 使用 Coinbase SDK **生成新钱包**。
    - 自动**导出钱包详细信息**（`seed` 和 `walletId`）并安全地存储在 `runtime.character.settings.secrets` 或其他配置的存储中。
    - 记录钱包的默认地址以供参考。
    - 如果角色文件不存在，钱包详细信息将保存到角色目录中的 `characters/charactername-seed.txt` 文件中，并附有说明，指示用户必须手动将这些详细信息添加到 settings.secrets 或 .env 文件中。

2. **使用现有钱包**
   如果在首次运行时提供了钱包信息：
    - 通过 `runtime.character.settings.secrets` 或环境变量提供 `COINBASE_GENERATED_WALLET_HEX_SEED` 和 `COINBASE_GENERATED_WALLET_ID`。
    - 插件将**导入钱包**并用于处理大规模支付。

---

#### 6. Coinbase MassPayments 插件 (`@eliza/plugin-coinbase`)

此插件使用 Coinbase SDK 促进加密货币大规模支付的处理。它使得可以创建和管理对多个钱包地址的大规模支付，并将所有交易详细信息记录到 CSV 文件中以供进一步分析。

**操作：**

- `SEND_MASS_PAYOUT`
  发送加密货币大规模支付到多个钱包地址。
    - **输入**：
        - `receivingAddresses`（字符串数组）：接收资金的钱包地址。
        - `transferAmount`（数字）：发送到每个地址的金额（以最小货币单位，例如 ETH 的 Wei）。
        - `assetId`（字符串）：加密货币资产 ID（例如 `ETH`、`BTC`）。
        - `network`（字符串）：区块链网络（例如 `base`、`sol`、`eth`、`arb`、`pol`）。
    - **输出**：在 CSV 文件中记录交易结果（成功/失败）。
    - **示例**：
        ```json
        {
            "receivingAddresses": [
                "0xA0ba2ACB5846A54834173fB0DD9444F756810f06",
                "0xF14F2c49aa90BaFA223EE074C1C33b59891826bF"
            ],
            "transferAmount": 5000000000000000,
            "assetId": "ETH",
            "network": "eth"
        }
        ```

**提供者：**

- `massPayoutProvider`
  从生成的 CSV 文件中检索过去交易的详细信息。
    - **输出**：包括以下字段的交易记录列表：
        - `address`：接收者钱包地址。
        - `amount`：发送的金额。
        - `status`：交易状态（`Success` 或 `Failed`）。
        - `errorCode`：错误代码（如果有）。
        - `transactionUrl`：交易详细信息的 URL（如果有）。

**描述：**

Coinbase MassPayments 插件简化了加密货币的分发，确保对支持的区块链网络上的多个接收者进行高效和可扩展的支付。

支持的网络：

- `base`（Base 区块链）
- `sol`（Solana）
- `eth`（Ethereum）
- `arb`（Arbitrum）
- `pol`（Polygon）

**设置和配置：**

1. **配置插件**
   将插件添加到角色配置中：

    ```typescript
    import { coinbaseMassPaymentsPlugin } from "@eliza/plugin-coinbase-masspayments";

    const character = {
        plugins: [coinbaseMassPaymentsPlugin],
    };
    ```

2. **所需配置**
   设置以下环境变量或运行时设置：

    - `COINBASE_API_KEY`：Coinbase SDK 的 API 密钥
    - `COINBASE_PRIVATE_KEY`：用于安全交易的私钥
    - `COINBASE_GENERATED_WALLET_HEX_SEED`：钱包的十六进制种子（如果使用现有钱包）
    - `COINBASE_GENERATED_WALLET_ID`：唯一钱包 ID（如果使用现有钱包）

**钱包管理：**

该插件以两种方式处理钱包创建和管理：

1. **自动创建钱包**
   当未提供钱包详细信息时，插件将：

    - 使用 Coinbase SDK 生成新钱包
    - 导出并存储钱包详细信息在 `runtime.character.settings.secrets`
    - 如果角色文件不存在，将详细信息保存到 `characters/charactername-seed.txt`
    - 记录钱包的默认地址

2. **使用现有钱包**
   当提供钱包信息时：
    - 通过设置或环境变量提供所需的钱包详细信息
    - 插件将导入并使用现有钱包

**示例配置：**

```typescript
// 用于自动生成钱包
runtime.character.settings.secrets = {
    // 首次运行时的空设置
};

// 使用现有钱包
runtime.character.settings.secrets = {
    COINBASE_GENERATED_WALLET_HEX_SEED:
        "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
    COINBASE_GENERATED_WALLET_ID: "wallet-id-123",
};
```

**示例调用**

```typescript
const response = await runtime.triggerAction("SEND_MASS_PAYOUT", {
    receivingAddresses: [
        "0xA0ba2ACB5846A54834173fB0DD9444F756810f06",
        "0xF14F2c49aa90BaFA223EE074C1C33b59891826bF",
    ],
    transferAmount: 5000000000000000, // 0.005 ETH
    assetId: "ETH",
    network: "eth",
});
console.log("Mass payout response:", response);
```

**交易记录**

所有交易（成功和失败）都记录在插件工作目录中的 `transactions.csv` 文件中：

```plaintext
Address,Amount,Status,Error Code,Transaction URL
0xA0ba2ACB5846A54834173fB0DD9444F756810f06,5000000000000000,Success,,https://etherscan.io/tx/0x...
```

**示例输出：**

成功时，将返回类似以下的响应：

```json
{
    "text": "Mass payouts completed successfully.\n- Successful Transactions: 2\n- Failed Transactions: 0\nCheck the CSV file for more details."
}
```

**最佳实践：**

- **安全存储机密**：确保 `COINBASE_API_KEY` 和 `COINBASE_PRIVATE_KEY` 安全存储在 `runtime.character.settings.secrets` 或环境变量中。要么添加 `COINBASE_GENERATED_WALLET_HEX_SEED` 和 `COINBASE_GENERATED_WALLET_ID`，要么它将被动态创建
- **验证**：始终验证输入参数，特别是 `receivingAddresses` 和 `network`，以确保符合预期格式和支持的网络。
- **错误处理**：监控日志中的失败交易或支付过程中的错误，并根据需要调整重试逻辑。

---

#### 7. Coinbase Token Contract 插件 (`@eliza/plugin-coinbase`)

此插件使用 Coinbase SDK 启用与各种代币合约（ERC20、ERC721、ERC1155）的部署和交互。它提供了部署新代币合约和与现有合约交互的功能。

**操作：**

1. `DEPLOY_TOKEN_CONTRACT`
   部署新代币合约（ERC20、ERC721 或 ERC1155）。

    - **输入**：
        - `contractType`（字符串）：要部署的合约类型（`ERC20`、`ERC721` 或 `ERC1155`）
        - `name`（字符串）：代币名称
        - `symbol`（字符串）：代币符号
        - `network`（字符串）：要部署的区块链网络
        - `baseURI`（字符串，可选）：代币元数据的基本 URI（仅适用于 ERC721 和 ERC1155）
        - `totalSupply`（数字，可选）：代币总供应量（仅适用于 ERC20）
    - **示例**：
        ```json
        {
            "contractType": "ERC20",
            "name": "MyToken",
            "symbol": "MTK",
            "network": "base",
            "totalSupply": 1000000
        }
        ```

2. `INVOKE_CONTRACT`
   调用已部署智能合约的方法。
    - **输入**：
        - `contractAddress`（字符串）：要调用的合约地址
        - `method`（字符串）：要调用的方法名称
        - `abi`（数组）：合约 ABI
        - `args`（对象，可选）：方法的参数
        - `amount`（数字，可选）：发送的资产金额（用于可支付方法）
        - `assetId`（字符串，可选）：发送的资产 ID
        - `network`（字符串）：要使用的区块链网络
    - **示例**：
        ```json
        {
          "contractAddress": "0x123...",
          "method": "transfer",
          "abi": [...],
          "args": {
            "to": "0x456...",
            "amount": "1000000000000000000"
          },
          "network": "base"
        }
        ```

**描述：**

Coinbase Token Contract 插件简化了在支持的区块链网络上部署和交互各种代币合约的过程。它支持：

- 可定制供应量的 ERC20 代币部署
- 支持元数据 URI 的 ERC721（NFT）部署
- 支持元数据 URI 的 ERC1155（多代币）部署
- 已部署合约的方法调用

所有合约部署和交互都记录在 CSV 文件中，以便记录和审计。

**使用说明：**

1. **配置插件**
   将插件添加到角色配置中：

    ```typescript
    import { tokenContractPlugin } from "@eliza/plugin-coinbase";

    const character = {
        plugins: [tokenContractPlugin],
    };
    ```

2. **所需配置**
   确保配置以下环境变量或运行时设置：
    - `COINBASE_API_KEY`：Coinbase SDK 的 API 密钥
    - `COINBASE_PRIVATE_KEY`：用于安全交易的私钥
    - 钱包配置（与 MassPayments 插件相同）

**示例部署：**

1. **ERC20 代币**

    ```typescript
    const response = await runtime.triggerAction("DEPLOY_TOKEN_CONTRACT", {
        contractType: "ERC20",
        name: "MyToken",
        symbol: "MTK",
        network: "base",
        totalSupply: 1000000,
    });
    ```

2. **NFT 集合**

    ```typescript
    const response = await runtime.triggerAction("DEPLOY_TOKEN_CONTRACT", {
        contractType: "ERC721",
        name: "MyNFT",
        symbol: "MNFT",
        network: "eth",
        baseURI: "https://api.mynft.com/metadata/",
    });
    ```

3. **多代币集合**
    ```typescript
    const response = await runtime.triggerAction("DEPLOY_TOKEN_CONTRACT", {
        contractType: "ERC1155",
        name: "MyMultiToken",
        symbol: "MMT",
        network: "pol",
        baseURI: "https://api.mymultitoken.com/metadata/",
    });
    ```

**合约交互示例：**

```typescript
const response = await runtime.triggerAction("INVOKE_CONTRACT", {
  contractAddress: "0x123...",
  method: "transfer",
  abi: [...],
  args: {
    to: "0x456...",
    amount: "1000000000000000000"
  },
  network: "base"
});
```

**最佳实践：**

- 部署前始终验证合约参数
- 安全存储合约地址和部署详情
- 在主网部署前在测试网测试合约交互
- 使用生成的CSV日志跟踪已部署的合约
- 确保对失败的部署或交互进行适当的错误处理

---

#### 8. TEE 插件 (`@elizaos/plugin-tee`)

集成 [Dstack SDK](https://github.com/Dstack-TEE/dstack) 以启用 TEE（可信执行环境）功能并部署安全和隐私增强的 Eliza Agents：

**提供者：**

- `deriveKeyProvider` - 允许在 TEE 环境中安全地派生密钥。支持为 Solana（Ed25519）和 Ethereum（ECDSA）链派生密钥。
- `remoteAttestationProvider` - 基于 `report_data` 生成远程认证报告。

**DeriveKeyProvider 用法**

```typescript
import { DeriveKeyProvider } from "@elizaos/plugin-tee";

// 初始化提供者
const provider = new DeriveKeyProvider();

// 派生原始密钥
try {
    const rawKey = await provider.rawDeriveKey(
        "/path/to/derive",
        "subject-identifier",
    );
    // rawKey 是一个 DeriveKeyResponse，可用于进一步处理
    // 获取 uint8Array 如下
    const rawKeyArray = rawKey.asUint8Array();
} catch (error) {
    console.error("原始密钥派生失败:", error);
}

// 派生 Solana 密钥对（Ed25519）
try {
    const solanaKeypair = await provider.deriveEd25519Keypair(
        "/path/to/derive",
        "subject-identifier",
    );
    // solanaKeypair 现在可以用于 Solana 操作
} catch (error) {
    console.error("Solana 密钥派生失败:", error);
}

// 派生 Ethereum 密钥对（ECDSA）
try {
    const evmKeypair = await provider.deriveEcdsaKeypair(
        "/path/to/derive",
        "subject-identifier",
    );
    // evmKeypair 现在可以用于 Ethereum 操作
} catch (error) {
    console.error("EVM 密钥派生失败:", error);
}
```

**RemoteAttestationProvider 用法**

```typescript
import { RemoteAttestationProvider } from "@elizaos/plugin-tee";
// 初始化提供者
const provider = new RemoteAttestationProvider();
// 生成远程认证
try {
    const attestation = await provider.generateAttestation("your-report-data");
    console.log("认证:", attestation);
} catch (error) {
    console.error("生成认证失败:", error);
}
```

**配置**

要获取本地测试的 TEE 模拟器，请使用以下命令：

```bash
docker pull phalanetwork/tappd-simulator:latest
# 默认情况下，模拟器在 localhost:8090 可用
docker run --rm -p 8090:8090 phalanetwork/tappd-simulator:latest
```

通过运行环境使用提供者时，请确保配置以下设置：

```env
 # 可选，如果在 mac 或 windows 上测试模拟器。Linux x86 机器请留空。
DSTACK_SIMULATOR_ENDPOINT="http://host.docker.internal:8090"
WALLET_SECRET_SALT=your-secret-salt // 单个代理部署所需
```

---

#### 9. Webhook 插件 (`@eliza/plugin-coinbase-webhooks`)

使用 Coinbase SDK 管理 webhooks，允许创建和管理 webhooks 以监听 Coinbase 平台上的特定事件。

**操作：**

- `CREATE_WEBHOOK` - 创建一个新的 webhook 以监听特定事件。
    - **输入**：
        - `networkId` (string): webhook 应监听事件的网络 ID。
        - `eventType` (string): 要监听的事件类型（例如，转账）。
        - `eventFilters` (object, optional): 事件的附加过滤器。
        - `eventTypeFilter` (string, optional): 特定事件类型过滤器。
    - **输出**：包含 webhook 详细信息的确认消息。
    - **示例**：
        ```json
        {
            "networkId": "base",
            "eventType": "transfers",
            "notificationUri": "https://your-notification-uri.com"
        }
        ```

**提供者：**

- `webhookProvider` - 检索所有配置的 webhooks 列表。
    - **输出**：包含 ID、URL、事件类型和状态的 webhooks 列表。

**描述：**

Webhook 插件使 Eliza 能够与 Coinbase SDK 交互，以创建和管理 webhooks。这允许基于用户设置的特定条件进行实时事件处理和通知。

**使用说明：**

1. **配置插件**
   将插件添加到角色的配置中：

    ```typescript
    import { webhookPlugin } from "@eliza/plugin-coinbase-webhooks";

    const character = {
        plugins: [webhookPlugin],
    };
    ```

2. **确保安全配置**
   设置以下环境变量或运行时设置，以确保插件安全运行：

    - `COINBASE_API_KEY`: Coinbase SDK 的 API 密钥。
    - `COINBASE_PRIVATE_KEY`: 用于安全交易的私钥。
    - `COINBASE_NOTIFICATION_URI`: 接收通知的 URI。

**示例调用**

创建 webhook：

```typescript
const response = await runtime.triggerAction("CREATE_WEBHOOK", {
    networkId: "base",
    eventType: "transfers",
    notificationUri: "https://your-notification-uri.com",
});
console.log("Webhook 创建响应:", response);
```

**最佳实践：**

- **安全存储密钥**：确保 `COINBASE_API_KEY`、`COINBASE_PRIVATE_KEY` 和 `COINBASE_NOTIFICATION_URI` 安全存储在 `runtime.character.settings.secrets` 或环境变量中。
- **验证**：始终验证输入参数以确保符合预期格式和支持的网络。
- **错误处理**：监控 webhook 创建过程中的错误日志，并根据需要调整重试逻辑。

### 10. Fuel 插件 (`@elizaos/plugin-fuel`)

Fuel 插件提供与 Fuel Ignition 区块链的接口。

**操作：**

1. `TRANSFER_FUEL_ETH` - 向指定的 Fuel 地址转移 ETH。 - **输入**： - `toAddress` (string): 要转移 ETH 的 Fuel 地址。 - `amount` (string): 要转移的 ETH 数量。 - **输出**：包含交易详情的确认消息。 - **示例**：
   ```json
   {
    "toAddress": "0x8F8afB12402C9a4bD9678Bec363E51360142f8443FB171655eEd55dB298828D1",
    "amount": "0.00001"
   }
   ```
   **设置和配置：**

1. **配置插件**
   将插件添加到角色的配置中：

    ```typescript
    import { fuelPlugin } from "@eliza/plugin-fuel";

    const character = {
        plugins: [fuelPlugin],
    };
    ```

1. **必需配置**
   设置以下环境变量或运行时设置：

    - `FUEL_WALLET_PRIVATE_KEY`: 用于安全交易的私钥

### 编写自定义插件

通过实现 Plugin 接口创建新插件：

```typescript
import { Plugin, Action, Evaluator, Provider } from "@elizaos/core";

const myCustomPlugin: Plugin = {
    name: "my-custom-plugin",
    description: "添加自定义功能",
    actions: [
        /* 自定义操作 */
    ],
    evaluators: [
        /* 自定义评估器 */
    ],
    providers: [
        /* 自定义提供者 */
    ],
    services: [
        /* 自定义服务 */
    ],
};
```

## 最佳实践

1. **模块化**：保持插件专注于特定功能
2. **依赖性**：清楚记录任何外部依赖
3. **错误处理**：实现健壮的错误处理
4. **文档**：为操作和评估器提供清晰的文档
5. **测试**：包括插件功能的测试

## 插件开发指南

### 操作开发

- 实现 `Action` 接口
- 提供清晰的验证逻辑
- 包括使用示例
- 优雅地处理错误

### 评估器开发

- 实现 `Evaluator` 接口
- 定义明确的评估标准
- 包括验证逻辑
- 记录评估指标

### 提供者开发

- 实现 `Provider` 接口
- 定义上下文生成逻辑
- 处理状态管理
- 记录提供者能力

## 常见问题及解决方案

### 插件加载问题

```typescript
// 检查插件是否正确加载
if (character.plugins) {
    console.log("插件是: ", character.plugins);
    const importedPlugins = await Promise.all(
        character.plugins.map(async (plugin) => {
            const importedPlugin = await import(plugin);
            return importedPlugin;
        }),
    );
    character.plugins = importedPlugins;
}
```

### 服务注册

```typescript
// 正确的服务注册
registerService(service: Service): void {
    const serviceType = (service as typeof Service).serviceType;
    if (this.services.has(serviceType)) {
        console.warn(`服务 ${serviceType} 已注册`);
        return;
    }
    this.services.set(serviceType, service);
}
```

## 未来扩展

插件系统设计为可扩展。未来可能的添加包括：

- 数据库适配器
- 认证提供者
- 自定义模型提供者
- 外部 API 集成
- 工作流自动化
- 自定义 UI 组件

## 贡献

要贡献新插件：

1. 遵循插件结构指南
2. 包括全面的文档
3. 为所有功能添加测试
4. 提交拉取请求
5. 更新插件注册表

有关详细的 API 文档和示例，请参见 [API 参考](/api)。
