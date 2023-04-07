import { PairFactory, Pair__factory, Router, SnekLibrary, TestToken } from "../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers, upgrades } from "hardhat";
import hre from "hardhat";
import chai from "chai";
import { Deploy } from "../scripts/utils/deploy";
import { Time } from "../scripts/utils/time";
import { TestHelper } from "../scripts/utils/test-helper";
import { BigNumber, utils } from "ethers";
import { formatUnits, parseUnits } from "ethers/lib/utils";
import { Misc } from "../scripts/utils/misc";

const { expect } = chai;

describe("router tests", function () {
  let snapshotBefore: string;
  let snapshot: string;

  let chainId: number;

  let owner: SignerWithAddress;
  let owner2: SignerWithAddress;
  let factory: PairFactory;
  let router: Router;

  let weth: TestToken;
  let ust: TestToken;
  let mim: TestToken;
  let dai: TestToken;
  let swapLib: SnekLibrary;

  before(async function () {
    snapshotBefore = await Time.snapshot();
    chainId = hre.network.config.chainId as number;
    [owner, owner2] = await ethers.getSigners();
    weth = (await Deploy.deployContract(owner, "TestToken", "WETH", "WETH", 18)) as TestToken;
    await weth.mint(owner.address, parseUnits("1000"));
    factory = await Deploy.deployPairFactory(owner);
    router = await Deploy.deployRouter(owner);
    swapLib = await Deploy.deploySnekLibrary(owner);

    const proxyAdmin = await upgrades.deployProxyAdmin(owner);
    const pairLogic = await Deploy.deployPair(owner);
    const voter = await Deploy.deployVoter(owner);
    await factory.initialize(proxyAdmin, pairLogic.address, voter.address, owner.address);
    await factory.setPause(false);
    await factory.setPairCreationPaused(false);
    await router.initialize(factory.address, weth.address);
    await swapLib.initialize(router.address);

    [ust, mim, dai] = await TestHelper.createMockTokensAndMint(owner);
    await ust.transfer(owner2.address, utils.parseUnits("100", 6));
    await mim.transfer(owner2.address, utils.parseUnits("100"));
    await dai.transfer(owner2.address, utils.parseUnits("100"));
  });

  after(async function () {
    await Time.rollback(snapshotBefore);
  });

  beforeEach(async function () {
    snapshot = await Time.snapshot();
  });

  afterEach(async function () {
    await Time.rollback(snapshot);
  });

  it("quoteAddLiquidity on empty pair", async function () {
    await router.quoteAddLiquidity(mim.address, ust.address, true, parseUnits("1"), parseUnits("1", 6));
  });

  it("quoteAddLiquidity on exist pair", async function () {
    await TestHelper.addLiquidity(
      factory,
      router,
      owner,
      mim.address,
      ust.address,
      utils.parseUnits("1"),
      utils.parseUnits("1", 6),
      true
    );

    await router.quoteAddLiquidity(mim.address, ust.address, true, parseUnits("1"), parseUnits("10", 6));
  });

  it("quoteAddLiquidity on exist pair2", async function () {
    await TestHelper.addLiquidity(
      factory,
      router,
      owner,
      mim.address,
      ust.address,
      utils.parseUnits("1"),
      utils.parseUnits("1", 6),
      true
    );

    await router.quoteAddLiquidity(mim.address, ust.address, true, parseUnits("10"), parseUnits("1", 6));
  });

  it("quoteRemoveLiquidity on empty pair", async function () {
    await router.quoteRemoveLiquidity(mim.address, ust.address, true, parseUnits("1"));
  });

  it("addLiquidityETH test", async function () {
    await mim.approve(router.address, parseUnits("1"));
    await router.addLiquidityETH(mim.address, true, parseUnits("1"), 0, parseUnits("1"), owner.address, 99999999999, {
      value: parseUnits("10"),
    });
  });

  it("removeLiquidityETH test", async function () {
    await mim.approve(router.address, parseUnits("1"));
    await router.addLiquidityETH(mim.address, true, parseUnits("1"), 0, parseUnits("1"), owner.address, 99999999999, {
      value: parseUnits("10"),
    });

    const pairAdr = await factory.getPair(mim.address, weth.address, true);

    await Pair__factory.connect(pairAdr, owner).approve(router.address, parseUnits("1111"));
    await router.removeLiquidityETH(mim.address, true, parseUnits("0.1"), 0, 0, owner.address, 99999999999);
  });

  it("removeLiquidityWithPermit test", async function () {
    await mim.approve(router.address, parseUnits("1"));
    await router.addLiquidityETH(mim.address, true, parseUnits("1"), 0, parseUnits("1"), owner.address, 99999999999, {
      value: parseUnits("10"),
    });

    const pairAdr = await factory.getPair(mim.address, weth.address, true);
    const pair = Pair__factory.connect(pairAdr, owner);
    const { v, r, s } = await TestHelper.permitForPair(chainId, owner, pair, router.address, parseUnits("0.1"));

    await router.removeLiquidityWithPermit(
      mim.address,
      weth.address,
      true,
      parseUnits("0.1"),
      0,
      0,
      owner.address,
      99999999999,
      false,
      v,
      r,
      s
    );
  });

  it("removeLiquidityETHWithPermit test", async function () {
    await mim.approve(router.address, parseUnits("1"));
    await router.addLiquidityETH(mim.address, true, parseUnits("1"), 0, parseUnits("1"), owner.address, 99999999999, {
      value: parseUnits("10"),
    });

    const pairAdr = await factory.getPair(mim.address, weth.address, true);
    const pair = Pair__factory.connect(pairAdr, owner);

    const { v, r, s } = await TestHelper.permitForPair(chainId, owner, pair, router.address, parseUnits("0.1"));

    await router.removeLiquidityETHWithPermit(
      mim.address,
      true,
      parseUnits("0.1"),
      0,
      0,
      owner.address,
      99999999999,
      false,
      v,
      r,
      s
    );
  });

  it("swapExactTokensForTokensSimple test", async function () {
    await mim.approve(router.address, parseUnits("10"));

    await router.addLiquidityETH(mim.address, true, parseUnits("1"), 0, parseUnits("1"), owner.address, 99999999999, {
      value: parseUnits("10"),
    });

    await router.swapExactTokensForTokensSimple(
      parseUnits("0.1"),
      0,
      mim.address,
      weth.address,
      true,
      owner.address,
      99999999999
    );
  });

  it("swapExactTokensForETH test", async function () {
    await mim.approve(router.address, parseUnits("10"));

    await router.addLiquidityETH(mim.address, true, parseUnits("1"), 0, parseUnits("1"), owner.address, 99999999999, {
      value: parseUnits("10"),
    });

    await router.swapExactTokensForETH(
      parseUnits("0.1"),
      0,
      [
        {
          from: mim.address,
          to: weth.address,
          stable: true,
        },
      ],
      owner.address,
      99999999999
    );
  });

  it("UNSAFE_swapExactTokensForTokens test", async function () {
    await mim.approve(router.address, parseUnits("10"));

    await router.addLiquidityETH(mim.address, true, parseUnits("1"), 0, parseUnits("1"), owner.address, 99999999999, {
      value: parseUnits("10"),
    });

    await router.UNSAFE_swapExactTokensForTokens(
      [parseUnits("0.1"), parseUnits("0.1")],
      [
        {
          from: mim.address,
          to: weth.address,
          stable: true,
        },
      ],
      owner.address,
      99999999999
    );
  });

  it("swapExactETHForTokens test", async function () {
    await mim.approve(router.address, parseUnits("10"));

    await router.addLiquidityETH(mim.address, true, parseUnits("1"), 0, parseUnits("1"), owner.address, 99999999999, {
      value: parseUnits("10"),
    });

    await router.swapExactETHForTokens(
      0,
      [
        {
          from: weth.address,
          to: mim.address,
          stable: true,
        },
      ],
      owner.address,
      99999999999,
      { value: parseUnits("0.1") }
    );
  });

  it("getExactAmountOut test", async function () {
    expect((await router.getAmountOut(parseUnits("0.1"), mim.address, weth.address))[0]).is.eq(0);

    await mim.approve(router.address, parseUnits("10"));

    await router.addLiquidityETH(mim.address, true, parseUnits("1"), 0, parseUnits("1"), owner.address, 99999999999, {
      value: parseUnits("1"),
    });

    expect((await router.getAmountOut(parseUnits("0.1"), mim.address, weth.address))[0]).is.not.eq(0);
  });

  it("deadline reject", async function () {
    await expect(
      router.addLiquidityETH(mim.address, true, parseUnits("1"), 0, parseUnits("1"), owner.address, 1, {
        value: parseUnits("10"),
      })
    ).revertedWith("Router: EXPIRED");
  });

  it("sort tokens identical address", async function () {
    await expect(router.sortTokens(mim.address, mim.address)).revertedWith("Router: IDENTICAL_ADDRESSES");
  });

  it("sort tokens zero address", async function () {
    await expect(router.sortTokens(mim.address, Misc.ZERO_ADDRESS)).revertedWith("Router: ZERO_ADDRESS_PROHIBITED");
  });

  it("getAmountOut for not exist pair", async function () {
    expect((await router.getAmountOut(0, mim.address, dai.address))[0]).eq(0);
  });

  it("receive eth not from weth reject", async function () {
    await expect(owner.sendTransaction({ value: 1, to: router.address })).reverted;
  });

  it("getReserves", async function () {
    await TestHelper.addLiquidity(
      factory,
      router,
      owner,
      mim.address,
      ust.address,
      utils.parseUnits("1"),
      utils.parseUnits("1", 6),
      true
    );
    await router.getReserves(mim.address, ust.address, true);
  });

  it("getAmountsOut wrong path", async function () {
    await expect(router.getAmountsOut(0, [])).revertedWith("Router: INVALID_PATH");
  });

  it("getAmountsOut with not exist pair", async function () {
    expect(
      (
        await router.getAmountsOut(0, [
          {
            from: weth.address,
            to: mim.address,
            stable: false,
          },
        ])
      )[0]
    ).eq(0);
  });

  it("add liquidity amount desired check", async function () {
    await expect(
      router.addLiquidityETH(
        mim.address,
        true,
        parseUnits("1"),
        parseUnits("100"),
        parseUnits("1"),
        owner.address,
        99999999999,
        { value: parseUnits("10") }
      )
    ).reverted;
    await expect(
      router.addLiquidityETH(mim.address, true, parseUnits("1"), 0, parseUnits("1000"), owner.address, 99999999999, {
        value: parseUnits("10"),
      })
    ).reverted;
  });

  it("add liquidity IA check", async function () {
    await TestHelper.addLiquidity(
      factory,
      router,
      owner,
      mim.address,
      weth.address,
      utils.parseUnits("1"),
      utils.parseUnits("1"),
      true
    );

    await expect(
      router.addLiquidityETH(
        mim.address,
        true,
        parseUnits("0.037"),
        parseUnits("0.037"),
        parseUnits("0.77"),
        owner.address,
        99999999999,
        { value: parseUnits("0.77") }
      )
    ).revertedWith("Router: INSUFFICIENT_B_AMOUNT");

    await expect(
      router.addLiquidityETH(
        mim.address,
        true,
        parseUnits("0.037"),
        parseUnits("0.037"),
        parseUnits("0.01"),
        owner.address,
        99999999999,
        { value: parseUnits("0.01") }
      )
    ).revertedWith("Router: INSUFFICIENT_A_AMOUNT");
  });

  it("addLiquidityETH send back dust", async function () {
    await TestHelper.addLiquidity(
      factory,
      router,
      owner,
      mim.address,
      weth.address,
      utils.parseUnits("1"),
      utils.parseUnits("1"),
      true
    );

    await mim.approve(router.address, parseUnits("10"));
    await router.addLiquidityETH(mim.address, true, parseUnits("1"), 0, 0, owner.address, 99999999999, {
      value: parseUnits("10"),
    });
  });

  it("remove Liquidity IA test", async function () {
    await mim.approve(router.address, parseUnits("1"));
    await router.addLiquidityETH(mim.address, true, parseUnits("1"), 0, parseUnits("1"), owner.address, 99999999999, {
      value: parseUnits("10"),
    });

    const pairAdr = await factory.getPair(mim.address, weth.address, true);

    await Pair__factory.connect(pairAdr, owner).approve(router.address, parseUnits("1111"));
    await expect(
      router.removeLiquidity(
        mim.address,
        weth.address,
        true,
        parseUnits("0.1"),
        parseUnits("0.1"),
        0,
        owner.address,
        99999999999
      )
    ).revertedWith("Router: INSUFFICIENT_A_AMOUNT");
    await expect(
      router.removeLiquidity(
        mim.address,
        weth.address,
        true,
        parseUnits("0.1"),
        0,
        parseUnits("1"),
        owner.address,
        99999999999
      )
    ).revertedWith("Router: INSUFFICIENT_B_AMOUNT");
  });

  it("swapExactTokensForTokensSimple IOA test", async function () {
    await expect(
      router.swapExactTokensForTokensSimple(
        parseUnits("0.1"),
        parseUnits("0.1"),
        mim.address,
        weth.address,
        true,
        owner.address,
        BigNumber.from("999999999999999999")
      )
    ).revertedWith("Router: INSUFFICIENT_OUTPUT_AMOUNT");
  });

  it("swapExactTokensForTokens IOA test", async function () {
    await expect(
      router.swapExactTokensForTokens(
        parseUnits("0.1"),
        parseUnits("0.1"),
        [
          {
            from: mim.address,
            to: weth.address,
            stable: true,
          },
        ],
        owner.address,
        BigNumber.from("999999999999999999")
      )
    ).revertedWith("Router: INSUFFICIENT_OUTPUT_AMOUNT");
  });

  it("swapExactETHForTokens IOA test", async function () {
    await expect(
      router.swapExactETHForTokens(
        parseUnits("0.1"),
        [
          {
            to: mim.address,
            from: weth.address,
            stable: true,
          },
        ],
        owner.address,
        BigNumber.from("999999999999999999")
      )
    ).revertedWith("Router: INSUFFICIENT_OUTPUT_AMOUNT");
  });

  it("swapExactETHForTokens IP test", async function () {
    await expect(
      router.swapExactETHForTokens(
        parseUnits("0.1"),
        [
          {
            from: mim.address,
            to: weth.address,
            stable: true,
          },
        ],
        owner.address,
        BigNumber.from("999999999999999999")
      )
    ).revertedWith("Router: INVALID_PATH");
  });

  it("swapExactTokensForETH IOA test", async function () {
    await expect(
      router.swapExactTokensForETH(
        parseUnits("0.1"),
        parseUnits("0.1"),
        [
          {
            from: mim.address,
            to: weth.address,
            stable: true,
          },
        ],
        owner.address,
        BigNumber.from("999999999999999999")
      )
    ).revertedWith("Router: INSUFFICIENT_OUTPUT_AMOUNT");
  });

  it("swapExactTokensForETH IP test", async function () {
    await expect(
      router.swapExactTokensForETH(
        parseUnits("0.1"),
        parseUnits("0.1"),
        [
          {
            to: mim.address,
            from: weth.address,
            stable: true,
          },
        ],
        owner.address,
        BigNumber.from("999999999999999999")
      )
    ).revertedWith("Router: INVALID_PATH");
  });

  it("router with broken eth should revert", async function () {
    await check(owner, router, mim, weth, swapLib, true);
  });

  it("swap library volatile test", async function () {
    await check(owner, router, mim, weth, swapLib, false);
  });
});

