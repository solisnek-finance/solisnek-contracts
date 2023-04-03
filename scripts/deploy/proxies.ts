import assert from "assert";
import { ethers, upgrades } from "hardhat";
import { Deploy } from "../utils/deploy";
import { Verify } from "../utils/verify";
import { Misc } from "../utils/misc";
import { log } from "../utils/log";
import { Deployer } from "../../typechain-types";
import { randomInt } from "crypto";

// TODO: remove this file

const salts = [
  randomInt(Misc.SECONDS_OF_YEAR),
  randomInt(Misc.SECONDS_OF_YEAR),
  randomInt(Misc.SECONDS_OF_YEAR),
  randomInt(Misc.SECONDS_OF_YEAR),
  randomInt(Misc.SECONDS_OF_YEAR),
  randomInt(Misc.SECONDS_OF_YEAR),
  randomInt(Misc.SECONDS_OF_YEAR),
  randomInt(Misc.SECONDS_OF_YEAR),
  randomInt(Misc.SECONDS_OF_YEAR),
  randomInt(Misc.SECONDS_OF_YEAR),
  randomInt(Misc.SECONDS_OF_YEAR),
];

const names = [
  "FeeDistributorFactory",
  "GaugeFactory",
  "PairFactory",
  "Minter",
  "RewardsDistributor",
  "Router",
  "Snek",
  "SnekLibrary",
  "VeArtProxy",
  "Voter",
  "VotingEscrow",
];

// follow orders of names
const logics = [
  "0xD605DAfDFffd7Db34022639a18a5A113f1E0B045",
  "0x8A125D994d655C7f1dd527282A1F3888C9Ed1Cd9",
  "0x0fC46a8Fc906F026E2cBE6a259A70D493fcC9D17",
  "0x70C8173Ba11e22cd3Dd104484c5A362b3042728E",
  "0x960588b21ab1693A6F76F3c693019798cCb8988C",
  "0xB5116Bc84125E7685b84EA22e9243c5C2E821eae",
  "0xD716fd6763355Faee2615Ac878064f907A456cDd",
  "0x4390aDF0C2Eb0494D251a49c0435f06F1762D8bE",
  "0xd377b09E4313c079Dc2aB17a2C1ab58F11e6d819",
  "0x1865051a62Bb670A2b0Df330764990d16D2B3019",
  "0x7C3623a1C6284EcdBb6B0a63c18ba487a202a45c",
];

async function main() {
  assert.equal(names.length, salts.length);
  assert.equal(names.length, logics.length);

  const signer = (await ethers.getSigners())[0];
  const deployer = (await Deploy.deployProxy(signer, "Deployer")) as Deployer;
  const proxyAdminAddress = await upgrades.erc1967.getAdminAddress(deployer.address);
  log.info(`proxy admin: ${proxyAdminAddress}`);
  await Misc.wait(1);
  //   const deployerContract = await ethers.getContractFactory("Deployer");
  //   const deployer = deployerContract.attach("0xFb1603fF3Da4a9cDDf94695C18a81aeF9c16FC1B");
  //   const proxyAdminAddress = ethers.utils.getAddress("0xEcD3FEB3269f6f4B454f8a860EC0E22f653044e9");

  const proxies = await Deploy.deployProxiesWithDeployer(deployer, logics, proxyAdminAddress, salts);

  for (let i = 0; i < proxies.length; i++) {
    await Verify.linkProxyWithImplementationAbi(proxies[i], logics[i]);
  }

  for (let i = 0; i < proxies.length; i++) {
    log.info(`proxy ${names[i]}: ${proxies[i]}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
