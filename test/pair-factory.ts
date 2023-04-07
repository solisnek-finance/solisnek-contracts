import { PairFactory, Pair__factory, TestToken } from "../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers, upgrades } from "hardhat";
import chai from "chai";
import { Deploy } from "../scripts/utils/deploy";
import { Time } from "../scripts/utils/time";
import { Misc } from "../scripts/utils/misc";

const { expect } = chai;

describe("factory tests", function () {
  let snapshotBefore: string;
  let snapshot: string;

  let owner: SignerWithAddress;
  let owner2: SignerWithAddress;
  let factory: PairFactory;
  let weth: TestToken;
  let usdc: TestToken;

  before(async function () {
    snapshotBefore = await Time.snapshot();
    [owner, owner2] = await ethers.getSigners();
    weth = (await Deploy.deployContract(owner, "TestToken", "WETH", "WETH", 18)) as TestToken;
    usdc = (await Deploy.deployContract(owner, "TestToken", "USDC", "USDC", 6)) as TestToken;
    const proxyAdmin = await upgrades.deployProxyAdmin(owner);
    const pairLogic = await Deploy.deployPair(owner);
    const voter = await Deploy.deployVoter(owner);
    factory = await Deploy.deployPairFactory(owner);
    await factory.initialize(proxyAdmin, pairLogic.address, voter.address, owner.address);
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

  it("set pauser", async function () {
    await factory.setPauser(owner2.address);
    await factory.connect(owner2).acceptPauser();
    expect(await factory.pauser()).is.eq(owner2.address);
  });

  it("set pauser only from pauser", async function () {
    await expect(factory.connect(owner2).setPauser(owner2.address)).reverted;
  });

  it("accept pauser only from pending pauser", async function () {
    await factory.setPauser(owner2.address);
    await expect(factory.connect(owner).acceptPauser()).reverted;
  });

  it("pause", async function () {
    await factory.setPause(true);
    expect(await factory.isPaused()).is.eq(true);
  });

  it("pause only from pauser", async function () {
    await expect(factory.connect(owner2).setPause(true)).reverted;
  });

  it("create pair revert with the same tokens", async function () {
    await expect(factory.createPair(Misc.ZERO_ADDRESS, Misc.ZERO_ADDRESS, true)).revertedWith("IA");
  });

  it("create pair revert with the zero token", async function () {
    await expect(factory.createPair(weth.address, Misc.ZERO_ADDRESS, true)).revertedWith("ZA");
  });

  it("set fees revert ", async function () {
    await expect(factory.connect(owner2).setPairFee(weth.address, 1)).revertedWith("not fee manager");
  });

  it("check created pair variables", async function () {
    await factory.createPair(weth.address, usdc.address, false);
    await factory.createPair(weth.address, usdc.address, true);
    await expect(factory.createPair(weth.address, usdc.address, true)).revertedWith("PE");
    const pairAdr = await factory.getPair(weth.address, usdc.address, true);
    const pair = Pair__factory.connect(pairAdr, owner);
    expect(await pair.fees()).not.eq(Misc.ZERO_ADDRESS);
    expect(await pair.stable()).eq(true);
  });
});
