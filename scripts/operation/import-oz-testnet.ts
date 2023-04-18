import { ethers, upgrades } from "hardhat";
import { log } from "../utils/log";

interface Item {
  name: string;
  proxy: string;
}

const items: Item[] = [
  {
    name: "Snek",
    proxy: "0xeeee97AC0f417D220dFfA3DCCbf6121C53541513",
  },
  {
    name: "PairFactory",
    proxy: "0xeeee175CC85Db8D1245094B0f83e39b0128a8D6B",
  },
  {
    name: "Router",
    proxy: "0xeeee1b84A9D7F1648ee1537D23E233283B042FA1",
  },
  {
    name: "SnekLibrary",
    proxy: "0xeeee107104Dc4Bd4b3339eF6e9081572ac015DF4",
  },
  {
    name: "VeArtProxy",
    proxy: "0xeeee22cd7047966eDBE47Ff5698d34159C953cCF",
  },
  {
    name: "VotingEscrow",
    proxy: "0xeeee3823509dF4819F3D7F4B93D314e9a2fc8d9f",
  },
  {
    name: "FeeDistributorFactory",
    proxy: "0xeeee461cFc20E385891380BC5d4DACc258ff50F5",
  },
  {
    name: "GaugeFactory",
    proxy: "0xeeee55A381ca608B45a550A0c261B9ADa9C645f5",
  },
  {
    name: "Voter",
    proxy: "0xeeee674b981F7A0266c099bdD8150B137996cC31",
  },
  {
    name: "RewardsDistributor",
    proxy: "0xeeee794A5dd290Eb5CC92598A08EB61fE6D5f261",
  },
  {
    name: "Minter",
    proxy: "0xeeee84244DD0A1dE06493A0252dC02A238C04988",
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
