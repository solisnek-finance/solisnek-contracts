import { ethers } from "hardhat";
import { BigNumberish, Contract } from "ethers";
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
    logic: "0x0C9fdCD8e60Ec74abFBc6Cf8B185548b36caEF08",
    salt: 100787077, // 0xeeeee07510d6c098caeF8dA4CE73F3F66020BCFB
  },
  {
    name: "Router",
    logic: "0x7b0dc9aD754c1B9c611B4198F8ffFB0D8264b870",
    salt: 203732558, // 0xeeeee61833e76a9A03092a12aA5f58A5e3505FA6
  },
  {
    name: "SnekLibrary",
    logic: "0xF4428b3Dcd89FF24977F96a114B9EA28f8a17D92",
    salt: 219191832, // 0xeeeee00404c4718b3f3Dbf9b3256af13573aB41F
  },
];

const pairLogic = "0x90236f699C38a2fAB16bD66D59910c531A4FCAa9";
const voterAddress = "0xeeeee2BA2825991CCd9E7053712aa852498b71C3"; // salt: 709347895
const msig = "0x74D638baa8c073C8528745D0F8fBCB6FCd0fC1a2";
const deployerAddress = "0x3C252a188Aa35D5B08Ca141d79CBDC951Bc160F0";
const proxyAdminAddress = "0xa9B41ce6BD3F781Ead19d33b142270B392e7A5e2";
const weth = "0xd00ae08403b9bbb9124bb305c09058e32c39a48c";

async function main() {
  const signer = (await ethers.getSigners())[0];
  const deployerContract = await ethers.getContractFactory("Deployer", signer);
  const deployer = deployerContract.attach(deployerAddress);

  const logics = deployItems.map((item) => item.logic);
  const salts = deployItems.map((item) => item.salt);
  const proxies = await Deploy.deployProxiesWithDeployer(deployer, logics, proxyAdminAddress, salts);
  deployItems.map((item, idx) => log.info(`proxy ${item.name}:`, proxies[idx]));

  let contracts: { [key: string]: Contract } = {};
  for (let i = 0; i < proxies.length; i++) {
    contracts[deployItems[i].name] = (await ethers.getContractFactory(deployItems[i].name)).attach(proxies[i]);
  }

  await Misc.runAndWait(() =>
    (contracts["PairFactory"] as PairFactory).initialize(proxyAdminAddress, pairLogic, voterAddress, msig)
  );
  await Misc.runAndWait(() => (contracts["Router"] as Router).initialize(contracts["PairFactory"].address, weth));
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
