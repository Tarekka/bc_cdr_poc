const Web3 = require("web3");
const fs = require("fs");
const csv = require("csv-parser");
const readline = require("readline");
const contractABI = require("../SmartContract/abi.json");
const crypto = require("crypto");
require("dotenv").config();

// Create an instance of Web3 with an HttpProvider
const web3 = new Web3.Web3(
  new Web3.providers.http.HttpProvider(process.env.HTTP_PROVIDER_URL)
);

// Initialize the contract
const contractAddress = process.env.CONTRACT_ADDRESS;
const contract = new web3.eth.Contract(contractABI, contractAddress);

// Define types of results that can be returned by the VerifyCdr function
const Results = {
  HashMismatch: "HashMismatch",
  TimeMismatch: "TimeMismatch",
  Valid: "Valid",
  Error: "Error",
};

// Get CDR data from contract and verify with the record passed in
async function VerifyCdr(cdr) {
  try {
    // Get the record from the blockchain
    const result = await contract.methods
      .viewCdr("0x143CE9C93e5F03e860FFEeDEf9D97F621104ad70", cdr.Id)
      .call();

    // Prepare local data of the record for verification with the blockchain result
    let record_Date = new Date(cdr.Date + "T" + cdr.Time).getTime() / 1000;
    var record_Hash = hashCdr(cdr);

    console.log(Number(result[1]))
    console.log(record_Date);
    // Check if the hash in the blockchain matches our hash
    if (result[0] != record_Hash) {
      return `${cdr.Id},${Results.HashMismatch}`;
    }
    // Check if the time the record was entered to the blockchain matches the record's date.
    else if (Math.abs(record_Date - Number(result[1])) > (300 * 1000)) {
      return `${cdr.Id},${Results.TimeMismatch}`;
    }
    // If it passed both checks, then the record is valid
    return `${cdr.Id},${Results.Valid}`;
  } catch (error) {;
    // Print innerError if available, else print the outer error message. 
    if (error.innerError) {
      console.error("Inner error details:", error.innerError);
    } else {
      console.error("An error occurred:", error.message)
    }
    return `${cdr.Id},${Results.Error}`;
  }
}

// Function that converts the CDR object to a string and hashes it using SHA256
const hashCdr = (cdr) => {
  const cdrString = `${cdr.Id},${cdr.Date},${cdr.Time},${cdr.MSISDN},${cdr.CalledParty},${cdr.CallDuration},${cdr.ChargeDuration},${cdr.CellId},${cdr.CalledCellId}`;
  return crypto.createHash("sha256").update(cdrString).digest("hex");
};

// Function to read CSV file and process each line
function processCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => {
        results.push(VerifyCdr(row));
      })
      .on("end", () => {
        Promise.all(results)
          .then((resultsToWrite) => {
            // Write all the results to a new file, with the same file name but .results.csv suffix
            writeToFile(resultsToWrite, filePath + ".results.txt");
            console.log("CDRs successfully processed");
            resolve();
          })
          .catch(reject);
      });
  });
}

// Read file path from user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
rl.question("Enter the path of your CSV file: ", async (filePath) => {
  await processCSV(filePath);
  rl.close();
});

// Function that write the results to a new file
function writeToFile(data, fileName) {
  const content = data.join("\n");
  fs.writeFile(fileName, content, (err) => {
    if (err) {
      return console.error(`Error occured while writing results to file: ${err.message}`);
    }
    console.log(`Results written to ${fileName}`);
  });
}
