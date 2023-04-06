import { ethers } from "hardhat";
import { BigNumberish, Contract } from "ethers";
import { Deploy } from "../utils/deploy";
import { Verify } from "../utils/verify";
import { Misc } from "../utils/misc";
import { log } from "../utils/log";
import {
  VeArtProxy,
  VotingEscrow,
  FeeDistributorFactory,
  GaugeFactory,
  Voter,
  RewardsDistributor,
  Minter,
} from "../../typechain-types";

interface deployItem {
  name: string;
  logic: string;
  salt: BigNumberish;
}

const deployItems: deployItem[] = [
  {
    name: "VeArtProxy",
    logic: "0xd09Cffc843710749B550b299243A7ff84b462fd1",
    salt: 2300625080, // 0xeeee22cd7047966eDBE47Ff5698d34159C953cCF
  },
  {
    name: "VotingEscrow",
    logic: "0x270ef8f7364EE60CE0b486e90E5f99Bc2eb9Ea96",
    salt: 2400799666, // 0xeeee3823509dF4819F3D7F4B93D314e9a2fc8d9f
  },
  {
    name: "FeeDistributorFactory",
    logic: "0x53B6c760282767dd9F8b5c518a725B91Dc906428",
    salt: 2901074993, // 0xeeee461cFc20E385891380BC5d4DACc258ff50F5
  },
  {
    name: "GaugeFactory",
    logic: "0x9Dd766Df594D787Bb3f07438d135c4C42d31E4dF",
    salt: 2300002519, // 0xeeee55A381ca608B45a550A0c261B9ADa9C645f5
  },
  {
    name: "Voter",
    logic: "0x4184C04A7f7c8cB002Fe3F067ad570dBfbF64d75",
    salt: 2106312492, // 0xeeee674b981F7A0266c099bdD8150B137996cC31
  },
  {
    name: "RewardsDistributor",
    logic: "0x64088aA4B2876473809fC0fEe2372b554226fe09",
    salt: 2300961848, // 0xeeee794A5dd290Eb5CC92598A08EB61fE6D5f261
  },
  {
    name: "Minter",
    logic: "0xAeD4184C0e14DD77af0c980bB8DDcA8f0715A581",
    salt: 2001995303, // 0xeeee84244DD0A1dE06493A0252dC02A238C04988
  },
];

const initialSupply = "1000000000000000000000000000"; // 1M

const snek = "0xeeee97AC0f417D220dFfA3DCCbf6121C53541513";
const pairFactoryAddress = "0xeeee175CC85Db8D1245094B0f83e39b0128a8D6B";
const msig = "0x74D638baa8c073C8528745D0F8fBCB6FCd0fC1a2";
const deployerAddress = "0x3C252a188Aa35D5B08Ca141d79CBDC951Bc160F0";
const proxyAdminAddress = "0xa9B41ce6BD3F781Ead19d33b142270B392e7A5e2";

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

  await Misc.runAndWait(() => (contracts["VeArtProxy"] as VeArtProxy).initialize());
  await Misc.runAndWait(() =>
    (contracts["VotingEscrow"] as VotingEscrow).initialize(
      snek,
      contracts["VeArtProxy"].address,
      contracts["Voter"].address,
      msig
    )
  );
  await Misc.runAndWait(() =>
    (contracts["FeeDistributorFactory"] as FeeDistributorFactory).initialize(proxyAdminAddress)
  );
  await Misc.runAndWait(() => (contracts["GaugeFactory"] as GaugeFactory).initialize(proxyAdminAddress));
  await Misc.runAndWait(() =>
    (contracts["Voter"] as Voter).initialize(
      contracts["VotingEscrow"].address,
      pairFactoryAddress,
      contracts["GaugeFactory"].address,
      contracts["FeeDistributorFactory"].address,
      contracts["Minter"].address,
      msig,
      []
    )
  );
  await Misc.runAndWait(() =>
    (contracts["RewardsDistributor"] as RewardsDistributor).initialize(
      contracts["VotingEscrow"].address,
      contracts["Minter"].address
    )
  );

  // before run this, change snek minting role to this minter address
  await Misc.runAndWait(() =>
    (contracts["Minter"] as Minter).initialize(
      contracts["Voter"].address,
      contracts["VotingEscrow"].address,
      contracts["RewardsDistributor"].address,
      initialSupply,
      msig
    )
  );

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
