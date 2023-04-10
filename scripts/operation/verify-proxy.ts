import { ethers } from "hardhat";
import { Deploy } from "../utils/deploy";
import { Verify } from "../utils/verify";
import { Misc } from "../utils/misc";
import * as config from "../deploy/config";

const randomContract = "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7";

async function main() {
  // custom verify: disable hardhat-upgrade in hardhat.config.ts and verify recompiled oz proxy

  const signer = (await ethers.getSigners())[0];
  const deployerContract = await ethers.getContractFactory("Deployer", signer);
  const deployer = deployerContract.attach(config.deployerAddress);

  const proxy = await Deploy.deployProxyWithDeployer(deployer, randomContract, config.proxyAdminAddress, 0);
  const name = "contracts/oz/proxy/transparent/TransparentUpgradeableProxy.sol:TransparentUpgradeableProxy";
  await Misc.wait(1);
  await Verify.verifyWithContractName(proxy, name, [randomContract, config.proxyAdminAddress, []]);

  // re-enable hardhat-upgrade in hardhat.config.ts
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
