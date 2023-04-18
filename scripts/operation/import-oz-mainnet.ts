import { ethers, upgrades } from "hardhat";
import { log } from "../utils/log";

interface Item {
  name: string;
  proxy: string;
}

const items: Item[] = [
  {
    name: "Snek",
    proxy: "0xeeee99b35Eb6aF5E7d76dd846DbE4bcc0c60cA1d",
  },
  {
    name: "PairFactory",
    proxy: "0xeeee1F1c93836B2CAf8B9E929cb978c35d46657E",
  },
  {
    name: "Router",
    proxy: "0xeeee17b45E4d127cFaAAD14e2710489523ADB4d8",
  },
  {
    name: "SnekLibrary",
    proxy: "0xeeee1A2Dd20FaeBef70b0fD7EA0673127c0366F2",
  },
  {
    name: "VeArtProxy",
    proxy: "0xeeee23a91CF79df61f1f303E0909d879267F0312",
  },
  {
    name: "VotingEscrow",
    proxy: "0xeeee3Bf0E550505C0C17a8432065F2f6b9D06350",
  },
  {
    name: "FeeDistributorFactory",
    proxy: "0xeeee41e5A1cc225520C21995D3A1Ed7AdC88540F",
  },
  {
    name: "GaugeFactory",
    proxy: "0xeeee50F6d5b7A80719fB2F9270E200da74667D77",
  },
  {
    name: "Voter",
    proxy: "0xeeee6FA8A6f8F32d76abAb2131f9e8aeb1b0B02B",
  },
  {
    name: "RewardsDistributor",
    proxy: "0xeeee78711E6F895D724D08CAE89144A0E1399a96",
  },
  {
    name: "Minter",
    proxy: "0xeeee869110d3dEABD559FBfc1D9387cb2adB540f",
  },
];

async function main() {
  for (let i = 0; i < items.length; i++) {
    const Contract = await ethers.getContractFactory(items[i].name);
    await upgrades.forceImport(items[i].proxy, Contract);
    log.info(`${items[i].name}`);
  }
}

main();
