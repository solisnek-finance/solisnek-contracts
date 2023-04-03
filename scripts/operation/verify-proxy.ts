import { ethers } from "hardhat";
import { Deploy } from "../utils/deploy";
import { Verify } from "../utils/verify";
import { Misc } from "../utils/misc";

const randomContract = "0xa3fa3d254bf6af295b5b22cc6730b04144314890";
const deployerAddress = "0x0EC828edd906CD602D619a78e02c66CaeDF61440";
const proxyAdminAddress = "0xCa6F5401C608d0E8242c638bd30af0F594A97118";

async function main() {
  // custom verify: disable hardhat-upgrade in hardhat.config.ts and verify recompiled oz proxy

  const signer = (await ethers.getSigners())[0];
  const deployerContract = await ethers.getContractFactory("Deployer", signer);
  const deployer = deployerContract.attach(deployerAddress);

  const proxy = await Deploy.deployProxyWithDeployer(deployer, randomContract, proxyAdminAddress, 0);
  const name = "contracts/oz/proxy/transparent/TransparentUpgradeableProxy.sol:TransparentUpgradeableProxy";
  await Misc.wait(1);
  await Verify.verifyWithContractName(proxy, name, [randomContract, proxyAdminAddress, []]);

  // re-enable hardhat-upgrade in hardhat.config.ts
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
