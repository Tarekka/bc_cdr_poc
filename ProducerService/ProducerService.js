const express = require("express");
const bodyParser = require("body-parser");
const crypto = require("crypto");
const Web3 = require("web3");
const contractABI = require("../SmartContract/abi.json");
require("dotenv").config();

// Create an express app, and use bodyParser to parse input of CDRs in JSON
const app = express();
app.use(bodyParser.json());

// Create an instance of Web3 with an HttpProvider
const web3 = new Web3.Web3(
  new Web3.providers.http.HttpProvider(process.env.HTTP_PROVIDER_URL)
);

// Initialize the contract
const contractAddress = process.env.CONTRACT_ADDRESS;
const contract = new web3.eth.Contract(contractABI, contractAddress);

// Private key of the account to sign transactions sent to the blockchain
const privateKey = process.env.PRIVATE_KEY;

// Function that converts the CDR object to a string and hashes it using SHA256
const hashCdr = (cdr) => {
  const cdrString = `${cdr.Id},${cdr.Date},${cdr.Time},${cdr.MSISDN},${cdr.CalledParty},${cdr.CallDuration},${cdr.ChargeDuration},${cdr.CellId},${cdr.CalledCellId}`;
  return crypto.createHash("sha256").update(cdrString).digest("hex");
};

// Endpoint for receiving POST requests with CDR data
app.post("/cdr", async (req, res) => {
  try {
    const cdr = req.body;
    const hashValue = hashCdr(cdr);

    // Get the public account address to send in the transaction (derived from the private key)
    const account = web3.eth.accounts.privateKeyToAccount(privateKey);

    // Get current gas price to send with the transaction
    const gasPrice = await web3.eth.getGasPrice();

    // Prepare the transaction object
    const tx = {
      from: account.address,
      to: contractAddress,
      data: contract.methods.insertCdr(cdr.Id, hashValue).encodeABI(),
      gas: "250000", // estimated gas to cover the transaction
      gasPrice: gasPrice,
    };

    // Sign the transaction with the private key
    const signedTx = await web3.eth.accounts.signTransaction(tx, privateKey);

    // Send the signed transaction to the blockchain
    const receipt = await web3.eth.sendSignedTransaction(
      signedTx.rawTransaction
    );

    // Respond with the transaction receipt
    res
      .status(200)
      .json({
        message: "CDR inserted successfully",
        txHash: receipt.transactionHash.toString(),
      });
  } catch (error) {
    console.error("Error inserting CDR:", error);
    res
      .status(500)
      .json({ message: "Error inserting CDR", error: error.message });
  }
});

// Start server
const PORT = 3000;
app.listen(PORT, () => console.log(`Producer Service running on port ${PORT}`));
