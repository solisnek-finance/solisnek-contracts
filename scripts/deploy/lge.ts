import { ethers, upgrades } from "hardhat";
import { Verify } from "../utils/verify";
import { Misc } from "../utils/misc";
import { log } from "../utils/log";

const COLLATERAL_TOKEN = "0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7"; // wavax
// const START_TIME = Math.floor(Date.now() / 1000);
const START_TIME = 1680278400; // 4pm utc 31 march
const END_TIME = 1680883200; // 4pm utc 7 april
const TREASURY = "0x60ffd8fE07AEaE3D15572354395Cb36bdBfCE5Af"; // mainnet msig
const MAX_TO_DISTRIBUTE = "10000000000000000000000000"; // 10m
const MIN_TO_RAISE = "10000000000000000000000"; // 10k
const MAX_TO_RAISE = "20000000000000000000000"; // 20k
const CAP_PER_WALLET = "50000000000000000000"; // 50
const OWNER = "0x60ffd8fE07AEaE3D15572354395Cb36bdBfCE5Af";
const WETH = COLLATERAL_TOKEN;

async function main() {
  log.info("deploying lge");
  const Contract = await ethers.getContractFactory("TokenLGE");
  const contract = await upgrades.deployProxy(Contract, [
    COLLATERAL_TOKEN,
    START_TIME,
    END_TIME,
    TREASURY,
    MAX_TO_DISTRIBUTE,
    MIN_TO_RAISE,
    MAX_TO_RAISE,
    CAP_PER_WALLET,
    OWNER,
    WETH,
  ]);
  await contract.deployed();
  log.info("lge deployed:", contract.address);

  await Misc.wait(5);
  await Verify.verify(contract.address);
}

main();
