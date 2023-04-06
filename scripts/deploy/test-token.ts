import { ethers } from "hardhat";
import { Deploy } from "../utils/deploy";
import { Verify } from "../utils/verify";
import { Misc } from "../utils/misc";
import { log } from "../utils/log";

async function main() {
  const signer = (await ethers.getSigners())[0];
  const weth = await Deploy.deployContract(signer, "TestToken", "Wrapped Ether", "WETH", 18);
  const usdc = await Deploy.deployContract(signer, "TestToken", "USD Coin", "USDC", 6);
  const usdt = await Deploy.deployContract(signer, "TestToken", "Tether USD", "USDT", 6);
  const mim = await Deploy.deployContract(signer, "TestToken", "Magic Internet Money", "MIM", 18);
  const dai = await Deploy.deployContract(signer, "TestToken", "Dai Stablecoin", "DAI", 18);

  await Misc.runAndWait(() => weth.mint(signer.address, ethers.utils.parseUnits("1000000", 18)));
  await Misc.runAndWait(() => usdc.mint(signer.address, ethers.utils.parseUnits("1000000", 6)));
  await Misc.runAndWait(() => usdt.mint(signer.address, ethers.utils.parseUnits("1000000", 6)));
  await Misc.runAndWait(() => mim.mint(signer.address, ethers.utils.parseUnits("1000000", 18)));
  await Misc.runAndWait(() => dai.mint(signer.address, ethers.utils.parseUnits("1000000", 18)));

  await Verify.verifyWithArgs(weth.address, ["Wrapped Ether", "WETH", 18]);
  await Verify.verifyWithArgs(usdc.address, ["USD Coin", "USDC", 6]);
  await Verify.verifyWithArgs(usdt.address, ["Tether USD", "USDT", 6]);
  await Verify.verifyWithArgs(mim.address, ["Magic Internet Money", "MIM", 18]);
  await Verify.verifyWithArgs(dai.address, ["Dai Stablecoin", "DAI", 18]);

  log.info("weth:", weth.address);
  log.info("usdc:", usdc.address);
  log.info("usdt:", usdt.address);
  log.info("mim:", mim.address);
  log.info("dai:", dai.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
