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
    mapping (address => mapping (string => mapping (string => bool))) contestMovies;


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

    modifier movieExist(address _contestCreator, string memory _contest, string memory _movieTitle) {
        require(contestMovies[_contestCreator][_contest][_movieTitle], "This movie title does not exist in this contest.");
        _;
    }

    function addContest(string memory _contestName) external {
        require(!contests[msg.sender][_contestName].exist, "This address have already added a contest with the same name.");

        contests[msg.sender][_contestName].exist = true;
        contests[msg.sender][_contestName].votingStatus = VotingStatus.notStarted;
    }

    function addMovie(address _contestCreator, string memory _contest, string memory _movieTitle) external contestExist(_contestCreator, _contest) inStatus(_contestCreator, _contest, VotingStatus.notStarted) {
        contests[_contestCreator][_contest].movies.push(Movie(_movieTitle, 0));
        contestMovies[_contestCreator][_contest][_movieTitle] = true;
    }

    function getMovies(address _contestCreator, string memory _contest) external contestExist(_contestCreator, _contest) view returns(Movie[] memory) {
        return contests[_contestCreator][_contest].movies;
    }

    function startContest(address _contestCreator, string memory _contest, uint _duration) external contestExist(_contestCreator, _contest) inStatus(_contestCreator, _contest, VotingStatus.notStarted) {
        if (msg.sender != _contestCreator) {
            revert NotOwner(msg.sender);
        }

        if (contests[_contestCreator][_contest].movies.length < 2) {
            revert ("This contest needs at least two movies to start.");
        }

        contests[_contestCreator][_contest].deadline = block.timestamp + _duration;
        contests[_contestCreator][_contest].votingStatus = VotingStatus.Ongoing;
    }

    function voteMovie(address _contestCreator, string memory _contest, string memory _movieTitle) external contestExist(_contestCreator, _contest) movieExist(_contestCreator, _contest, _movieTitle) inStatus(_contestCreator, _contest, VotingStatus.Ongoing) {
        if (hasVoted[_contestCreator][_contest][msg.sender]) {
            revert AlreadyVoted(msg.sender, hasVoted[_contestCreator][_contest][msg.sender]);
        }

        if (block.timestamp >= contests[_contestCreator][_contest].deadline) {
            revert("Voting period has ended");
        }

        Movie[] storage movies = contests[_contestCreator][_contest].movies;

        for(uint i = 0; i < movies.length; ++i) {
            if (keccak256(bytes(movies[i].title)) == keccak256(bytes(_movieTitle))) {
                movies[i].voteCount += 1;
                hasVoted[_contestCreator][_contest][msg.sender] = true;
                break;
            }
        }
    }

    function endContest(address _contestCreator, string memory _contest) external contestExist(_contestCreator, _contest) inStatus(_contestCreator, _contest, VotingStatus.Ongoing) {
        if (msg.sender != _contestCreator) {
            revert NotOwner(msg.sender);
        }

        if(block.timestamp < contests[_contestCreator][_contest].deadline) {
            revert ("The deadline for this contest have not passed yet.");
        }

        string memory _winnerTitle;
        uint highestVoteCount;
        bool tie;

        Movie[] storage movies = contests[_contestCreator][_contest].movies;

        for(uint i = 0; i < movies.length; ++i) {
            if (movies[i].voteCount > highestVoteCount) {
                highestVoteCount = movies[i].voteCount;
                _winnerTitle = movies[i].title;
                tie = false;
            } else if (movies[i].voteCount == highestVoteCount) {
                tie = true;
            }
        }

        if (tie) {
            _winnerTitle = "The result was a tie";
        }

        contests[_contestCreator][_contest].winner = _winnerTitle;
        contests[_contestCreator][_contest].votingStatus = VotingStatus.Finished;
    }

    function getWinner(address _contestCreator, string memory _contest) external contestExist(_contestCreator, _contest) inStatus(_contestCreator, _contest, VotingStatus.Finished) view returns(string memory) {
        return contests[_contestCreator][_contest].winner;
    }
}