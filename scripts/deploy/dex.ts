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
    logic: "0xA15302aECD6C9646AEA06E429Af83d0DFD358501",
    salt: 2506028809, // 0xeeee175CC85Db8D1245094B0f83e39b0128a8D6B
  },
  {
    name: "Router",
    logic: "0x62bca03dFc65FfC9c9D96bA1AB6cc2135eFF6b52",
    salt: 2000672741, // 0xeeee1b84A9D7F1648ee1537D23E233283B042FA1
  },
  {
    name: "SnekLibrary",
    logic: "0x991673ca3cD1e0960463bDa7cFC688C2867c080F",
    salt: 2003705733, // 0xeeee107104Dc4Bd4b3339eF6e9081572ac015DF4
  },
];

const pairLogic = "0x95171AA21A29A3cFa53BaB78345DD939fBb19802";
const voterAddress = "0xeeee674b981F7A0266c099bdD8150B137996cC31"; // salt: 2106312492
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
