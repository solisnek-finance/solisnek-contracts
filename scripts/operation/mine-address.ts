import { log } from "../utils/log";
import { Deploy } from "../utils/deploy";

const deployer = "0x3C252a188Aa35D5B08Ca141d79CBDC951Bc160F0";
const logic = "0xE8b28266b49e3C775309448fd325a2210F718dF9";
const admin = "0xa9B41ce6BD3F781Ead19d33b142270B392e7A5e2";

const loopCount = 1000000000;

async function main() {
  log.info(`mining address for ${logic}`);
  for (let i = 0; i < loopCount; i++) {
    const mined = Deploy.precomputeAddress(deployer, logic, admin, i);
    const matches = mined.match("^0x(e+).*");
    const length = matches == null ? 0 : matches[1].length;
    if (i % 10000 == 0) {
      log.info(`mining ${(i * 100) / loopCount}%`);
    }
    if (length >= 3) {
      log.info(`salt: ${i}, lenght: ${length}, mined: ${mined}`);
    }
  }
  log.info("not found");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
