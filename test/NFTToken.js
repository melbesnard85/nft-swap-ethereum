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
        [creator, owner, addr1, addr2, ...addrs] = await ethers.getSigners();

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
        it("should set the mint to creator address", async function() {
            expect(true).to.equal(await hardhatDMarketNFTSwap.hasRole(MINT_ROLE, creator.address));
        });
        it("owner isn't minter", async function() {
            expect(false).to.equal(await hardhatDMarketNFTSwap.hasRole(MINT_ROLE, owner.address));
        });
    });
});
