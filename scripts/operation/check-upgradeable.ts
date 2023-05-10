import { ethers, upgrades } from "hardhat";
import { log } from "../utils/log";

const name = "VotingEscrow";
const proxy = "0xeeee3Bf0E550505C0C17a8432065F2f6b9D06350";

async function main() {
  const Contract = await ethers.getContractFactory(name);
  await upgrades.validateUpgrade(proxy, Contract);
  log.info(`${name} upgradeable`);
}

main();
