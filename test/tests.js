const { expect, assert } = require("chai");
const hre = require("hardhat");


describe("simpleBettingContract", function () {
    //Deploy contract to init players and judge

    let minimumBetSize = hre.ethers.parseEther("0.1");

    let bet;

    beforeEach(async function () {
        //Using the contract address of local Hardhat accounts
        bet = await ethers.deployContract("simpleBettingContract", ["0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", minimumBetSize])
    })

    it("should allow only player to place bets", async function () {
        const accounts = await ethers.getSigners();
        //illegitimate player should not be allowed to place bets
        expect(bet.connect(accounts[6]).setBet()).to.be.revertedWithCustomError(bet, "IllegitimatePlayer");
        //Negating this to demonstrate problem with script
        expect(bet.connect(accounts[6]).setBet()).to.not.be.revertedWithCustomError(bet, "IllegitimatePlayer");
        //player should be allowed to place bets 
        expect(bet.connect(accounts[2]).setBet({ value: ethers.parseEther('0.01') })).to.be.revertedWithCustomError(bet, "BetSizeInsufficient");
    })

    it("should allow prize withdrawal only after judge announce winner", async function () {
        const accounts = await ethers.getSigners();
        //player set bet
        bet.connect(accounts[1]).setBet({ value: ethers.parseEther('0.5') });
        bet.connect(accounts[2]).setBet({ value: ethers.parseEther('0.5') });
        //player try to withdraw
        expect(bet.connect(accounts[1]).withdrawPrize()).to.be.reverted;
        //judge set winner
        bet.connect(accounts[0]).announceWinner("0x70997970C51812dc3A010C7d01b50e0d17dc79C8");
        //player try to withdraw
        expect(bet.connect(accounts[1]).withdrawPrize()).to.not.be.reverted;
    })
});