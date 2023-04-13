import { ethers } from "hardhat";
import { Deploy } from "../utils/deploy";
import { Verify } from "../utils/verify";
import { Misc } from "../utils/misc";
import { log } from "../utils/log";

const name = "MerkleClaimVeNFT";

async function main() {
  const signer = (await ethers.getSigners())[0];
  const logic = await Deploy.deployContract(signer, name);
  await Misc.wait(1);
  await Verify.verify(logic.address);
  log.info(`${name}: ${logic.address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
