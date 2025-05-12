import { ethers, network } from "hardhat";
import { expect } from "chai";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { NFTEmoji } from "../typechain-types"; // 确保已运行 npx hardhat compile 生成类型

describe("NFTEmoji Contract", function () {
    let NFTEmojiFactory;
    let nftEmoji: NFTEmoji;
    let owner: HardhatEthersSigner;
    let addr1: HardhatEthersSigner;
    let addr2: HardhatEthersSigner;

    /**
     * @dev 在每个测试用例执行前部署合约
     */
    beforeEach(async function () {
        this.timeout(60000);
        
        // 获取合约工厂和签名者
        NFTEmojiFactory = await ethers.getContractFactory("NFTEmoji");
        [owner, addr1, addr2] = await ethers.getSigners();
    
        // 部署合约时指定gas限制
        nftEmoji = await NFTEmojiFactory.deploy({ gasLimit: 5000000 }) as NFTEmoji;
        await nftEmoji.waitForDeployment();
    });

    /**
     * @dev 测试合约部署
     */
    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            expect(await nftEmoji.owner()).to.equal(owner.address);
        });

        it("Should have correct name and symbol", async function () {
            expect(await nftEmoji.name()).to.equal("NFTEmoji");
            expect(await nftEmoji.symbol()).to.equal("EMOJI");
        });
    });

    /**
     * @dev 测试 mint 功能
     */
    describe("Minting", function () {
        // 添加边界条件测试
        it("Should not allow minting with zero power", async function () {
            await expect(
                nftEmoji.connect(owner).mint(addr1.address, 0)
            ).to.be.revertedWith("NFTEmoji: power must be greater than 0");
        });

        // 添加最大power测试
        it("Should allow minting with maximum power (2^256 - 1)", async function () {
            const maxPower = ethers.MaxUint256;
            await nftEmoji.connect(owner).mint(addr1.address, maxPower);
            expect(await nftEmoji.tokenPower(1)).to.equal(maxPower);
        });

        it("Owner should be able to mint an NFT with power", async function () {
            const tokenId = 1;
            const power = 100;
            await expect(nftEmoji.connect(owner).mint(addr1.address, power))
                .to.emit(nftEmoji, "Transfer")
                .withArgs(ethers.ZeroAddress, addr1.address, tokenId);

            expect(await nftEmoji.ownerOf(tokenId)).to.equal(addr1.address);
            expect(await nftEmoji.tokenPower(tokenId)).to.equal(power);
        });

        it("Should increment tokenId counter", async function () {
            await nftEmoji.connect(owner).mint(addr1.address, 100); // Token ID 1
            await nftEmoji.connect(owner).mint(addr2.address, 200); // Token ID 2

            expect(await nftEmoji.ownerOf(1)).to.equal(addr1.address);
            expect(await nftEmoji.tokenPower(1)).to.equal(100);
            expect(await nftEmoji.ownerOf(2)).to.equal(addr2.address);
            expect(await nftEmoji.tokenPower(2)).to.equal(200);
        });

        it("Non-owner should not be able to mint an NFT", async function () {
            await expect(
                nftEmoji.connect(addr1).mint(addr1.address, 100)
            ).to.be.revertedWithCustomError(nftEmoji, "OwnableUnauthorizedAccount")
                .withArgs(addr1.address);
        });

        it("Should fail to mint to the zero address", async function () {
            await expect(
                nftEmoji.connect(owner).mint(ethers.ZeroAddress, 100)
            ).to.be.revertedWith("NFTEmoji: mint to the zero address");
        });
    });

    /**
     * @dev 测试 tokenPower 功能
     */
    describe("Token Power", function () {
        // 添加测试：burn后tokenPower应为0
        it("Should set token power to 0 after burning", async function () {
            const tokenId = 1;
            await nftEmoji.connect(owner).mint(addr1.address, 100);
            await nftEmoji.connect(addr1).burn(tokenId);
            expect(await nftEmoji.tokenPower(tokenId)).to.equal(0);
        });

        it("Should store and retrieve token power correctly", async function () {
            const tokenId = 1;
            const power = 99;
            await nftEmoji.connect(owner).mint(addr1.address, power);
            expect(await nftEmoji.tokenPower(tokenId)).to.equal(power);

            const tokenId2 = 2;
            const power2 = 150;
            await nftEmoji.connect(owner).mint(addr1.address, power2);
            expect(await nftEmoji.tokenPower(tokenId2)).to.equal(power2);
        });
    });

    /**
     * @dev 测试 ERC721Burnable 功能
     */
    describe("Burning", function () {
        it("Owner of NFT should be able to burn it", async function () {
            const tokenId = 1;
            await nftEmoji.connect(owner).mint(addr1.address, 100);

            // addr1 (owner of NFT) burns the token
            await expect(nftEmoji.connect(addr1).burn(tokenId))
                .to.emit(nftEmoji, "Transfer")
                .withArgs(addr1.address, ethers.ZeroAddress, tokenId);

            await expect(nftEmoji.ownerOf(tokenId)).to.be.revertedWith("ERC721: invalid token ID");
            expect(await nftEmoji.tokenPower(tokenId)).to.equal(0); // Power should ideally be cleared or handled
        });

        it("Non-owner of NFT should not be able to burn it", async function () {
            const tokenId = 1;
            await nftEmoji.connect(owner).mint(addr1.address, 100);

            await expect(
                nftEmoji.connect(addr2).burn(tokenId)
            ).to.be.revertedWith("ERC721: caller is not token owner or approved");
        });

        it("Contract owner (if not NFT owner) cannot burn without approval", async function () {
            const tokenId = 1;
            await nftEmoji.connect(owner).mint(addr1.address, 100); // addr1 owns tokenId 1

            // owner (contract owner) tries to burn addr1's token
            await expect(
                nftEmoji.connect(owner).burn(tokenId)
            ).to.be.revertedWith("ERC721: caller is not token owner or approved");
        });
    });

    /**
     * @dev 测试 Ownable 功能
     */
    describe("Ownable", function () {
        it("Should allow owner to transfer ownership", async function () {
            await nftEmoji.connect(owner).transferOwnership(addr1.address);
            expect(await nftEmoji.owner()).to.equal(addr1.address);
        });

        it("Non-owner should not be able to transfer ownership", async function () {
            await expect(
                nftEmoji.connect(addr1).transferOwnership(addr2.address)
            ).to.be.revertedWithCustomError(nftEmoji, "OwnableUnauthorizedAccount")
                .withArgs(addr1.address);
        });

        it("Should allow new owner to renounce ownership", async function () {
            await nftEmoji.connect(owner).transferOwnership(addr1.address);
            await nftEmoji.connect(addr1).renounceOwnership();
            expect(await nftEmoji.owner()).to.equal(ethers.ZeroAddress);
        });
    });

    /**
     * @dev 测试 approve和transfer功能
     */
    describe("Approval & Transfer", function () {
        it("Should allow approved address to transfer NFT", async function () {
            const tokenId = 1;
            await nftEmoji.connect(owner).mint(owner.address, 100);

            // owner approves addr1
            await nftEmoji.connect(owner).approve(addr1.address, tokenId);

            // addr1 transfers from owner to addr2
            await expect(nftEmoji.connect(addr1).transferFrom(owner.address, addr2.address, tokenId))
                .to.emit(nftEmoji, "Transfer")
                .withArgs(owner.address, addr2.address, tokenId);

            expect(await nftEmoji.ownerOf(tokenId)).to.equal(addr2.address);
        });

        it("Should maintain token power after transfer", async function () {
            const tokenId = 1;
            const power = 150;
            await nftEmoji.connect(owner).mint(owner.address, power);

            // owner approves addr1
            await nftEmoji.connect(owner).approve(addr1.address, tokenId);

            // addr1 transfers from owner to addr2
            await nftEmoji.connect(addr1).transferFrom(owner.address, addr2.address, tokenId);

            expect(await nftEmoji.tokenPower(tokenId)).to.equal(power);
        });
    });
});