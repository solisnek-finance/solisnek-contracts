import { PairFees, TestToken } from "../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";
import chai from "chai";
import { Deploy } from "../scripts/utils/deploy";
import { Time } from "../scripts/utils/time";

const { expect } = chai;

describe("fees tests", function () {
  let snapshotBefore: string;
  let snapshot: string;

  let owner: SignerWithAddress;
  let owner2: SignerWithAddress;
  let fees: PairFees;
  let weth: TestToken;
  let usdc: TestToken;

  before(async function () {
    snapshotBefore = await Time.snapshot();
    [owner, owner2] = await ethers.getSigners();
    weth = (await Deploy.deployContract(owner, "TestToken", "WETH", "WETH", 18)) as TestToken;
    usdc = (await Deploy.deployContract(owner, "TestToken", "USDC", "USDC", 18)) as TestToken;
    fees = (await Deploy.deployContract(owner, "PairFees", weth.address, usdc.address)) as PairFees;
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

  it("only pair allowed test", async function () {
    await expect(fees.connect(owner2).claimFeesFor(owner.address)).reverted;
  });
});
