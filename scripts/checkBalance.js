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