import { ethers } from "hardhat";
import * as config from "./config";
import { Deploy } from "../utils/deploy";
import { Verify } from "../utils/verify";
import { Misc } from "../utils/misc";
import { log } from "../utils/log";

const salt = 4908942;
const logic = "0x68de44f52742a976EcA528dD353F4cF7FC4e09a8";

async function main() {
  const signer = (await ethers.getSigners())[0];
  const deployerContract = await ethers.getContractFactory("Deployer", signer);
  const deployer = deployerContract.attach(config.deployerAddress);
  const proxy = await Deploy.deployProxyWithDeployer(deployer, logic, config.proxyAdminAddress, salt);
  log.info(`token proxy: ${proxy}`);
  await Misc.wait(1);
  await Verify.linkProxyWithImplementationAbi(proxy, logic);

  const token = (await ethers.getContractFactory("Snek")).attach(proxy);
  await Misc.runAndWait(() => token.initialize(config.msig));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
