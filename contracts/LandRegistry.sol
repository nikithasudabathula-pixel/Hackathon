// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract LandRegistry {

    struct Land {
        uint256 landId;
        address owner;
        bytes32 documentHash;
        string Datahavenid;
        uint256 timestamp;
        bool disputed;
        bool exists;
        address disputeRaiser; 
    }
    
    address govtowner;
    mapping(uint256 => Land) private lands;
    mapping(address => bool) public officers;
   
    mapping(uint256 => mapping(address => uint256)) public disputeDeposits;

    event LandRegistered(uint256 landId, address owner, bytes32 hash, string cid);
    event OwnershipTransferred(uint256 landId, address oldOwner, address newOwner, bytes32 hash);
    event DisputeRaised(uint256 landId, address raisedBy, string reason);
    event DisputeResolved(uint256 landId, bool valid);

    modifier onlyOfficer() {
        require(officers[msg.sender], "Not authorized");
        _;
    }

    constructor(address owner) {
        govtowner = owner;
    }
    
    modifier onlygovt(){
        require(msg.sender==govtowner,"your not authorized for this");
        _;
    }
    
    // Add this function to expose the contract owner
    function owner() public view returns (address) {
        return govtowner;
    }
    
    function setOfficer(address officer, bool status) external onlygovt{
        officers[officer] = status;
    }

    function registerLand(
        uint256 landId,
        address owner,
        bytes32 documentHash,
        string calldata Datahavenid
    ) external onlyOfficer {
        require(!lands[landId].exists, "Already registered");

        lands[landId] = Land(
            landId,
            owner,
            documentHash,
            Datahavenid,
            block.timestamp,
            false,
            true,
            address(0)
        );

        emit LandRegistered(landId, owner, documentHash, Datahavenid);
    }

    function transferLand(
        uint256 landId,
        address newOwner,
        bytes32 newHash,
        string calldata newCID
    ) external onlyOfficer {
        require(lands[landId].exists, "Land not found");
        require(!lands[landId].disputed, "Land under dispute");

        address oldOwner = lands[landId].owner;

        lands[landId].owner = newOwner;
        lands[landId].documentHash = newHash;
        lands[landId].Datahavenid = newCID;
        lands[landId].timestamp = block.timestamp;

        emit OwnershipTransferred(landId, oldOwner, newOwner, newHash);
    }

    function raiseDispute(uint256 landId, string calldata reason) external payable {
        require(lands[landId].exists, "Land not found");
        require(msg.value >= 0.01 ether, "Minimum stake required");
        require(!lands[landId].disputed, "Already disputed");

        lands[landId].disputed = true;
        lands[landId].disputeRaiser = msg.sender;
        disputeDeposits[landId][msg.sender] = msg.value;

        emit DisputeRaised(landId, msg.sender, reason);
    }

    function resolveDispute(uint256 landId, bool valid) external onlyOfficer {
        require(lands[landId].disputed, "No active dispute");

        address raiser = lands[landId].disputeRaiser; 
        uint256 deposit = disputeDeposits[landId][raiser];

        lands[landId].disputed = false;
        lands[landId].disputeRaiser = address(0);
        disputeDeposits[landId][raiser] = 0;

        if (valid) {
            // Dispute was valid: Refund the raiser
            (bool success, ) = payable(raiser).call{value: deposit}("");
            require(success, "Transfer failed");
        } 
       
        emit DisputeResolved(landId, valid);
    }

    function getLand(uint256 landId)
        external
        view
        returns (
            address owner,
            bytes32 documentHash,
            string memory Datahavenid,
            bool disputed,
            uint256 timestamp
        )
    {
        require(lands[landId].exists, "Land not found");
        Land memory land = lands[landId];
        return (
            land.owner,
            land.documentHash,
            land.Datahavenid,
            land.disputed,
            land.timestamp
        );
    }
}
