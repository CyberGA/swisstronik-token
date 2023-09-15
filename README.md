# Swisstronik Contract Deployment

## 1. Setting up environment
> Create a folder and enter the folder
```bash
mkdir 'foldername' && cd 'foldername'
```
> Initialize  npm
```bash
npm init -y
```
> Install hardhat
```bash
npm install --save-dev hardhat
```
> Create a Hardhat project
```bash
npx harhat
```
> Press enter on Create a `JavaScript project`

```
$ npx hardhat
888    888                      888 888               888
888    888                      888 888               888
888    888                      888 888               888
8888888888  8888b.  888d888 .d88888 88888b.   8888b.  888888
888    888     "88b 888P"  d88" 888 888 "88b     "88b 888
888    888 .d888888 888    888  888 888  888 .d888888 888
888    888 888  888 888    Y88b 888 888  888 888  888 Y88b.
888    888 "Y888888 888     "Y88888 888  888 "Y888888  "Y888

Welcome to Hardhat v{HARDHAT_VERSION}

? What do you want to do? …
▸ Create a JavaScript project
  Create a TypeScript project
  Create an empty hardhat.config.js
  Quit
```

> **Important**\
> Make sure you install the hardhat toolbox by running
> ```bash
> npm install --save-dev @nomicfoundation/hardhat-toolbox
> ```
If the process is successful, you will see the text Project created

> Install `dotenv` to make use of environment variables
```
npm i dotenv
```

> Install `bignumber`
```
npm i bignumber.js
```

> Create a `.env` file in your root folder and place your private key
```env
PRIVATE_KEY="......."
```



