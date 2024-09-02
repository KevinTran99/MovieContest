// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract MovieContest {
    error NotOwner(address caller);
    error AlreadyVoted(address, bool);

    enum ContestStatus { notStarted, Ongoing, Finished }

    struct Movie {
        string title;
        uint voteCount;
    }

    struct Contest {
        Movie[] movies;
        uint deadline;
        string winner;
        bool exist;
        ContestStatus contestStatus;
    }

    address internal owner;

    mapping (address => mapping (string => Contest)) internal contests;
    mapping (address => mapping (string => mapping (address => bool))) internal hasVoted;
    mapping (address => mapping (string => mapping (string => bool))) contestMovies;


    constructor() {
        owner = msg.sender;
    }

    event ContestStarted(address indexed contestCreator, string contest);
    event ContestEnded(address indexed contestCreator, string contest, string winner);

    modifier contestExist(address _contestCreator, string memory _contest) {
        require(contests[_contestCreator][_contest].exist, "This contest does not exist");
        _;
    }

    modifier inStatus(address _contestCreator, string memory _contest, ContestStatus _status) {
        require(contests[_contestCreator][_contest].contestStatus == _status, "Invalid contest status, this action cannot be performed!");
        _;
    }

    modifier movieExist(address _contestCreator, string memory _contest, string memory _movieTitle) {
        require(contestMovies[_contestCreator][_contest][_movieTitle], "This movie title does not exist in this contest.");
        _;
    }

    fallback() external {
        revert("Fallback function. Call a function that exists.");
    }

    receive() external payable {
        revert("This contract does not accept payments.");
    }

    function addContest(string memory _contestName) external {
        require(!contests[msg.sender][_contestName].exist, "This address have already added a contest with the same name.");

        contests[msg.sender][_contestName].exist = true;
        contests[msg.sender][_contestName].contestStatus = ContestStatus.notStarted;
    }

    function addMovie(address _contestCreator, string memory _contest, string memory _movieTitle) external contestExist(_contestCreator, _contest) inStatus(_contestCreator, _contest, ContestStatus.notStarted) {
        contests[_contestCreator][_contest].movies.push(Movie(_movieTitle, 0));
        contestMovies[_contestCreator][_contest][_movieTitle] = true;
    }

    function getMovies(address _contestCreator, string memory _contest) external contestExist(_contestCreator, _contest) view returns(Movie[] memory) {
        return contests[_contestCreator][_contest].movies;
    }

    function startContest(address _contestCreator, string memory _contest, uint _duration) external contestExist(_contestCreator, _contest) inStatus(_contestCreator, _contest, ContestStatus.notStarted) {
        if (msg.sender != _contestCreator) {
            revert NotOwner(msg.sender);
        }

        if (contests[_contestCreator][_contest].movies.length < 2) {
            revert ("This contest needs at least two movies to start.");
        }

        contests[_contestCreator][_contest].deadline = block.timestamp + _duration;
        contests[_contestCreator][_contest].contestStatus = ContestStatus.Ongoing;

        emit ContestStarted(_contestCreator, _contest);
    }

    function voteMovie(address _contestCreator, string memory _contest, string memory _movieTitle) external contestExist(_contestCreator, _contest) movieExist(_contestCreator, _contest, _movieTitle) inStatus(_contestCreator, _contest, ContestStatus.Ongoing) {
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

    function endContest(address _contestCreator, string memory _contest) external contestExist(_contestCreator, _contest) inStatus(_contestCreator, _contest, ContestStatus.Ongoing) {
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
        contests[_contestCreator][_contest].contestStatus = ContestStatus.Finished;

        assert(contests[_contestCreator][_contest].contestStatus == ContestStatus.Finished);

        emit ContestEnded(_contestCreator, _contest, _winnerTitle);
    }

    function getWinner(address _contestCreator, string memory _contest) external contestExist(_contestCreator, _contest) inStatus(_contestCreator, _contest, ContestStatus.Finished) view returns(string memory) {
        return contests[_contestCreator][_contest].winner;
    }
}