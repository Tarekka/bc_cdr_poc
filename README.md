# Blockchain CDR Proof of Concept

## Deploying the smart contract
The simplest way to deploy the smart contract is using [remix online IDE](https://remix.ethereum.org/).
The contract code can be pasted in the IDE, built and deployed. 
Once deployed you will get a contract address to interact with.

Another alternative is to use the contract already deployed on the Goerili test net which can be found at the following address:
`0xE4195f82FBcD436E228132e692Ac90ad867bC756`

## Starting the services
You need node installed to run the Producer and Verification service.
Node can be installed by visiting the [offical NodeJS website](https://nodejs.org/en)
Please make sure to download the latest version to avoid facing issues.

### Producer Service
Before starting the service, some environment variables need to be set. This can be done by creating an `.env` file in the ProducerService directory.
```
cd ProducerService
touch .env
```
The contents of the file should be like below:
```
PRIVATE_KEY=
HTTP_PROVIDER_URL=
CONTRACT_ADDRESS=0xE4195f82FBcD436E228132e692Ac90ad867bC756
```
The `PRIVATE_KEY` can be retrieved from your Web3 wallet. You can use Metamask extension to create a test wallet, then export the private key and paste it in the .env file
To connect to the blockchain you'd need an HTTP provider. This can be set in `HTTP_PROVIDER_URL`. There are multiple HTTP providers available, you can use [Infura](http://infura.io) for testing.
The `CONTRACT_ADDRESS` can be left as is, except if you've deployed the contract to another address.

After the variables are set, the service can be started using node
```
node ProducerService.js
```



### Verification Service
The same variables except the `PRIVATE_KEY` need to be set.
The verification service expects two variables to start, the path to the input CSV file and the address of the sender that you're verifying from.
A sample input file, input.csv is included in the VerificationService directory, and can be used.
Since you typically want to verify records sent by the producer, the address to use here is the wallet's public address, which can be found in your Web3 wallet. However if you want to verify already existing records, you can use `0x143CE9C93e5F03e860FFEeDEf9D97F621104ad70`

After the variables are set, the service can be started using node:
```
node VerificationService.js {path to input CSV file} {address of sender}
```
For example
```
node VerificationService.js input.csv 0x143CE9C93e5F03e860FFEeDEf9D97F621104ad70
```
