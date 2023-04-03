import { ethers } from "hardhat";
import { formatUnits, parseUnits } from "ethers/lib/utils";
import { PairFactory__factory, Router__factory } from "../../typechain-types";
import { TestHelper } from "../utils/test-helper";
import { log } from "../utils/log";

const tokenA = "0xd00ae08403B9bbb9124bB305C09058E32C39A48c";
const tokenB = "0x8530f66241E47eE93dbDd3542455889f9f12FA6E";
const isStable = false;
const amountA = parseUnits("10", 18);
const amountB = parseUnits("173", 6);

async function main() {
  const signer = (await ethers.getSigners())[0];
  log.info(`adding liquidity (${formatUnits(amountA)}, ${formatUnits(amountB, 6)}) for (tokenA, tokenB)`);
  log.info("tokenA balance:", formatUnits(await TestHelper.getErc20Balance(signer.address, tokenA), 18));
  log.info("tokenB balance:", formatUnits(await TestHelper.getErc20Balance(signer.address, tokenB), 6));

  const factoryAddress = "0xeeeee07510d6c098caeF8dA4CE73F3F66020BCFB";
  const routerAddress = "0xeeeee61833e76a9A03092a12aA5f58A5e3505FA6";

  const factory = PairFactory__factory.connect(factoryAddress, signer);
  const router = Router__factory.connect(routerAddress, signer);

  const pair = await TestHelper.addLiquidity(factory, router, signer, tokenA, tokenB, amountA, amountB, isStable);

  console.log(formatUnits(await pair.reserve0(), 6));
  console.log(formatUnits(await pair.reserve1()));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
