const { expect } = require("chai");

describe("Token contract", function() {
    let DMarketNFTSwap;
    let hardhatDMarketNFTSwap;
    let creator;
    let owner;
    let minter;
    let addr1;
    let addr2;
    let exchanger;
    let addrs;
    const ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";
    const MINT_ROLE = "0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6";
    const tokenPrefix = "https://test.com/"

    // `beforeEach` will run before each test, re-deploying the contract every
    // time. It receives a callback, which can be async.
    beforeEach(async function () {
        // Get the ContractFactory and Signers here.
        DMarketNFTSwap = await ethers.getContractFactory("DMarketNFTToken");
        [creator, owner, minter, addr1, addr2, exchanger, ...addrs] = await ethers.getSigners();

        // To deploy our contract, we just have to call Token.deploy() and await
        // for it to be deployed(), which happens onces its transaction has been
        // mined.
        hardhatDMarketNFTSwap = await DMarketNFTSwap.deploy(owner.address, tokenPrefix);
    });

    describe("Deployment", async function() {
        it("should assign the prefixURI ", async function() {
            const tokenID = 1;
            await hardhatDMarketNFTSwap.mintToken(addr1.address, tokenID);
            const fullURI = await hardhatDMarketNFTSwap.tokenURI(tokenID);
            expect(tokenPrefix+tokenID).equal(fullURI);
        });
        it("should set the owner", async function() {
            expect(owner.address).equal(await hardhatDMarketNFTSwap.owner());
        });
        it("should set the mint_role for creator address", async function() {
            expect(true).equal(await hardhatDMarketNFTSwap.hasRole(MINT_ROLE, creator.address));
        });
        it("owner isn't minter", async function() {
            expect(false).equal(await hardhatDMarketNFTSwap.hasRole(MINT_ROLE, owner.address));
        });
        it("name and symbol", async function () {
            expect("DMarket NFT Swap").equal(await hardhatDMarketNFTSwap.name());
            expect("DM NFT").equal(await hardhatDMarketNFTSwap.symbol());
        });
    });

    describe("Mint", async function () {
        it("creator mintToken to addr1", async function () {
            await hardhatDMarketNFTSwap.mintToken(addr1.address, 1);
            expect(addr1.address).equal(await hardhatDMarketNFTSwap.ownerOf(1));
        });
        it("minter mintToken to addr2", async function () {
            await hardhatDMarketNFTSwap.addMinter(minter.address);
            await hardhatDMarketNFTSwap.connect(minter).mintToken(addr2.address, 2);
            expect(addr2.address).equal(await hardhatDMarketNFTSwap.ownerOf(2));
        });
        it("failed mintToken", async function () {
            let isFailed = false;
            try {
                await hardhatDMarketNFTSwap.connect(addr1).mintToken(addr2.address, 3);
            } catch (e) {
                isFailed = e.toString().includes("MinterAccess: Sender is not a minter")
            }
            expect(true).equal(isFailed)
        });
        it("already minted token", async function() {
            await hardhatDMarketNFTSwap.mintToken(addr1.address, 10);
            let alreadyMinted = false;
            try {
                await hardhatDMarketNFTSwap.mintToken(addr1.address, 10);
            } catch (e) {
                alreadyMinted = e.toString().includes("ERC721: token already minted");
            }
            expect(true).equal(alreadyMinted);
        });
        it("mintTokenBatch", async function () {
            await hardhatDMarketNFTSwap.mintTokenBatch([addr1.address, addr2.address], [101, 102]);
            expect(addr1.address).equal(await hardhatDMarketNFTSwap.ownerOf(101));
            expect(addr2.address).equal(await hardhatDMarketNFTSwap.ownerOf(102));
        });
        it("mintTokenBatch must be the same number of receivers/tokenIDs", async function () {
            const errMsg = "DMarketNFTToken: must be the same number of receivers/tokenIDs";
            try {
                await hardhatDMarketNFTSwap.mintTokenBatch([addr1.address], [101, 102]);
                expect(true).equal(false);
            } catch (e) {
                expect(true).equal(e.toString().includes(errMsg));
            }

            try {
                await hardhatDMarketNFTSwap.mintTokenBatch([addr1.address, addr2.address], [101]);
                expect(true).equal(false);
            } catch (e) {
                expect(true).equal(e.toString().includes(errMsg));
            }
        });
        it("mintTokenBatch token already minted", async function () {
            await hardhatDMarketNFTSwap.mintTokenBatch([addr1.address, addr2.address], [101, 102]);
            const errMsg = "ERC721: token already minted";

            try {
                await hardhatDMarketNFTSwap.mintTokenBatch([addr1.address, addr2.address], [101, 102]);
                expect(true).equal(false);
            } catch (e) {
                expect(true).equal(e.toString().includes(errMsg));
            }

            try {
                await hardhatDMarketNFTSwap.mintTokenBatch([addr1.address, addr2.address], [101, 103]);
                expect(true).equal(false);
            } catch (e) {
                expect(true).equal(e.toString().includes(errMsg));
            }

            try {
                await hardhatDMarketNFTSwap.mintTokenBatch([addr1.address, addr2.address], [201, 201]);
                expect(true).equal(false);
            } catch (e) {
                expect(true).equal(e.toString().includes(errMsg));
            }
        });
    });
    describe("Burn", async function () {
        it("token owner burn asset", async function () {
            const errMsg = "ERC721: owner query for nonexistent token";
            await hardhatDMarketNFTSwap.mintToken(addr1.address, 1);
            expect(addr1.address).equal(await hardhatDMarketNFTSwap.ownerOf(1));
            await hardhatDMarketNFTSwap.connect(addr1).burn(1);
            try {
                await hardhatDMarketNFTSwap.ownerOf(1);
                expect(true).equal(false);
            } catch (e) {
                expect(true).equal(e.toString().includes(errMsg));
            }
        });
        it("burn nonexistent token", async function () {
            const errMsg = "ERC721: operator query for nonexistent token";
            try {
                await hardhatDMarketNFTSwap.burn(1);
                expect(true).equal(false);
            } catch (e) {
                expect(true).equal(e.toString().includes(errMsg));
            }
        });
        it("failed for creator", async function () {
            await hardhatDMarketNFTSwap.addMinter(minter.address);
            await hardhatDMarketNFTSwap.connect(minter).mintToken(addr1.address, 1);

            const errMsg = "DMarketNFTToken: caller is not owner nor approved";
            try {
                await hardhatDMarketNFTSwap.burn(1);
                expect(true).equal(false);
            } catch (e) {
                expect(true).equal(e.toString().includes(errMsg));
            }
        });
        it("failed for minter", async function () {
            await hardhatDMarketNFTSwap.addMinter(minter.address);
            await hardhatDMarketNFTSwap.connect(minter).mintToken(addr1.address, 1);

            const errMsg = "DMarketNFTToken: caller is not owner nor approved";
            try {
                await hardhatDMarketNFTSwap.connect(minter).burn(1);
                expect(true).equal(false);
            } catch (e) {
                expect(true).equal(e.toString().includes(errMsg));
            }
        });
        it("failed for owner", async function () {
            await hardhatDMarketNFTSwap.addMinter(minter.address);
            await hardhatDMarketNFTSwap.connect(minter).mintToken(addr1.address, 1);

            const errMsg = "DMarketNFTToken: caller is not owner nor approved";
            try {
                await hardhatDMarketNFTSwap.connect(owner).burn(1);
                expect(true).equal(false);
            } catch (e) {
                expect(true).equal(e.toString().includes(errMsg));
            }
        });
    });
    describe("Roles", async function () {
        it("admin add Minter", async function (){
            await hardhatDMarketNFTSwap.addMinter(minter.address);
            expect(true).equal(await hardhatDMarketNFTSwap.hasRole(MINT_ROLE, minter.address));
        });
        it("revokeMinter role", async function (){
            await hardhatDMarketNFTSwap.addMinter(minter.address);
            expect(true).equal(await hardhatDMarketNFTSwap.hasRole(MINT_ROLE, minter.address));
            await hardhatDMarketNFTSwap.revokeMinter(minter.address);
            expect(false).equal(await hardhatDMarketNFTSwap.hasRole(MINT_ROLE, minter.address));
        });
        it("renounceMinter role", async function () {
            await hardhatDMarketNFTSwap.addMinter(addr2.address);
            expect(true).equal(await hardhatDMarketNFTSwap.hasRole(MINT_ROLE, addr2.address));
            await hardhatDMarketNFTSwap.connect(addr2).renounceMinter(addr2.address);
            expect(false).equal(await hardhatDMarketNFTSwap.hasRole(MINT_ROLE, minter.address));
        });
        it("renounceMinter role by owner", async function () {
            const errMsg = "AccessControl: can only renounce roles for self";
            await hardhatDMarketNFTSwap.addMinter(addr2.address);
            expect(true).equal(await hardhatDMarketNFTSwap.hasRole(MINT_ROLE, addr2.address));
            try {
                await hardhatDMarketNFTSwap.connect(owner).renounceMinter(addr2.address);
                expect(true).equal(false);
            } catch (e) {
                expect(true).equal(e.toString().includes(errMsg));
            }
        });
        it("try addMinter without ADMIN_ROLE", async function () {
            await hardhatDMarketNFTSwap.renounceRole(ADMIN_ROLE, creator.address);
            try {
                await hardhatDMarketNFTSwap.addMinter(minter.address);
                expect(true).equal(false);
            } catch (e) {
                expect(true).equal(e.toString().includes("AccessControl: sender must be an admin to grant"))
            }
        });
        it("admin revoke admin", async function() {
            await hardhatDMarketNFTSwap.revokeRole(ADMIN_ROLE, owner.address);
            try {
                await hardhatDMarketNFTSwap.connect(owner).addMinter(minter.address);
                expect(true).equal(false);
            } catch (e) {
                expect(true).equal(e.toString().includes("AccessControl: sender must be an admin to grant"))
            }
        });
        it("remove all admin", async function () {
            await hardhatDMarketNFTSwap.revokeRole(ADMIN_ROLE, owner.address);
            await hardhatDMarketNFTSwap.revokeRole(ADMIN_ROLE, creator.address);
            expect(false).equal(await hardhatDMarketNFTSwap.hasRole(ADMIN_ROLE, owner.address))
            expect(false).equal(await hardhatDMarketNFTSwap.hasRole(ADMIN_ROLE, creator.address))
            try {
                await hardhatDMarketNFTSwap.connect(owner).grantRole(ADMIN_ROLE, owner.address);
                expect(false).equal(true);
            } catch (e) {
                expect(true).equal(e.toString().includes("AccessControl: sender must be an admin to grant"))
            }
        });
    });

    describe("Transfers", async function (){
        it("transferFrom", async function () {
            await hardhatDMarketNFTSwap.mintToken(addr1.address, 11);
            expect(addr1.address).equal(await hardhatDMarketNFTSwap.ownerOf(11));
            await hardhatDMarketNFTSwap.connect(addr1).transferFrom(addr1.address, addr2.address, 11);
            expect(addr2.address).equal(await hardhatDMarketNFTSwap.ownerOf(11));
        });
        it("transferFrom nonexistent token", async function () {
            const errMsg = "ERC721: operator query for nonexistent token";
            try {
                await hardhatDMarketNFTSwap.connect(addr1).transferFrom(addr1.address, addr2.address, 11);
                expect(true).equal(false);
            } catch (e) {
                expect(true).equal(e.toString().includes(errMsg));
            }
        });
        it("safeTransferFrom without bytes ", async function () {
            await hardhatDMarketNFTSwap.mintToken(addr1.address, 11);
            expect(addr1.address).equal(await hardhatDMarketNFTSwap.ownerOf(11));

            const contract = await hardhatDMarketNFTSwap.connect(addr1);
            await contract['safeTransferFrom(address,address,uint256)'](addr1.address, addr2.address, 11);

            expect(addr2.address).equal(await hardhatDMarketNFTSwap.ownerOf(11));
        });
        it("safeTransferFrom without bytes nonexistent token", async function () {
            const errMsg = "ERC721: operator query for nonexistent token";
            try {
                const contract = await hardhatDMarketNFTSwap.connect(addr1);
                await contract['safeTransferFrom(address,address,uint256)'](addr1.address, addr2.address, 11);
                expect(true).equal(false);
            } catch (e) {
                expect(true).equal(e.toString().includes(errMsg));
            }
        });
        it("safeTransferFrom with bytes", async function () {
            await hardhatDMarketNFTSwap.mintToken(addr1.address, 11);
            expect(addr1.address).equal(await hardhatDMarketNFTSwap.ownerOf(11));

            const contract = await hardhatDMarketNFTSwap.connect(addr1);
            await contract['safeTransferFrom(address,address,uint256,bytes)'](addr1.address, addr2.address, 11, [0, 1]);

            expect(addr2.address).equal(await hardhatDMarketNFTSwap.ownerOf(11));
        });
        it("safeTransferFrom with bytes nonexistent token", async function () {
            const errMsg = "ERC721: operator query for nonexistent token";
            try {
                const contract = await hardhatDMarketNFTSwap.connect(addr1);
                await contract['safeTransferFrom(address,address,uint256,bytes)'](addr1.address, addr2.address, 11, []);
                expect(true).equal(false);
            } catch (e) {
                expect(true).equal(e.toString().includes(errMsg));
            }
        });
    });
    describe("Approve", async function () {
        it("positive case", async function () {
            await hardhatDMarketNFTSwap.mintToken(addr1.address, 1);
            await hardhatDMarketNFTSwap.connect(addr1).approve(addr2.address, 1);
            await hardhatDMarketNFTSwap.connect(addr2).transferFrom(addr1.address, addr2.address, 1);
            expect(addr2.address).equal(await hardhatDMarketNFTSwap.ownerOf(1));
        });
        it("try not owner token set opprove", async function () {
            await hardhatDMarketNFTSwap.mintToken(addr1.address, 1);
            try {
                await hardhatDMarketNFTSwap.approve(addr2.address, 1);
                expect(true).equal(false);
            } catch (e) {
                expect(true).equal(e.toString().includes("ERC721: approve caller is not owner nor approved for all"));
            }
        });
        it("set approval for all", async function () {
            await hardhatDMarketNFTSwap.connect(addr1).setApprovalForAll(exchanger.address, true);
            await hardhatDMarketNFTSwap.mintToken(addr1.address, 1);
            await hardhatDMarketNFTSwap.connect(exchanger).transferFrom(addr1.address, addr2.address, 1);
            expect(addr2.address).equal(await hardhatDMarketNFTSwap.ownerOf(1));
        });
        it("try after set approval for all", async function () {
            await hardhatDMarketNFTSwap.connect(addr1).setApprovalForAll(addr2.address, true);
            await hardhatDMarketNFTSwap.mintToken(addr1.address, 1);
            try {
                await hardhatDMarketNFTSwap.approve(addr2.address, 1);
                expect(true).equal(false);
            } catch (e) {
                expect(true).equal(e.toString().includes("ERC721: approve caller is not owner nor approved for all"));
            }
        });
        it("try to transferFrom second time without approve", async function () {
            await hardhatDMarketNFTSwap.mintToken(addr1.address, 1);
            await hardhatDMarketNFTSwap.connect(addr1).approve(addr2.address, 1);
            await hardhatDMarketNFTSwap.connect(addr2).transferFrom(addr1.address, addr2.address, 1);
            await hardhatDMarketNFTSwap.connect(addr2).transferFrom(addr2.address, addr1.address, 1);
            try {
                await hardhatDMarketNFTSwap.connect(addr2).transferFrom(addr1.address, addr2.address, 1);
                expect(true).equal(false);
            } catch (e) {
                expect(true).equal(e.toString().includes("ERC721: transfer caller is not owner nor approved"));
            }
        });
    });
    describe("Ownership", async function () {
        it("transferOwnership by owner", async function () {
            await hardhatDMarketNFTSwap.connect(owner).transferOwnership(minter.address);
            expect(minter.address).equal(await hardhatDMarketNFTSwap.owner());
        });
        it("transferOwnership by creator", async function () {
            try {
                await hardhatDMarketNFTSwap.transferOwnership(minter.address);
                expect(true).equal(false);
            } catch (e) {
                expect(true).equal(e.toString().includes("Ownable: caller is not the owner"));
            }
        });
        it("transferOwnership after renounceOwnership", async function () {
            await hardhatDMarketNFTSwap.connect(owner).renounceOwnership();
            try {
                await hardhatDMarketNFTSwap.connect(owner).transferOwnership(owner.address);
                expect(true).equal(false);
            } catch (e) {
                expect(true).equal(e.toString().includes("Ownable: caller is not the owner"));
            }
        });
        it("bad renounceOwnership", async function () {
            try {
                await hardhatDMarketNFTSwap.renounceOwnership();
                expect(true).equal(false);
            } catch (e) {
                expect(true).equal(e.toString().includes("Ownable: caller is not the owner"));
            }
        });
    });
});