async function check(
  owner: SignerWithAddress,
  router: Router,
  tokenIn: TestToken,
  weth: TestToken,
  swapLib: SnekLibrary,
  stable: boolean
) {
  await tokenIn.approve(router.address, parseUnits("10"));

  await router.addLiquidityETH(
    tokenIn.address,
    stable,
    parseUnits("1"),
    0,
    parseUnits("1"),
    owner.address,
    99999999999,
    { value: parseUnits("10") }
  );

  let data = await swapLib["getTradeDiff(uint256,address,address,bool)"](
    parseUnits("1"),
    tokenIn.address,
    weth.address,
    stable
  );
  if (stable) {
    expect(formatUnits(data.a)).eq("3.22020182710050887");
    expect(formatUnits(data.b)).eq("2.204033780209746315");
  } else {
    expect(formatUnits(data.a)).eq("9.0909090909090909");
    expect(formatUnits(data.b)).eq("5.0");
  }

  data = await swapLib["getTradeDiff(uint256,address,address,bool)"](
    parseUnits("1"),
    tokenIn.address,
    weth.address,
    stable
  );

  if (stable) {
    expect(formatUnits(data.a)).eq("3.22020182710050887");
    expect(formatUnits(data.b)).eq("2.204033780209746315");
  } else {
    expect(formatUnits(data.a)).eq("9.0909090909090909");
    expect(formatUnits(data.b)).eq("5.0");
  }

  const balWeth0 = await weth.balanceOf(owner.address);
  await router.swapExactTokensForTokens(
    10_000,
    0,
    [
      {
        from: tokenIn.address,
        to: weth.address,
        stable,
      },
    ],
    owner.address,
    99999999999
  );
  const balWethAfter0 = await weth.balanceOf(owner.address);
  const getWeth0 = +formatUnits(balWethAfter0.sub(balWeth0)) * (1e18 / 10_000);
  if (stable) {
    expect(getWeth0).eq(3.4212);
  } else {
    expect(getWeth0).eq(9.9799);
  }

  const balWeth = await weth.balanceOf(owner.address);
  await router.swapExactTokensForTokens(
    parseUnits("1"),
    0,
    [
      {
        from: tokenIn.address,
        to: weth.address,
        stable,
      },
    ],
    owner.address,
    99999999999
  );
  const balWethAfter = await weth.balanceOf(owner.address);
  const getWeth = formatUnits(balWethAfter.sub(balWeth));
  if (stable) {
    expect(getWeth).eq("2.203729271003164159");
  } else {
    expect(getWeth).eq("4.994994994994920195");
  }
}
