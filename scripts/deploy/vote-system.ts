import { ethers } from "hardhat";
import { BigNumberish, Contract } from "ethers";
import * as config from "./config";
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
    logic: "0x640C7Ad857876b52F7b75c0C1E9645d47262f1cA",
    salt: 605010931, // 0xeeee23a91CF79df61f1f303E0909d879267F0312
  },
  {
    name: "VotingEscrow",
    logic: "0xf935525e23B538fdc10E121673d7170D5C8449D0",
    salt: 2874281, // 0xeeee3Bf0E550505C0C17a8432065F2f6b9D06350
  },
  {
    name: "FeeDistributorFactory",
    logic: "0xFe600207Ab4fe7C5faFB8529430C7530755fedA5",
    salt: 502899081, // 0xeeee41e5A1cc225520C21995D3A1Ed7AdC88540F
  },
  {
    name: "GaugeFactory",
    logic: "0xEDb68bd2dFDA1d7A008F1B34AeB8eA7cd63A128F",
    salt: 100060959, // 0xeeee50F6d5b7A80719fB2F9270E200da74667D77
  },
  {
    name: "Voter",
    logic: "0x5138fccd7bc5df1da3d4e47d6bbbf3873ddb4eb3",
    salt: 911072606, // 0xeeee6FA8A6f8F32d76abAb2131f9e8aeb1b0B02B
  },
  {
    name: "RewardsDistributor",
    logic: "0x2A8fcA4f2cE3d259C5522bfaeEB78bB772364E77",
    salt: 800129420, // 0xeeee78711E6F895D724D08CAE89144A0E1399a96
  },
  {
    name: "Minter",
    logic: "0x454D28D86BBB471262DC88EA776B0FfD9CF9fBdC",
    salt: 601888244, // 0xeeee869110d3dEABD559FBfc1D9387cb2adB540f
  },
];

const initialSupply = "0";

const snek = "0xeeee99b35Eb6aF5E7d76dd846DbE4bcc0c60cA1d";
const pairFactoryAddress = "0xeeee1F1c93836B2CAf8B9E929cb978c35d46657E";

async function main() {
  const signer = (await ethers.getSigners())[0];
  const deployerContract = await ethers.getContractFactory("Deployer", signer);
  const deployer = deployerContract.attach(config.deployerAddress);

  const logics = deployItems.map((item) => item.logic);
  const salts = deployItems.map((item) => item.salt);
  const proxies = await Deploy.deployProxiesWithDeployer(deployer, logics, config.proxyAdminAddress, salts);
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
      config.msig
    )
  );
  await Misc.runAndWait(() =>
    (contracts["FeeDistributorFactory"] as FeeDistributorFactory).initialize(config.proxyAdminAddress)
  );
  await Misc.runAndWait(() => (contracts["GaugeFactory"] as GaugeFactory).initialize(config.proxyAdminAddress));
  await Misc.runAndWait(() =>
    (contracts["Voter"] as Voter).initialize(
      contracts["VotingEscrow"].address,
      pairFactoryAddress,
      contracts["GaugeFactory"].address,
      contracts["FeeDistributorFactory"].address,
      contracts["Minter"].address,
      config.msig,
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
      config.msig
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
