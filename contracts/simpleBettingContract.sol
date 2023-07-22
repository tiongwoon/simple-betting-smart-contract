// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract simpleBettingContract {
    //VARIABLES
    //store who bets how much
    mapping(address => uint256) public playersBet;
    //store judge's address
    address public immutable judge;
    //store players' addresses for checking
    address public immutable playerOne;
    address public immutable playerTwo;
    //store minimum bet size to establish prize pool size
    uint256 public immutable minimumBetSize;
    address public winner;

    //EVENTS
    //when a bet has been set
    event BetSet(address indexed player, uint256 indexed betSize);
    //when judge sets the winner
    event WinnerSet(address indexed winner);
    //when prize has been fully withdrawn
    event PrizeWithdrawn();

    //CUSTOM ERRORS
    //illegitimate player
    error IllegitimatePlayer(address wrongPlayer);
    //bet size insufficient
    error BetSizeInsufficient(uint256 betSize);
    //no winner announced yet
    error NoWinnerAnnounced();
    //illegitimate judge
    error IllegitimateJudge(address wrongJudge);

    //FUNCTIONS
    //constructor to define judge, players
    constructor(
        address _judge,
        address _playerOne,
        address _playerTwo,
        uint256 _minimumBetSize
    ) {
        judge = _judge;
        playerOne = _playerOne;
        playerTwo = _playerTwo;
        minimumBetSize = _minimumBetSize;
    }

    //set bets
    function setBet() public payable {
        //sender address must be one of the players
        if (msg.sender != playerOne && msg.sender != playerTwo) {
            revert IllegitimatePlayer(msg.sender);
        }
        //bet must be larger than minimum bet size
        if (msg.value <= minimumBetSize) {
            revert BetSizeInsufficient(msg.value);
        }
        //save bet to mapping
        playersBet[msg.sender] = msg.value;
        //log event
        emit BetSet(msg.sender, msg.value);
    }

    //judge to submit winner - must only happen after both parties put bets in
    function announceWinner(address _winner) public {
        //make sure it is judge that is announcing
        if (msg.sender != judge) {
            revert IllegitimateJudge(msg.sender);
        }
        //check if winner is one of player one and two
        if (_winner != playerOne && _winner != playerTwo) {
            revert IllegitimatePlayer(_winner);
        }
        //set winner
        winner = _winner;
        //log event
        emit WinnerSet(_winner);
    }

    //winner to claim pool prize
    function withdrawPrize() public payable {
        //check if winner has been announced yet
        if (winner == address(0)) {
            revert NoWinnerAnnounced();
        }
        //check if function caller is winner
        if (msg.sender != winner) {
            revert IllegitimatePlayer(msg.sender);
        }
        //empty player-betSize variable
        playersBet[playerOne] = 0;
        playersBet[playerTwo] = 0;
        //withdraw all funds to winner
        (bool success, ) = msg.sender.call{value: address(this).balance}("");
        require(success, "Failed to send Ether");
        //log event
        emit PrizeWithdrawn();
    }
}
