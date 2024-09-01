// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract MovieContest {
    enum VotingStatus { notStarted, Ongoing, Finished }

    struct Movie {
        string title;
        uint voteCount;
    }

    struct Contest {
        Movie[] movies;
        uint deadline;
        string winner;
        bool exist;
        VotingStatus votingStatus;
    }

    address internal owner;

    mapping (address => mapping (string => Contest)) internal contest;

    constructor() {
        owner = msg.sender;
    }

    modifier contestExist(address _contestCreator, string memory _contest) {
        require(contest[_contestCreator][_contest].exist, "This contest does not exist");
        _;
    }

    modifier inStatus(address _contestCreator, string memory _contest, VotingStatus _status) {
    require(contest[_contestCreator][_contest].votingStatus == _status, "Invalid voting status, this action cannot be performed!");
    _;
    }

    function addContest(string memory _contestName) external {
        require(!contest[msg.sender][_contestName].exist, "This address have already added a contest with the same name.");

        contest[msg.sender][_contestName].exist = true;
        contest[msg.sender][_contestName].votingStatus = VotingStatus.notStarted;
    }

    function addMovie(address _contestCreator, string memory _contest, string memory _movieTitle) external contestExist(_contestCreator, _contest) inStatus(_contestCreator, _contest, VotingStatus.notStarted)  {
        contest[_contestCreator][_contest].movies.push(Movie(_movieTitle, 0));
    }

    function getMovies(address _contestCreator, string memory _contest) external contestExist(_contestCreator, _contest) view returns(Movie[] memory) {
        return contest[_contestCreator][_contest].movies;
    }
}