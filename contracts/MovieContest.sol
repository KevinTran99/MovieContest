// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract MovieContest {
    error NotOwner(address caller);
    error AlreadyVoted(address, bool);

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

    mapping (address => mapping (string => Contest)) internal contests;
    mapping (address => mapping (string => mapping (address => bool))) internal hasVoted;

    constructor() {
        owner = msg.sender;
    }

    modifier contestExist(address _contestCreator, string memory _contest) {
        require(contests[_contestCreator][_contest].exist, "This contest does not exist");
        _;
    }

    modifier inStatus(address _contestCreator, string memory _contest, VotingStatus _status) {
    require(contests[_contestCreator][_contest].votingStatus == _status, "Invalid voting status, this action cannot be performed!");
    _;
    }

    function addContest(string memory _contestName) external {
        require(!contests[msg.sender][_contestName].exist, "This address have already added a contest with the same name.");

        contests[msg.sender][_contestName].exist = true;
        contests[msg.sender][_contestName].votingStatus = VotingStatus.notStarted;
    }

    function addMovie(address _contestCreator, string memory _contest, string memory _movieTitle) external contestExist(_contestCreator, _contest) inStatus(_contestCreator, _contest, VotingStatus.notStarted) {
        contests[_contestCreator][_contest].movies.push(Movie(_movieTitle, 0));
    }

    function getMovies(address _contestCreator, string memory _contest) external contestExist(_contestCreator, _contest) view returns(Movie[] memory) {
        return contests[_contestCreator][_contest].movies;
    }

    function startContest(address _contestCreator, string memory _contest, uint _duration) external contestExist(_contestCreator, _contest) inStatus(_contestCreator, _contest, VotingStatus.notStarted) {
        if (msg.sender != _contestCreator) {
            revert NotOwner(msg.sender);
        }

        contests[_contestCreator][_contest].deadline = block.timestamp + _duration;
        contests[_contestCreator][_contest].votingStatus = VotingStatus.Ongoing;
    }

    function voteMovie(address _contestCreator, string memory _contest, string memory _movie) external contestExist(_contestCreator, _contest) inStatus(_contestCreator, _contest, VotingStatus.Ongoing) {
        if (hasVoted[_contestCreator][_contest][msg.sender]) {
            revert AlreadyVoted(msg.sender, hasVoted[_contestCreator][_contest][msg.sender]);
        }

        Movie[] storage contestMovies = contests[_contestCreator][_contest].movies;

        for(uint i = 0; i < contestMovies.length; ++i) {
            if (keccak256(bytes(contestMovies[i].title)) == keccak256(bytes(_movie))) {
                contestMovies[i].voteCount += 1;
                hasVoted[_contestCreator][_contest][msg.sender] = true;
                break;
            }
        }

    }
}