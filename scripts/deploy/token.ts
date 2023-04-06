import { ethers } from "hardhat";
import { Deploy } from "../utils/deploy";
import { Verify } from "../utils/verify";
import { Misc } from "../utils/misc";
import { log } from "../utils/log";

const salt = 2701492802;
const logic = "0xfF7Dcc26D9a5E24974f27936BEA2895532F373a5";
const msig = "0x74D638baa8c073C8528745D0F8fBCB6FCd0fC1a2";
const deployerAddress = "0x3C252a188Aa35D5B08Ca141d79CBDC951Bc160F0";
const proxyAdminAddress = "0xa9B41ce6BD3F781Ead19d33b142270B392e7A5e2";

async function main() {
  const signer = (await ethers.getSigners())[0];
  const deployerContract = await ethers.getContractFactory("Deployer", signer);
  const deployer = deployerContract.attach(deployerAddress);
  const proxy = await Deploy.deployProxyWithDeployer(deployer, logic, proxyAdminAddress, salt);
  log.info(`token proxy: ${proxy}`);
  await Misc.wait(1);
  await Verify.linkProxyWithImplementationAbi(proxy, logic);

  const token = (await ethers.getContractFactory("Snek")).attach(proxy);
  await Misc.runAndWait(() => token.initialize("0xeeee84244DD0A1dE06493A0252dC02A238C04988"));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
