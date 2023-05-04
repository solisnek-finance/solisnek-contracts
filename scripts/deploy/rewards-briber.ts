import { ethers } from "hardhat";
import * as config from "./config";
import { Deploy } from "../utils/deploy";
import { Verify } from "../utils/verify";
import { Misc } from "../utils/misc";
import { log } from "../utils/log";

const salt = 3681374;
const logic = "0xc9A91ad49BaE701b77A7fd34F3d5DA20D4518Aa6";
const ve = "0xeeee3Bf0E550505C0C17a8432065F2f6b9D06350";

async function main() {
  const signer = (await ethers.getSigners())[0];
  const deployerContract = await ethers.getContractFactory("Deployer", signer);
  const deployer = deployerContract.attach(config.deployerAddress);
  const proxy = await Deploy.deployProxyWithDeployer(deployer, logic, config.proxyAdminAddress, salt);
  log.info(`RewardsBriber proxy: ${proxy}`);
  await Misc.wait(1);
  await Verify.linkProxyWithImplementationAbi(proxy, logic);

  const contract = (await ethers.getContractFactory("RewardsBriber")).attach(proxy);
  await Misc.runAndWait(() => contract.initialize(ve, config.msig));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
