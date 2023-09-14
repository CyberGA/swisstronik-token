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