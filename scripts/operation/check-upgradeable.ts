import { ethers, upgrades } from "hardhat";
import { log } from "../utils/log";

const name = "Minter";
const proxy = "0xeeee84244DD0A1dE06493A0252dC02A238C04988";

async function main() {
  const Contract = await ethers.getContractFactory(name);
  await upgrades.validateUpgrade(proxy, Contract);
  log.info(`${name} upgradeable`);
}

main();
