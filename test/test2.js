const { expect } = require("chai");
const hre = require("hardhat");

describe("simpleBettingContract", function () {
    let contract;
    let owner;
    let playerOne;
    let playerTwo;
    let judge;
    const minimumBetSize = ethers.parseEther("0.1");

    beforeEach(async () => {
        // Deploy the smart contract before each test
        //const BettingContract = await ethers.getContractFactory("simpleBettingContract");
        [owner, playerOne, playerTwo, judge] = await ethers.getSigners();

        contract = await ethers.deployContract("simpleBettingContract", [judge.address, playerOne.address, playerTwo.address, minimumBetSize]);
        await contract.waitForDeployment();
    });

    it("should set bets correctly", async function () {
        // Set a bet for playerOne
        const betSize = ethers.parseEther("0.2");
        await contract.connect(playerOne).setBet({ value: betSize });

        // Check if playerOne's bet was recorded correctly
        const playerOneBet = await contract.playersBet(playerOne.address);
        expect(playerOneBet).to.equal(betSize);
    });

    it("should announce the winner correctly", async function () {
        // Set bets for both players
        const betSizePlayerOne = ethers.parseEther("0.2");
        const betSizePlayerTwo = ethers.parseEther("0.3");
        await contract.connect(playerOne).setBet({ value: betSizePlayerOne });
        await contract.connect(playerTwo).setBet({ value: betSizePlayerTwo });

        // Announce the winner by the judge
        await contract.connect(judge).announceWinner(playerOne.address);

        // Check if the winner was recorded correctly
        const winner = await contract.winner();
        expect(winner).to.equal(playerOne.address);
    });

    it("should allow the winner to withdraw the prize", async function () {
        // Set bets for both players
        const betSizePlayerOne = ethers.parseEther("0.2");
        const betSizePlayerTwo = ethers.parseEther("0.3");
        await contract.connect(playerOne).setBet({ value: betSizePlayerOne });
        await contract.connect(playerTwo).setBet({ value: betSizePlayerTwo });

        // Announce the winner by the judge
        await contract.connect(judge).announceWinner(playerOne.address);

        // Withdraw the prize by the winner
        const initialBalance = await ethers.provider.getBalance(playerOne.address);
        const WP = await contract.connect(playerOne).withdrawPrize();
        // Obtain gas fees used to factor in calculation, see next section
        const receipt = await WP.wait();
        const gasUsedFee = receipt.gasUsed * receipt.gasPrice;
        const finalBalance = await ethers.provider.getBalance(playerOne.address);

        // Check if the winner's balance increased by the prize amount
        const expectedBalanceIncrease = betSizePlayerOne + betSizePlayerTwo;
        const winnerAddressBalanceChange = finalBalance - initialBalance + gasUsedFee;
        expect(winnerAddressBalanceChange).to.equal(expectedBalanceIncrease);
    });

    // Add more test cases for different scenarios as needed

});
