---
sidebar_position: 17
---

# 🫖 Eliza在TEE中

![](/img/eliza_in_tee.jpg)

## 概述

Eliza代理可以部署在TEE环境中，以确保代理数据的安全性和隐私性。本指南将引导您通过使用Eliza框架中的TEE插件，在TEE环境中设置和运行Eliza代理的过程。

### 背景

Eliza框架中的TEE插件是基于[Dstack SDK](https://github.com/Dstack-TEE/dstack)构建的，旨在简化开发人员将程序部署到CVM（保密虚拟机）的步骤，并默认遵循安全最佳实践。其主要功能包括：

- 将任何Docker容器转换为CVM镜像，以部署在支持的TEE上
- 远程认证API和Web UI上的信任链可视化
- 在0xABCD.dstack.host上使用内容寻址域自动进行RA-HTTPS封装
- 通过去中心化的信任根，将应用程序执行和状态持久化与特定硬件解耦

---

## 核心组件

Eliza的TEE实现由两个主要提供者组成，负责安全密钥管理操作和远程认证。

这些组件共同提供以下功能：

1. 在TEE内进行安全密钥派生
2. 可验证的TEE执行证明
3. 支持开发（模拟器）和生产环境

通常情况下，这些提供者一起使用，例如在钱包密钥派生过程中，每个派生密钥都包含一个认证报告，以证明它是在TEE环境中生成的。

---

### 密钥派生提供者

DeriveKeyProvider在TEE环境中实现了安全密钥派生。它支持：

- 多种TEE模式：
    - `LOCAL`：在Mac/Windows上进行本地开发时连接到`localhost:8090`的模拟器
    - `DOCKER`：在Linux上进行本地开发时通过`host.docker.internal:8090`连接到模拟器
    - `PRODUCTION`：在部署到[TEE云](https://teehouse.vercel.app)时连接到实际TEE环境

主要特点：

- 支持派生Ed25519（Solana）和ECDSA（EVM）密钥对
- 基于秘密盐和代理ID生成确定性密钥
- 包含每个派生密钥的远程认证
- 支持自定义用例的原始密钥派生

示例用法：

```typescript
const provider = new DeriveKeyProvider(teeMode);
// 对于Solana
const { keypair, attestation } = await provider.deriveEd25519Keypair(
    "/",
    secretSalt,
    agentId,
);
// 对于EVM
const { keypair, attestation } = await provider.deriveEcdsaKeypair(
    "/",
    secretSalt,
    agentId,
);
```

---

### 远程认证提供者

RemoteAttestationProvider处理TEE环境的验证和报告生成。它：

- 连接到与DeriveKeyProvider相同的TEE模式
- 生成带有重放保护（RTMRs）的TDX报告
- 提供可由第三方验证的认证数据

主要特点：

- 生成带有自定义报告数据的认证报告
- 包含报告验证的时间戳
- 支持模拟器和生产环境

示例用法：

```typescript
const provider = new RemoteAttestationProvider(teeMode);
const quote = await provider.generateAttestation(reportData);
```

## 教程

---

### 先决条件

在开始使用Eliza之前，请确保您已经：

- 安装[Docker Desktop](https://www.docker.com/products/docker-desktop/)或[Orbstack](https://orbstack.dev/)（推荐使用Orbstack）
- 对于Mac/Windows：请查看[快速入门指南](../quickstart.md)中的先决条件
- 对于Linux：您只需要安装Docker

---

### 环境设置

为了设置TEE开发环境，请执行以下步骤：

1. **配置TEE模式**

    将`TEE_MODE`环境变量设置为以下之一：

    ```env
    # 用于Mac/Windows本地开发
    TEE_MODE=LOCAL

    # 用于Linux/Docker本地开发
    TEE_MODE=DOCKER

    # 用于生产部署
    TEE_MODE=PRODUCTION
    ```

2. **设置所需的环境变量**

    ```env
    # 用于密钥派生
    WALLET_SECRET_SALT=your_secret_salt
    ```

3. **启动TEE模拟器**

    ```bash
    docker pull phalanetwork/tappd-simulator:latest
    # 默认情况下，模拟器在localhost:8090上可用
    docker run --rm -p 8090:8090 phalanetwork/tappd-simulator:latest
    ```

### 在本地使用TEE模拟器运行Eliza代理

1. **配置Eliza代理**

    按照[配置指南](../guides/configuration.md)设置您的Eliza代理。

2. **启动TEE模拟器**
   根据您的TEE模式，按照上述模拟器设置说明进行操作。

3. **对于Mac/Windows**

    确保将`TEE_MODE`环境变量设置为`LOCAL`。然后，您可以安装依赖并在本地运行代理：

    ```bash
    pnpm i
    pnpm build
    pnpm start --character=./characters/yourcharacter.character.json
    ```

4. **验证TEE认证**

    您可以通过访问[TEE RA Explorer](https://ra-quote-explorer.vercel.app/)并粘贴代理日志中的认证报告来验证TEE认证报告。以下是与Eliza代理交互以获取代理钱包地址的示例：

    ```bash
    您：你的钱包地址是什么？
    ```

    代理的日志输出：

    ```bash
    Generating attestation for:  {"agentId":"025e0996-69d7-0dce-8189-390e354fd1c1","publicKey":"9yZBmCRRFEBtA3KYokxC24igv1ijFp6tyvzKxRs3khTE"}
    rtmr0: a4a17452e7868f62f77ea2039bd2840e7611a928c26e87541481256f57bfbe3647f596abf6e8f6b5a0e7108acccc6e89
    rtmr1: db6bcc74a3ac251a6398eca56b2fcdc8c00a9a0b36bc6299e06fb4bb766cb9ecc96de7e367c56032c7feff586f9e557e
    rtmr2: 2cbe156e110b0cc4b2418600dfa9fb33fc60b3f04b794ec1b8d154b48f07ba8c001cd31f75ca0d0fb516016552500d07
    rtmr3: eb7110de9956d7b4b1a3397f843b39d92df4caac263f5083e34e3161e4d6686c46c3239e7fbf61241a159d8da6dc6bd1f
    Remote attestation quote:  {
    quote: '0x0400030081000000736940f888442c8ca8cb432d7a87145f9b7aeab1c5d129ce901716a7506375426ea8741ca69be68e92c5df29f539f103eb60ab6780c56953b0d81af523a031617b32d5e8436cceb019177103f4aceedbf114a846baf8e8e2b8e6d3956e96d6b89d94a0f1a366e6c309d77c77c095a13d2d5e2f8e2d7f51ece4ae5ffc5fe8683a37387bfdb9acb8528f37342360abb64ec05ff438f7e4fad73c69a627de245a31168f69823883ed8ba590c454914690946b7b07918ded5b89dc663c70941f8704978b91a24b54d88038c30d20d14d85016a524f7176c7a7cff7233a2a4405da9c31c8569ac3adfe5147bdb92faee0f075b36e8ce794aaf596facd881588167fbcf5a7d059474c1e4abff645bba8a813f3083c5a425fcc88cd706b19494dedc04be2bc3ab1d71b2a062ddf62d0393d8cb421393cccc932a19d43e315a18a10d216aea4a1752cf3f3b0b2fb36bea655822e2b27c6156970d18e345930a4a589e1850fe84277e0913ad863dffb1950fbeb03a4a17452e7868f62f77ea2039bd2840e7611a928c26e87541481256f57bfbe3647f596abf6e8f6b5a0e7108acccc6e89db6bcc74a3ac251a6398eca56b2fcdc8c00a9a0b36bc6299e06fb4bb766cb9ecc96de7e367c56032c7feff586f9e557e2cbe156e110b0cc4b2418600dfa9fb33fc60b3f04b794ec1b8d154b48f07ba8c001cd31f75ca0d0fb516016552500d07eb7110de9956d7b4b1a3397f843b39d92df4caac263f5083e34e3161e4d6686c46c3239e7fbf61241a159d8da6dc6bd13df734883d4d0d78d670a1d17e28ef09dffbbfbd15063b73113cb5bed692d68cc30c38cb9389403fe6a1c32c35dbac75464b77597e27b854839db51dfde0885462020000530678b9eb99d1b9e08a6231ef00055560f7d3345f54ce355da68725bb38cab0caf84757ddb93db87577758bb06de7923c4ee3583453f284c8b377a1ec2ef613491e051c801a63da5cb42b9c12e26679fcf489f3b14bd5e8f551227b09d976975e0fbd68dcdf129110a5ca8ed8d163dafb60e1ec4831d5285a7fbae81d0e39580000dc010000ebb282d5c6aca9053a21814e9d65a1516ebeaacf6fc88503e794d75cfc5682e86aa04e9d6e58346e013c5c1203afc5c72861e2a7052afcdcb3ddcccd102dd0daeb595968edb6a6c513db8e2155fc302eeca7a34c9ba81289d6941c4c813db9bf7bd0981d188ab131e5ae9c4bb831e4243b20edb7829a6a7a9cf0eae1214b450109d990e2c824c2a60a47faf90c24992583bc5c3da3b58bd8830a4f0ad5c650aa08ae0e067d4251d251e56d70972ad901038082ee9340f103fd687ec7d91a9b8b8652b1a2b7befb4cbfdb6863f00142e0b2e67198ddc8ddbe96dc02762d935594394f173114215cb5abcf55b9815eb545683528c990bfae34c34358dbb19dfc1426f56cba12af325d7a2941c0d45d0ea4334155b790554d3829e3be618eb1bfc6f3a06f488bbeb910b33533c6741bff6c8a0ca43eb2417eec5ecc2f50f65c3b40d26174376202915337c7992cdd44471dee7a7b2038605415a7af593fd9066661e594b26f4298baf6d001906aa8fc1c460966fbc17b2c35e0973f613399936173802cf0453a4e7d8487b6113a77947eef190ea8d47ba531ce51abf5166448c24a54de09d671fd57cbd68154f5995aee6c2ccfd6738387cf3ad9f0ad5e8c7d46fb0a0000000000000000000000bd920a00000000000000000000000000',
    timestamp: 1733606453433
    }
    ```

    将`quote`字段复制并粘贴到[TEE RA Explorer](https://ra-quote-explorer.vercel.app/)中以验证认证。**注意**：由于报告是从TEE模拟器生成的，因此验证将为未验证状态。

    ![](https://i.imgur.com/xYGMeP4.png)

    ![](https://i.imgur.com/BugdNUy.png)

---
### 构建、测试和发布 Eliza Agent Docker 镜像

现在我们已经在 TEE 模拟器中运行了 Eliza agent，可以构建并发布 Eliza agent Docker 镜像，为部署到真实的 TEE 环境做准备。

首先，您需要创建一个 Docker 账户并将您的镜像发布到容器注册表。这里我们将使用 [Docker Hub](https://hub.docker.com/) 作为示例。

登录 Docker Hub：

```bash
docker login
```

构建 Docker 镜像：

```bash
# 对于 Linux/AMD64 机器运行
docker build -t username/eliza-agent:latest .

# 对于非 AMD64 架构，运行
docker buildx build --platform=linux/amd64 -t username/eliza-agent:latest .
```

对于 Linux/AMD64 机器，您现在可以通过将 `TEE_MODE` 环境变量更新为 `DOCKER` 并在 [docker-compose.yaml](https://github.com/elizaos/eliza/blob/main/docker-compose.yaml) 文件中设置环境变量来本地测试 agent。完成后，您可以通过运行以下命令启动 agent：

> **注意**：在通过 docker compose 启动 agent 之前，请确保 TEE 模拟器正在运行。

```bash
docker compose up
```

将 Docker 镜像发布到容器注册表：

```bash
docker push username/eliza-agent:latest
```

现在我们准备将 Eliza agent 部署到真实的 TEE 环境。

### 在真实的 TEE 环境中运行 Eliza Agent

在将 Eliza agent 部署到真实的 TEE 环境之前，您需要在 [TEE Cloud](https://teehouse.vercel.app) 上创建一个新的 TEE 账户。如果需要帮助，请联系 Phala Network 的 [Discord](https://discord.gg/phalanetwork)。

接下来，您需要在项目根文件夹中找到 docker-compose.yaml 文件，并根据您的 agent 配置进行编辑。

> **注意**：API 密钥和其他秘密环境变量应在 TEE Cloud 仪表板中的秘密环境变量配置中设置。

```yaml
# docker-compose.yaml
services:
    tee:
        command:
            [
                "pnpm",
                "start",
                "--character=./characters/yourcharacter.character.json",
            ]
        image: username/eliza-agent:latest
        stdin_open: true
        tty: true
        volumes:
            - /var/run/tappd.sock:/var/run/tappd.sock
            - tee:/app/packages/client-twitter/src/tweetcache
            - tee:/app/db.sqlite
        environment:
            - REDPILL_API_KEY=$REDPILL_API_KEY
            - SMALL_REDPILL_MODEL=anthropic/claude-3-5-sonnet
            - MEDIUM_REDPILL_MODEL=anthropic/claude-3-5-sonnet
            - LARGE_REDPILL_MODEL=anthropic/claude-3-opus
            - ELEVENLABS_XI_API_KEY=$ELEVENLABS_XI_API_KEY
            - ELEVENLABS_MODEL_ID=eleven_multilingual_v2
            - ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM
            - ELEVENLABS_VOICE_STABILITY=0.5
            - ELEVENLABS_VOICE_SIMILARITY_BOOST=0.9
            - ELEVENLABS_VOICE_STYLE=0.66
            - ELEVENLABS_VOICE_USE_SPEAKER_BOOST=false
            - ELEVENLABS_OPTIMIZE_STREAMING_LATENCY=4
            - ELEVENLABS_OUTPUT_FORMAT=pcm_16000
            - TWITTER_DRY_RUN=false
            - TWITTER_USERNAME=$TWITTER_USERNAME
            - TWITTER_PASSWORD=$TWITTER_PASSWORD
            - TWITTER_EMAIL=$TWITTER_EMAIL
            - X_SERVER_URL=$X_SERVER_URL
            - BIRDEYE_API_KEY=$BIRDEYE_API_KEY
            - SOL_ADDRESS=So11111111111111111111111111111111111111112
            - SLIPPAGE=1
            - RPC_URL=https://api.mainnet-beta.solana.com
            - HELIUS_API_KEY=$HELIUS_API_KEY
            - SERVER_PORT=3000
            - WALLET_SECRET_SALT=$WALLET_SECRET_SALT
            - TEE_MODE=PRODUCTION
        ports:
            - "3000:80"
        restart: always

volumes:
    tee:
```

现在您可以将 Eliza agent 部署到真实的 TEE 环境。前往 [TEE Cloud](https://teehouse.vercel.app) 并点击 `Create VM` 按钮来配置您的 Eliza agent 部署。

点击 `Compose Manifest Mode` 选项卡，并将 docker-compose.yaml 文件内容粘贴到 `Compose Manifest` 字段中。

![Compose Manifest](https://i.imgur.com/wl6pddX.png)

接下来，前往 `Resources` 选项卡并配置您的 VM 资源。

> **注意**：`CPU` 和 `Memory` 资源应大于您的 agent 配置的最低要求（推荐：2 CPU，4GB 内存，50GB 磁盘）。

![Resources](https://i.imgur.com/HsmupO1.png)

最后，点击 `Submit` 按钮以部署您的 Eliza agent。

这将需要几分钟时间完成。部署完成后，您可以点击 `View` 按钮查看您的 Eliza agent。

以下是一个名为 `vitailik2077` 的已部署 agent 示例：

![Deployed Agent](https://i.imgur.com/ie8gpg9.png)

我可以前往仪表板并查看远程认证信息：

![Agent Dashboard](https://i.imgur.com/vUqHGjF.png)

点击 `Logs` 选项卡查看 agent 日志。

![Agent Logs](https://i.imgur.com/aU3i0Dv.png)

现在我们可以通过访问 [TEE RA Explorer](https://ra-quote-explorer.vercel.app/) 并粘贴来自 agent 日志的认证引文来验证真实的 TEE 认证引文。

![TEE RA Explorer](https://i.imgur.com/TJ5299l.png)

恭喜！您已成功在真实的 TEE 环境中运行 Eliza agent。