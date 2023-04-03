import { getImplementationAddress } from "@openzeppelin/upgrades-core";
import { Verify } from "../utils/verify";
import hre from "hardhat";

const pairProxy = "0x59E41Df1f5d746B944f8b205D257d235396EfDEA";

async function main() {
  const logic = await getImplementationAddress(hre.network.provider, pairProxy);
  await Verify.linkProxyWithImplementationAbi(pairProxy, logic);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