## 2. Configure hardhat.config.js
> Open the `hardhat.config.js` file, setup the Swisstronik's network
```js
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config({ path: ".env" });

const { PRIVATE_KEY } = process.env;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.19",
  networks: {
    swisstronik: {
      url: "https://json-rpc.testnet.swisstronik.com/", //URL of the RPC node for Swisstronik.
      accounts: [`0x${PRIVATE_KEY}`], //Your private key starting with "0x" 
      //Make sure you have enough funds in this wallet to deploy the smart contract
    },
  },
};
```
Make sure you have enough funds in this wallet to deploy/interact with the smart contract. otherwise, [you can get SWTR test tokens here](https://swisstronik.gitbook.io/swisstronik-docs/build-on-swisstronik/test-tokens)

## 3. Write and compile the smart contract
> Go to the contracts folder and create the `CyberGAToken.sol` file (smart contract).
> Paste the smart contract into your `CyberGAToken.sol` file.


Currently, only solidity compilers up to 0.8.19 is supported
```js
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract CyberGAToken is ERC20 {
    uint256 public constant tokenPrice = 0.000001 ether;
    uint256 public constant maxSupply = 10000 * 10**18; // 10,000 tokens
    
    
    constructor() ERC20("CyberGA Token", "CYBERGA") {
        // mint 10 tokens to the developer
        _mint(msg.sender, 10 * 10**18);
    }

    function mintTokens(uint256 _amount) public payable {
        uint256 _calculatedAmount = _amount * tokenPrice;
        require(msg.value >= _calculatedAmount, "Not enough ether to mint the requested CYBERGA tokens");
        uint256 amountInWei = _amount * 10**18;
        require(totalSupply() + amountInWei <= maxSupply, "Not enough tokens left for sale");
        _mint(msg.sender, amountInWei);
    }

    function viewTokenBal() public view returns (uint256) {
        return balanceOf(msg.sender);
    }
}
```
> Compile the contract
```bash
npx hardhat compile
```
After successful compilation:
1. You should get the message Compiled 1 Solidity file successfully in your terminal
2. new artifacts folder should be created

Now you are ready to deploy this contract on Swisstronik! 🚀

## 4. Deploy the smart contract
> Go to the deploy.js file located in the `scripts` folder and paste the deployment script in the `deploy.js` file

```js
const hre = require("hardhat");

async function main() {
  /**
   * @dev make sure the first argument has the same name as your contract in the Hello_swtr.sol file
   * @dev the second argument must be the message we want to set in the contract during the deployment process
   */
  const contract = await hre.ethers.deployContract("CyberGAToken");

  await contract.waitForDeployment();

  console.log(`CyberGAToken with address ${contract.target}, to Swisstronik network`);
}

//DEFAULT BY HARDHAT:
// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```
> Deploy the contract by running

```bash
npx hardhat run scripts/deploy.js --network swisstronik
```
After successful deployment, you should receive the following message in your terminal:
`Swisstronik contract deployed to 0x...`

Awesome, now let's start interacting with the contract! 🎉

## 5. Interact with the contract - Transaction
> Install SwisstronikJS

```
npm i @swisstronik/swisstronik.js
```

> Within the scripts folder, create a file called `mint100Tokens.js`

> Let's write our `mint100Tokens.js` script
```js
const hre = require("hardhat");
const BigNumber = require('bignumber.js');
const { encryptDataField } = require("@swisstronik/swisstronik.js");

const sendShieldTransaction = async (signer, destination, data, value) => {
    const rpclink = hre.network.config.url;
    const [encryptedData] = await encryptDataField(rpclink, data);
    return await signer.sendTransaction({
        from: signer.address,
        to: destination,
        data: encryptedData,
        value: value
    })
}

async function main() {
    const contractAddress = "0x6574Ca85B501b75ec5e3b7e72260fC8E7e057484";
    const tokenPrice = 0.000001;
    const [signer] = await hre.ethers.getSigners();
    const contractFactory = await hre.ethers.getContractFactory("CyberGAToken");
    const contract = contractFactory.attach(contractAddress);
    const functionName = "mintTokens";
    const amountParam = 100;
    const amount = new BigNumber(amountParam);
    const value = amount.multipliedBy(tokenPrice);
    const valueInWei = hre.ethers.parseEther(value.toString());
    const mintTX = await sendShieldTransaction(signer, contractAddress, contract.interface.encodeFunctionData(functionName, [amountParam.toString()]), valueInWei);
    await mintTX.wait();
    console.log("Transaction Receipt: ", mintTX);
}

main().then(() => process.exit(0))
    .catch(error => {
    console.log(error);
    process.exit(1);
});
```
> Execute the following command in your terminal to run the script using the Swisstronik network

```
npx hardhat run scripts/mint100Tokens.js --network swisstronik
```
Upon successful execution, your terminal should display Transaction Receipt: TransactionResponse {...} , now it's time to retrieve this message🎉

## 6. Interact with the contract - Call
> Within the scripts folder, create a file called `checkBalance.js`

> Let's write our `checkBalance.js` script

```js
const hre = require("hardhat");
const { encryptDataField, decryptNodeResponse } = require("@swisstronik/swisstronik.js");

const sendShieldQuery = async (provider, destination, data) => {
    const rpclink = hre.network.config.url;
    const [encryptedData, usedEncryptedKey] = await encryptDataField(rpclink, data);
    const res = await provider.call({
        to: destination,
        data: encryptedData
    })

    return await decryptNodeResponse(rpclink, res, usedEncryptedKey);
}

async function main() {
    const contractAddress = "0x6574Ca85B501b75ec5e3b7e72260fC8E7e057484"
    const [signer] = await hre.ethers.getSigners();
    const contractFactory = await hre.ethers.getContractFactory("CyberGAToken");
    const contract = contractFactory.attach(contractAddress);
    const functionName = "viewTokenBal";
    const responseMessage = await sendShieldQuery(signer.provider, contractAddress, contract.interface.encodeFunctionData(functionName));
    console.log("Decoded response:", contract.interface.decodeFunctionResult(functionName, responseMessage)[0]);
}

main().then(() => process.exit(0))
    .catch(error => {
        console.log(error);
        process.exit(1);
    })
```

> Execute the following command in your terminal to run the script using the Swisstronik network

```
npx hardhat run scripts/checkBalance.js --network swisstronik
```

Upon successful execution, your terminal should display Decoded response: ..... 🎉🙌🙌




