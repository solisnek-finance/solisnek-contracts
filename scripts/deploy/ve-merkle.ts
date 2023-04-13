import { ethers } from "hardhat";
import * as config from "./config";
import { Deploy } from "../utils/deploy";
import { Verify } from "../utils/verify";
import { Misc } from "../utils/misc";
import { log } from "../utils/log";

const salt = 200001250;
const logic = "0x9eE4c8e02ecE6D8DeD582f219f5BA15CDdd19bBD";

const ve = "0xeeee3Bf0E550505C0C17a8432065F2f6b9D06350";
const merkleRoot = "0x0000000000000000000000000000000000000000000000000000000000000000";
const duration = 7; // days

async function main() {
  const signer = (await ethers.getSigners())[0];
  const deployerContract = await ethers.getContractFactory("Deployer", signer);
  const deployer = deployerContract.attach(config.deployerAddress);
  const proxy = await Deploy.deployProxyWithDeployer(deployer, logic, config.proxyAdminAddress, salt);
  log.info(`token proxy: ${proxy}`);
  await Misc.wait(1);
  await Verify.linkProxyWithImplementationAbi(proxy, logic);

  const merkle = (await ethers.getContractFactory("MerkleClaimVeNFT")).attach(proxy);
  await Misc.runAndWait(() => merkle.initialize(ve, merkleRoot, duration));
  await Misc.runAndWait(() => merkle.transferOwnership(config.msig));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
