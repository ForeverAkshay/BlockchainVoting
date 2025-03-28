// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

contract VotingSystem {
    struct Election {
        uint256 id;
        string title;
        string description;
        uint256 startTime;
        uint256 endTime;
        address creator;
        bool isPublic;
        mapping(uint256 => Candidate) candidates;
        uint256 candidateCount;
        mapping(address => bool) hasVoted;
        mapping(address => bool) registeredVoters;
        uint256 totalVotes;
        bool initialized;
    }

    struct Candidate {
        uint256 id;
        string name;
        string description;
        uint256 voteCount;
    }

    struct ElectionSummary {
        uint256 id;
        string title;
        string description;
        uint256 startTime;
        uint256 endTime;
        address creator;
        bool isPublic;
        uint256 candidateCount;
        uint256 totalVotes;
        bool initialized;
    }

    struct CandidateView {
        uint256 id;
        string name;
        string description;
        uint256 voteCount;
    }

    // State variables
    mapping(uint256 => Election) public elections;
    uint256 public electionCount;
    address public owner;

    // Events
    event ElectionCreated(uint256 indexed electionId, address indexed creator);
    event VoterRegistered(uint256 indexed electionId, address indexed voter);
    event Voted(uint256 indexed electionId, address indexed voter, uint256 indexed candidateId);
    event ElectionEnded(uint256 indexed electionId);

    constructor() {
        owner = msg.sender;
        electionCount = 0;
    }

    // Create a new election
    function createElection(
        string memory _title,
        string memory _description,
        uint256 _startTime,
        uint256 _endTime,
        bool _isPublic,
        string[] memory _candidateNames,
        string[] memory _candidateDescriptions
    ) public returns (uint256) {
        require(_endTime > _startTime, "End time must be after start time");
        require(_candidateNames.length > 1, "At least two candidates required");
        require(_candidateNames.length == _candidateDescriptions.length, "Candidate descriptions mismatch");

        uint256 electionId = electionCount;
        electionCount++;

        Election storage newElection = elections[electionId];
        newElection.id = electionId;
        newElection.title = _title;
        newElection.description = _description;
        newElection.startTime = _startTime;
        newElection.endTime = _endTime;
        newElection.creator = msg.sender;
        newElection.isPublic = _isPublic;
        newElection.candidateCount = 0;
        newElection.totalVotes = 0;
        newElection.initialized = true;

        // Add candidates
        for (uint i = 0; i < _candidateNames.length; i++) {
            newElection.candidates[i] = Candidate({
                id: i,
                name: _candidateNames[i],
                description: _candidateDescriptions[i],
                voteCount: 0
            });
            newElection.candidateCount++;
        }

        emit ElectionCreated(electionId, msg.sender);
        return electionId;
    }

    // Register a voter for a private election
    function registerVoter(uint256 _electionId, address _voter) public {
        Election storage election = elections[_electionId];
        require(election.initialized, "Election does not exist");
        require(!election.isPublic, "Election is public, no registration needed");
        require(msg.sender == election.creator || msg.sender == owner, "Only creator or owner can register voters");
        
        election.registeredVoters[_voter] = true;
        emit VoterRegistered(_electionId, _voter);
    }

    // Register multiple voters at once
    function registerVoters(uint256 _electionId, address[] memory _voters) public {
        for (uint i = 0; i < _voters.length; i++) {
            registerVoter(_electionId, _voters[i]);
        }
    }

    // Vote in an election
    function vote(uint256 _electionId, uint256 _candidateId) public {
        Election storage election = elections[_electionId];
        
        require(election.initialized, "Election does not exist");
        require(block.timestamp >= election.startTime, "Election has not started yet");
        require(block.timestamp <= election.endTime, "Election has ended");
        require(!election.hasVoted[msg.sender], "You have already voted");
        require(_candidateId < election.candidateCount, "Invalid candidate");
        
        if (!election.isPublic) {
            require(election.registeredVoters[msg.sender], "You are not registered to vote");
        }
        
        election.hasVoted[msg.sender] = true;
        election.candidates[_candidateId].voteCount++;
        election.totalVotes++;
        
        emit Voted(_electionId, msg.sender, _candidateId);
    }

    // Check if a voter has voted
    function hasVoted(uint256 _electionId, address _voter) public view returns (bool) {
        return elections[_electionId].hasVoted[_voter];
    }

    // Get election summary
    function getElectionSummary(uint256 _electionId) public view returns (ElectionSummary memory) {
        Election storage election = elections[_electionId];
        require(election.initialized, "Election does not exist");
        
        return ElectionSummary({
            id: election.id,
            title: election.title,
            description: election.description,
            startTime: election.startTime,
            endTime: election.endTime,
            creator: election.creator,
            isPublic: election.isPublic,
            candidateCount: election.candidateCount,
            totalVotes: election.totalVotes,
            initialized: election.initialized
        });
    }

    // Get candidate information
    function getCandidate(uint256 _electionId, uint256 _candidateId) public view returns (CandidateView memory) {
        Election storage election = elections[_electionId];
        require(election.initialized, "Election does not exist");
        require(_candidateId < election.candidateCount, "Invalid candidate");
        
        Candidate storage candidate = election.candidates[_candidateId];
        return CandidateView({
            id: candidate.id,
            name: candidate.name,
            description: candidate.description,
            voteCount: candidate.voteCount
        });
    }

    // Get all candidates for an election
    function getAllCandidates(uint256 _electionId) public view returns (CandidateView[] memory) {
        Election storage election = elections[_electionId];
        require(election.initialized, "Election does not exist");
        
        CandidateView[] memory candidates = new CandidateView[](election.candidateCount);
        
        for (uint256 i = 0; i < election.candidateCount; i++) {
            Candidate storage candidate = election.candidates[i];
            candidates[i] = CandidateView({
                id: candidate.id,
                name: candidate.name,
                description: candidate.description,
                voteCount: candidate.voteCount
            });
        }
        
        return candidates;
    }

    // Get all election IDs
    function getAllElectionIds() public view returns (uint256[] memory) {
        uint256[] memory ids = new uint256[](electionCount);
        
        for (uint256 i = 0; i < electionCount; i++) {
            if (elections[i].initialized) {
                ids[i] = i;
            }
        }
        
        return ids;
    }

    // Check if voter is registered for private election
    function isVoterRegistered(uint256 _electionId, address _voter) public view returns (bool) {
        Election storage election = elections[_electionId];
        require(election.initialized, "Election does not exist");
        
        if (election.isPublic) {
            return true;
        }
        
        return election.registeredVoters[_voter];
    }
}
