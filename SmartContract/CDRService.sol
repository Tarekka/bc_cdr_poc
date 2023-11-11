// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract CdrContract {
    // Struct to hold CDR data along with a timestamp and the sender's address
    struct CdrData {
        string hashValue;
        uint256 timestamp;
        address sender;
    }

    // Dictionary that stores CDRs, with their unique Ids as keys
    mapping(uint256 => CdrData) private cdrs;

    // Event to emit when a new CDR is inserted
    event CdrInserted(uint256 indexed uniqueId, string hashValue, uint256 timestamp, address sender);

    // Function to insert a CDR - used by the producer service
    function insertCdr(uint256 uniqueId, string memory hashValue) public {
        // Create a new CdrData struct and store it in the cdrs mapping with additional sender's address
        cdrs[uniqueId] = CdrData({
            hashValue: hashValue,
            timestamp: block.timestamp, // current block time
            sender: msg.sender // address of the sender that inserted the CDR
        });

        // Emit the event that a new Cdr is inserted
        emit CdrInserted(uniqueId, hashValue, block.timestamp, msg.sender);
    }

    // Function to view a CDR and its details - used by the verification service
    function viewCdr(uint256 uniqueId) public view returns (string memory, uint256, address) {
        require(bytes(cdrs[uniqueId].hashValue).length > 0, "CDR does not exist.");

        CdrData memory cdrData = cdrs[uniqueId];
        return (cdrData.hashValue, cdrData.timestamp, cdrData.sender);
    }
    
}