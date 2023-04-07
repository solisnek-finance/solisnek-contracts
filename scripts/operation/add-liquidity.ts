import { ethers } from "hardhat";
import { formatUnits, parseUnits } from "ethers/lib/utils";
import { PairFactory__factory, Router__factory } from "../../typechain-types";
import { TestHelper } from "../utils/test-helper";
import { log } from "../utils/log";

const tokenA = "0xd00ae08403B9bbb9124bB305C09058E32C39A48c";
const tokenB = "0x8530f66241E47eE93dbDd3542455889f9f12FA6E";
const isStable = false;
const decimalsA = 18;
const decimalsB = 6;
const amountA = parseUnits("10", decimalsA);
const amountB = parseUnits("179", decimalsB);

async function main() {
  const signer = (await ethers.getSigners())[0];
  log.info(
    `adding liquidity (${formatUnits(amountA, decimalsA)}, ${formatUnits(amountB, decimalsB)}) for (tokenA, tokenB)`
  );
  log.info("tokenA balance:", formatUnits(await TestHelper.getErc20Balance(signer.address, tokenA), decimalsA));
  log.info("tokenB balance:", formatUnits(await TestHelper.getErc20Balance(signer.address, tokenB), decimalsB));

  const factoryAddress = "0xeeee175CC85Db8D1245094B0f83e39b0128a8D6B";
  const routerAddress = "0xeeee1b84A9D7F1648ee1537D23E233283B042FA1";

  const factory = PairFactory__factory.connect(factoryAddress, signer);
  const router = Router__factory.connect(routerAddress, signer);

  const pair = await TestHelper.addLiquidity(factory, router, signer, tokenA, tokenB, amountA, amountB, isStable);

  console.log(formatUnits(await pair.reserve0(), decimalsA));
  console.log(formatUnits(await pair.reserve1(), decimalsB));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
