import { ethers, upgrades } from "hardhat";
import { Deploy } from "../utils/deploy";
import { Misc } from "../utils/misc";
import { log } from "../utils/log";
import { Deployer } from "../../typechain-types";

async function main() {
  const signer = (await ethers.getSigners())[0];
  const deployer = (await Deploy.deployProxy(signer, "Deployer")) as Deployer;
  const proxyAdminAddress = await upgrades.erc1967.getAdminAddress(deployer.address);
  log.info(`proxy admin: ${proxyAdminAddress}`);
  await Misc.wait(1);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
