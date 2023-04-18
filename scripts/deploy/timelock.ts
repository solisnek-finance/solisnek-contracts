import { ethers } from "hardhat";
import * as config from "./config";
import { Deploy } from "../utils/deploy";
import { Verify } from "../utils/verify";
import { Misc } from "../utils/misc";
import { log } from "../utils/log";

const minDelay = 3600;

const name = "SnekTimelock";

async function main() {
  const signer = (await ethers.getSigners())[0];
  // const contract = (await ethers.getContractFactory(name, signer)).attach("0x6D1cf33f950C66073A91645d1A0804Aa2E3aDb45");
  const contract = await Deploy.deployContract(
    signer,
    "SnekTimelock",
    minDelay,
    [config.msig],
    ["0x0000000000000000000000000000000000000000"],
    config.msig
  );
  await Misc.wait(1);
  const contractPath = "contracts/SnekTimelock.sol:SnekTimelock";
  await Verify.verifyWithContractName(contract.address, contractPath, [
    minDelay,
    [config.msig],
    ["0x0000000000000000000000000000000000000000"],
    config.msig,
  ]);
  log.info(`${name}: ${contract.address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
