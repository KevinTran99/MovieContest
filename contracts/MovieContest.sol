// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract MovieContest {
    struct Movie {
        string title;
        uint voteCount;
    }

    struct Contest {
        Movie[] movies;
        uint deadline;
        string winner;
        bool exist;
    }

    address internal owner;

    mapping (address => mapping (string => Contest)) internal contest;

    constructor() {
        owner = msg.sender;
    }

}