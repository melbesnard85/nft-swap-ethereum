const { expect } = require("chai");

describe("Token contract", function() {
    let DMarketNFTSwap;
    let hardhatDMarketNFTSwap;
    let creator;
    let owner;
    let minter;
    let addr1;
    let addr2;
    let addrs;
    const ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";
    const MINT_ROLE = "0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6";
    const tokenPrefix = "https://test.com/"

    // `beforeEach` will run before each test, re-deploying the contract every
    // time. It receives a callback, which can be async.
    beforeEach(async function () {
        // Get the ContractFactory and Signers here.
        DMarketNFTSwap = await ethers.getContractFactory("DMarketNFTToken");
        [creator, owner, minter, addr1, addr2, ...addrs] = await ethers.getSigners();

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
            expect(tokenPrefix+tokenID).to.equal(fullURI);
        });
        it("should set the owner", async function() {
            expect(owner.address).to.equal(await hardhatDMarketNFTSwap.owner());
        });
        it("should set the mint_role for creator address", async function() {
            expect(true).to.equal(await hardhatDMarketNFTSwap.hasRole(MINT_ROLE, creator.address));
        });
        it("owner isn't minter", async function() {
            expect(false).to.equal(await hardhatDMarketNFTSwap.hasRole(MINT_ROLE, owner.address));
        });
    });

    describe("Mint", async function () {
        it("owner add Minter", async function (){
            await hardhatDMarketNFTSwap.addMinter(minter.address);
            expect(true).to.equal(await hardhatDMarketNFTSwap.hasRole(MINT_ROLE, minter.address));
        });
        it("revokeMinter role", async function (){
            await hardhatDMarketNFTSwap.addMinter(minter.address);
            expect(true).to.equal(await hardhatDMarketNFTSwap.hasRole(MINT_ROLE, minter.address));
            await hardhatDMarketNFTSwap.revokeMinter(minter.address)
            expect(false).to.equal(await hardhatDMarketNFTSwap.hasRole(MINT_ROLE, minter.address));
        });
        it("renounceMinter role", async function () {
            await hardhatDMarketNFTSwap.addMinter(addr2.address);
            expect(true).to.equal(await hardhatDMarketNFTSwap.hasRole(MINT_ROLE, addr2.address));
            await hardhatDMarketNFTSwap.connect(addr2).renounceMinter(addr2.address);
            expect(false).to.equal(await hardhatDMarketNFTSwap.hasRole(MINT_ROLE, minter.address));
        });
        it("renounceMinter role by owner", async function () {
            await hardhatDMarketNFTSwap.addMinter(addr2.address);
            expect(true).to.equal(await hardhatDMarketNFTSwap.hasRole(MINT_ROLE, addr2.address));
            let getError = false;
            try {
                await hardhatDMarketNFTSwap.connect(owner).renounceMinter(addr2.address);
            } catch (e) {
                getError = e.toString().includes("AccessControl: can only renounce roles for self");
            }
            expect(true).to.equal(getError);
        });
        it("creator mintToken to addr1", async function () {
            await hardhatDMarketNFTSwap.mintToken(addr1.address, 1);
            expect(addr1.address).to.equal(await hardhatDMarketNFTSwap.ownerOf(1));
        });
        it("minter mintToken to addr2", async function () {
            await hardhatDMarketNFTSwap.addMinter(minter.address);
            await hardhatDMarketNFTSwap.connect(minter).mintToken(addr2.address, 2);
            expect(addr2.address).to.equal(await hardhatDMarketNFTSwap.ownerOf(2));
        });
        it("failed mintToken", async function () {
            let isFailed = false;
            try {
                await hardhatDMarketNFTSwap.connect(addr1).mintToken(addr2.address, 3);
            } catch (e) {
                isFailed = e.toString().includes("MinterAccess: Sender is not a minter")
            }
            expect(true).to.equal(isFailed)
        });
        it("already minted token", async function() {
            await hardhatDMarketNFTSwap.mintToken(addr1.address, 10);
            let alreadyMinted = false;
            try {
                await hardhatDMarketNFTSwap.mintToken(addr1.address, 10);
            } catch (e) {
                alreadyMinted = e.toString().includes("ERC721: token already minted");
            }
            expect(true).to.equal(alreadyMinted);
        });
    });
});
