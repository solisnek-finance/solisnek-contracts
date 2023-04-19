import { ethers, upgrades } from "hardhat";
import { log } from "../utils/log";

const name = "PairFactory";
const proxy = "0xeeee175CC85Db8D1245094B0f83e39b0128a8D6B";

async function main() {
  const Contract = await ethers.getContractFactory(name);
  await upgrades.validateUpgrade(proxy, Contract);
  log.info(`${name} upgradeable`);
}

main();
