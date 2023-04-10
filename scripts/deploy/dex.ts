import { ethers } from "hardhat";
import { BigNumberish, Contract } from "ethers";
import * as config from "./config";
import { Deploy } from "../utils/deploy";
import { Verify } from "../utils/verify";
import { Misc } from "../utils/misc";
import { log } from "../utils/log";
import { PairFactory, Router, SnekLibrary } from "../../typechain-types";

interface deployItem {
  name: string;
  logic: string;
  salt: BigNumberish;
}

const deployItems: deployItem[] = [
  {
    name: "PairFactory",
    logic: "0x0bb975694606FAAd8Ac49A32434751090DF5a464",
    salt: 806919796, // 0xeeee1F1c93836B2CAf8B9E929cb978c35d46657E
  },
  {
    name: "Router",
    logic: "0x47717ddbB816AB308944E22bfe6598Bf8a5Cb998",
    salt: 405794531, // 0xeeee17b45E4d127cFaAAD14e2710489523ADB4d8
  },
  {
    name: "SnekLibrary",
    logic: "0x2Df68b22A7664B27e51585BB62C927a20c9E921A",
    salt: 602964433, // 0xeeee1A2Dd20FaeBef70b0fD7EA0673127c0366F2
  },
];

const pairLogic = "0x9eF38d9A074bfEBe21B13c3D287D4D82C3976280";
const voterAddress = "0xeeee6FA8A6f8F32d76abAb2131f9e8aeb1b0B02B"; // salt: 911072606

async function main() {
  const signer = (await ethers.getSigners())[0];
  const deployerContract = await ethers.getContractFactory("Deployer", signer);
  const deployer = deployerContract.attach(config.deployerAddress);

  const logics = deployItems.map((item) => item.logic);
  const salts = deployItems.map((item) => item.salt);
  const proxies = await Deploy.deployProxiesWithDeployer(deployer, logics, config.proxyAdminAddress, salts);
  deployItems.map((item, idx) => log.info(`proxy ${item.name}:`, proxies[idx]));

  let contracts: { [key: string]: Contract } = {};
  for (let i = 0; i < proxies.length; i++) {
    contracts[deployItems[i].name] = (await ethers.getContractFactory(deployItems[i].name)).attach(proxies[i]);
  }

  await Misc.runAndWait(() =>
    (contracts["PairFactory"] as PairFactory).initialize(config.proxyAdminAddress, pairLogic, voterAddress, config.msig)
  );
  await Misc.runAndWait(() =>
    (contracts["Router"] as Router).initialize(contracts["PairFactory"].address, config.weth)
  );
  await Misc.runAndWait(() => (contracts["SnekLibrary"] as SnekLibrary).initialize(contracts["Router"].address));

  for (let i = 0; i < proxies.length; i++) {
    await Verify.linkProxyWithImplementationAbi(proxies[i], logics[i]);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
