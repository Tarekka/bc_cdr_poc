const express = require("express");
const bodyParser = require("body-parser");
const crypto = require("crypto");
const Web3 = require("web3");
const contractABI = require("../SmartContract/abi.json");
require("dotenv").config();

const app = express();

// Use body-parser to parse input of CDRs in JSON
app.use(bodyParser.json());

// Connect to Ethereum node
const web3 = new Web3.Web3(
  new Web3.providers.http.HttpProvider(
    "https://goerli.infura.io/v3/ad452e395e9341d8808a7411e59ebcad"
  )
);

const contractAddress = "0x26fcDA85fAB8925E0BB9eA90eEE400734dc91FAf";

// Initialize the contract
const contract = new web3.eth.Contract(contractABI, contractAddress);

// Private key of the account that will send transactions
const privateKey = process.env.PRIVATE_KEY;

// Hash CDR function
const hashCdr = (cdr) => {
  const cdrString = `${cdr.Id},${cdr.Date},${cdr.Time},${cdr.MSISDN},${cdr.CalledParty},${cdr.CallDuration},${cdr.ChargeDuration},${cdr.CellId},${cdr.CalledCellId}`;
  return crypto.createHash("sha256").update(cdrString).digest("hex");
};

// Express route for receiving a POST request with CDR data
app.post("/cdr", async (req, res) => {
  try {
    const cdr = req.body;
    const hashValue = hashCdr(cdr);
    console.log("Resulting hash: ", hashValue);
    // The account address derived from the private key
    const account = web3.eth.accounts.privateKeyToAccount(privateKey);

    // Get current gas price to send with the transaction
    const gasPrice = await web3.eth.getGasPrice();
    // Prepare the transaction
    const tx = {
      from: account.address,
      to: contractAddress,
      data: contract.methods.insertCdr(cdr.Id, hashValue).encodeABI(),
      gas: "250000", // estimated gas to cover the transaction
      gasPrice: gasPrice,
    };

    // Sign the transaction with the private key
    const signedTx = await web3.eth.accounts.signTransaction(tx, privateKey);

    // Send the signed transaction
    const receipt = await web3.eth.sendSignedTransaction(
      signedTx.rawTransaction
    );

    // Respond with the transaction receipt
    res
      .status(200)
      .json({ message: "CDR inserted successfully", txHash: receipt.transactionHash.toString() });
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
