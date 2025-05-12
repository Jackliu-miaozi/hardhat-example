
# NFTEmoji Battle Game Smart Contracts

这是一个基于以太坊的 NFT 战斗游戏智能合约项目，包含 Emoji NFT、治理代币和战斗系统三个主要模块。

## 环境准备

首先需要克隆仓库并安装依赖：

```bash
git clone https://github.com/Jackliu-miaozi/hardhat-example.git
cd hardhat-example
npm install
```

### 配置环境变量

项目需要配置私钥环境变量才能正常运行。请在项目根目录创建 `.env` 文件，并添加以下内容：

```env
WESTEND_HUB_PK=5fb92d6e98884f76de468fa3f6278f8807c48bebc13595d45af5bdc4da702133
```

**注意：** 此私钥仅用于开发环境，请勿在生产环境使用。

## 编译合约

使用 Hardhat 编译智能合约：

```bash
npx hardhat compile
```

## 启动本地开发网络

```bash
npx hardhat node
```

这将启动一个本地以太坊节点，运行在 `http://localhost:8545`。

## 部署合约

在新的终端窗口中，依次部署各个模块合约：

### 1. 部署 NFTEmojiModule

```bash
npx hardhat ignition deploy ./ignition/modules/NFTEmojiModule.ts --network localNode
```

### 2. 部署 GTModule (治理代币)

```bash
npx hardhat ignition deploy ./ignition/modules/GTModule.ts --network localNode
```

### 3. 部署 BattleModule (战斗系统)

```bash
npx hardhat ignition deploy ./ignition/modules/BattleModule.ts --network localNode
```

## 合约交互

部署完成后，你可以使用 Hardhat 控制台与合约进行交互：

```bash
npx hardhat console --network localNode
```

## 项目结构

```
├── contracts/               # 智能合约源码
├── ignition/                # Ignition 部署脚本
├── scripts/                 # 辅助脚本
├── test/                    # 测试用例
├── hardhat.config.ts        # Hardhat 配置
└── package.json             # 项目依赖
```
