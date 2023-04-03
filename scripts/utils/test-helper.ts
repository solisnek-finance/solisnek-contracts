import { ethers } from "hardhat";
import { BigNumber } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import chai from "chai";

import { PairFactory, Router, Pair__factory, IERC20__factory } from "../../typechain-types";
import { Misc } from "./misc";

const { expect } = chai;

export class TestHelper {
  public static async getErc20Balance(address: string, token: string) {
    const erc20 = (await ethers.getContractFactory("ERC20")).attach(token);
    return erc20.balanceOf(address);
  }

  public static async addLiquidity(
    factory: PairFactory,
    router: Router,
    owner: SignerWithAddress,
    tokenA: string,
    tokenB: string,
    tokenAAmount: BigNumber,
    tokenBAmount: BigNumber,
    stable: boolean
  ) {
    console.log("start add liquidity", tokenA, tokenB);
    TestHelper.gte(await IERC20__factory.connect(tokenA, owner).balanceOf(owner.address), tokenAAmount);
    TestHelper.gte(await IERC20__factory.connect(tokenB, owner).balanceOf(owner.address), tokenBAmount);
    await Misc.runAndWait(() => IERC20__factory.connect(tokenA, owner).approve(router.address, tokenAAmount));
    await Misc.runAndWait(() => IERC20__factory.connect(tokenB, owner).approve(router.address, tokenBAmount));
    await Misc.runAndWait(() =>
      router
        .connect(owner)
        .addLiquidity(tokenA, tokenB, stable, tokenAAmount, tokenBAmount, 0, 0, owner.address, Date.now() + 99999999)
    );
    const address = await factory.getPair(tokenA, tokenB, stable);
    console.log("liquidity added", address);
    return Pair__factory.connect(address, owner);
  }

  public static gte(actual: BigNumber, expected: BigNumber) {
    expect(actual.gte(expected)).is.eq(true, `Expected: ${expected.toString()}, actual: ${actual.toString()}`);
  }
}
