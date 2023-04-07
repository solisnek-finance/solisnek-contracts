import { ethers, upgrades } from "hardhat";
import * as config from "./config";
import { Verify } from "../utils/verify";
import { Misc } from "../utils/misc";
import { log } from "../utils/log";

const ve = "0xeeee3823509dF4819F3D7F4B93D314e9a2fc8d9f";
const merkleRoot = "0x617e1a74bf95e39da39f71a2d767398379f87d248707abf09eab3ac59fd7c4e0";
const duration = 7; // days

async function main() {
  const name = "MerkleClaimVeNFT";
  log.info(`deploying ${name}`);
  const Contract = await ethers.getContractFactory(name);
  const contract = await upgrades.deployProxy(Contract, [ve, merkleRoot, duration]);
  await contract.deployed();
  log.info("MerkleClaimVeNFT deployed:", contract.address);

  const merkle = (await ethers.getContractFactory(name)).attach(contract.address);
  await Misc.runAndWait(() => merkle.transferOwnership(config.msig));

  await Misc.wait(5);
  await Verify.verify(contract.address);
}

main();
