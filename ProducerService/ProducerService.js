const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const Web3 = require('web3');
require('dotenv').config();

const app = express();

// Use body-parser to parse application/json
app.use(bodyParser.json());

// Connect to Ethereum node
const web3 = new Web3.Web3(new Web3.providers.http.HttpProvider('http://localhost:8545'));

const contractAddress = 'CONTRACT ADDRESS GOES HERE';
const contractABI = []; // Replace with contract's ABI

// Initialize the contract
const contract = new web3.eth.Contract(contractABI, contractAddress);

// Private key of the account that will send transactions
const privateKey = process.env.PRIVATE_KEY;

// Hash CDR function
const hashCdr = (cdr) => {
    const cdrString = `${cdr.Id}${cdr.Date}${cdr.Time}${cdr.MSISDN}${cdr.CalledParty}${cdr.CallDuration}${cdr.ChargeDuration}${cdr.CellId}${cdr.CalledCellId}`;
    return crypto.createHash('sha256').update(cdrString).digest('hex');
};

// Express route for receiving a POST request with CDR data
app.post('/cdr', async (req, res) => {
    try {
        const cdr = req.body;
        const hashValue = hashCdr(cdr);

        // The account address derived from the private key
        const account = web3.eth.accounts.privateKeyToAccount(privateKey);

        // Prepare the transaction
        const tx = {
            from: account.address,
            to: contractAddress,
            data: contract.methods.insertCdr(cdr.Id, hashValue).encodeABI(),
            gas: '1000000' // This is a placeholder; you should estimate gas properly
        };

        // Sign the transaction with the private key
        const signedTx = await web3.eth.accounts.signTransaction(tx, privateKey);

        // Send the signed transaction
        const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

        // Respond with the transaction receipt
        res.status(200).json({ message: 'CDR inserted successfully', receipt: receipt });
    } catch (error) {
        console.error('Error inserting CDR:', error);
        res.status(500).json({ message: 'Error inserting CDR', error: error.message });
    }
});

// Start server
const PORT = 3000;
app.listen(PORT, () => console.log(`Producer Service running on port ${PORT}`));
