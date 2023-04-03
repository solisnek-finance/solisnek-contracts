import { ethers, upgrades } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { log } from "./log";
import { BigNumberish, ContractFactory, utils } from "ethers";
import {
  Deployer,
  FeeDistributorFactory,
  GaugeFactory,
  PairFactory,
  FeeDistributor,
  Minter,
  Pair,
  RewardsDistributor,
  Router,
  Snek,
  SnekLibrary,
  VeArtProxy,
  Voter,
  VotingEscrow,
  TransparentUpgradeableProxy__factory,
} from "../../typechain-types";
import assert from "assert";
import { Misc } from "./misc";

export class Deploy {
  // ************ Deploy using account **************************

  public static async deployContract(
    signer: SignerWithAddress,
    name: string,
    // tslint:disable-next-line:no-any
    ...args: any[]
  ) {
    log.info(`deploying contract ${name}`);
    return this.deploy(false, signer, name, ...args);
  }

  public static async deployProxy(
    signer: SignerWithAddress,
    name: string,
    // tslint:disable-next-line:no-any
    ...args: any[]
  ) {
    log.info(`deploying proxy ${name}`);
    return this.deploy(true, signer, name, ...args);
  }

  public static async deploy<T extends ContractFactory>(
    proxy: boolean,
    signer: SignerWithAddress,
    name: string,
    // tslint:disable-next-line:no-any
    ...args: any[]
  ) {
    log.info("account balance: " + utils.formatUnits(await signer.getBalance(), 18));
    let _factory = (await ethers.getContractFactory(name, signer)) as T;
    const instance = proxy ? await upgrades.deployProxy(_factory, args) : await _factory.deploy(...args);
    log.info("deploy tx:", instance.deployTransaction.hash);
    await instance.deployed();

    const receipt = await ethers.provider.getTransactionReceipt(instance.deployTransaction.hash);
    log.info("receipt:", receipt.contractAddress);
    return _factory.attach(receipt.contractAddress);
  }

  // ************ Deploy using contract **************************

  public static async deployProxyWithDeployer(deployer: Deployer, logic: string, admin: string, salt: BigNumberish) {
    const signer = deployer.signer;
    log.info("account balance: " + utils.formatUnits(await signer.getBalance(), 18));
    log.info(`deploying oz proxy with deployer contract`);

    const precomputedAddress = this.precomputeAddress(deployer.address, logic, admin, salt);
    const tx = await deployer.deployProxy(logic, admin, salt);
    const receipt = await tx.wait(2);
    let deployedAddress = "";
    for (let i = 0; i < receipt.logs.length; i++) {
      if (receipt.logs[i].topics[0] == "0x1dc05c1d6a563dddb6c22082af72b54ec2f0207ceb55db5d13cdabc208f303a9") {
        deployedAddress = ethers.utils.getAddress(receipt.logs[i].topics[1]?.slice(26));
      }
    }
    log.info("deploy proxy tx:", receipt.transactionHash);
    log.info("deployed proxy address:", deployedAddress);
    assert.equal(deployedAddress, precomputedAddress);

    return deployedAddress;
  }

  public static async deployProxiesWithDeployer(
    deployer: Deployer,
    logics: string[],
    admin: string,
    salts: BigNumberish[]
  ) {
    const signer = deployer.signer;
    log.info("account balance: " + utils.formatUnits(await signer.getBalance(), 18));
    log.info(`deploying oz proxies with deployer contract`);

    const precomputedAddresses = this.precomputeAddresses(deployer.address, logics, admin, salts);
    const tx = await deployer.deployProxies(logics, admin, salts);
    const receipt = await tx.wait(2);
    let deployedAddresses: string[] = [];
    for (let i = 0; i < receipt.logs.length; i++) {
      if (receipt.logs[i].topics[0] == "0x1dc05c1d6a563dddb6c22082af72b54ec2f0207ceb55db5d13cdabc208f303a9") {
        deployedAddresses.push(ethers.utils.getAddress(receipt.logs[i].topics[1]?.slice(26)));
      }
    }
    log.info("deploy proxy tx:", receipt.transactionHash);
    log.info("deployed proxy addresses:", deployedAddresses);

    assert.equal(deployedAddresses.length, precomputedAddresses.length);
    for (let i = 0; i < precomputedAddresses.length; i++) {
      assert.equal(deployedAddresses[i], precomputedAddresses[i]);
    }

    return deployedAddresses;
  }

  public static precomputeAddress(deployerAddress: string, logic: string, admin: string, salt: BigNumberish) {
    const saltBytes = ethers.utils.hexZeroPad(ethers.utils.hexlify(salt), 32);
    const constructorBytes = ethers.utils.defaultAbiCoder.encode(["address", "address", "bytes"], [logic, admin, []]);
    const initCodeHash = ethers.utils.keccak256(
      ethers.utils.solidityPack(["bytes", "bytes"], [TransparentUpgradeableProxy__factory.bytecode, constructorBytes])
    );
    return ethers.utils.getCreate2Address(deployerAddress, saltBytes, initCodeHash);
  }

  public static precomputeAddresses(deployerAddress: string, logics: string[], admin: string, salts: BigNumberish[]) {
    let addresses: string[] = [];
    for (let i = 0; i < salts.length; i++) {
      const saltBytes = ethers.utils.hexZeroPad(ethers.utils.hexlify(salts[i]), 32);
      const constructorBytes = ethers.utils.defaultAbiCoder.encode(
        ["address", "address", "bytes"],
        [logics[i], admin, []]
      );
      const initCodeHash = ethers.utils.keccak256(
        ethers.utils.solidityPack(["bytes", "bytes"], [TransparentUpgradeableProxy__factory.bytecode, constructorBytes])
      );
      addresses.push(ethers.utils.getCreate2Address(deployerAddress, saltBytes, initCodeHash));
    }
    return addresses;
  }

  // ************ Deploy implementation **************************

  public static async deployFeeDistributorFactory(signer: SignerWithAddress) {
    return (await Deploy.deployContract(signer, "FeeDistributorFactory")) as FeeDistributorFactory;
  }

  public static async deployGaugeFactory(signer: SignerWithAddress) {
    return (await Deploy.deployContract(signer, "GaugeFactory")) as GaugeFactory;
  }

  public static async deployPairFactory(signer: SignerWithAddress) {
    return (await Deploy.deployContract(signer, "PairFactory")) as PairFactory;
  }

  public static async deployFeeDistributor(signer: SignerWithAddress) {
    return (await Deploy.deployContract(signer, "FeeDistributor")) as FeeDistributor;
  }

  public static async deployMinter(signer: SignerWithAddress) {
    return (await Deploy.deployContract(signer, "Minter")) as Minter;
  }

  public static async deployPair(signer: SignerWithAddress) {
    return (await Deploy.deployContract(signer, "Pair")) as Pair;
  }

  public static async deployRewardsDistributor(signer: SignerWithAddress) {
    return (await Deploy.deployContract(signer, "RewardsDistributor")) as RewardsDistributor;
  }

  public static async deployRouter(signer: SignerWithAddress) {
    return (await Deploy.deployContract(signer, "Router")) as Router;
  }

  public static async deploySnek(signer: SignerWithAddress) {
    return (await Deploy.deployContract(signer, "Snek")) as Snek;
  }

  public static async deploySnekLibrary(signer: SignerWithAddress) {
    return (await Deploy.deployContract(signer, "SnekLibrary")) as SnekLibrary;
  }

  public static async deployVeArtProxy(signer: SignerWithAddress) {
    return (await Deploy.deployContract(signer, "VeArtProxy")) as VeArtProxy;
  }

  public static async deployVoter(signer: SignerWithAddress) {
    return (await Deploy.deployContract(signer, "Voter")) as Voter;
  }

  public static async deployVotingEscrow(signer: SignerWithAddress) {
    return (await Deploy.deployContract(signer, "VotingEscrow")) as VotingEscrow;
  }

  public static async deployLogics(signer: SignerWithAddress) {
    const periodMs = 1_000;

    const feeDistributorFactory = await this.deployFeeDistributorFactory(signer);
    await Misc.delay(periodMs);

    const gaugeFactory = await this.deployGaugeFactory(signer);
    await Misc.delay(periodMs);

    const pairFactory = await this.deployPairFactory(signer);
    await Misc.delay(periodMs);

    const minter = await this.deployMinter(signer);
    await Misc.delay(periodMs);

    const pair = await this.deployPair(signer);
    await Misc.delay(periodMs);

    const rewardsDistributor = await this.deployRewardsDistributor(signer);
    await Misc.delay(periodMs);

    const router = await this.deployRouter(signer);
    await Misc.delay(periodMs);

    const snek = await this.deploySnek(signer);
    await Misc.delay(periodMs);

    const snekLibrary = await this.deploySnekLibrary(signer);
    await Misc.delay(periodMs);

    const veArtProxy = await this.deployVeArtProxy(signer);
    await Misc.delay(periodMs);

    const voter = await this.deployVoter(signer);
    await Misc.delay(periodMs);

    const votingEscrow = await this.deployVotingEscrow(signer);
    await Misc.delay(periodMs);

    return new CoreAddresses(
      feeDistributorFactory,
      gaugeFactory,
      pairFactory,
      minter,
      pair,
      rewardsDistributor,
      router,
      snek,
      snekLibrary,
      veArtProxy,
      voter,
      votingEscrow
    );
  }
}

export class CoreAddresses {
  readonly feeDistributorFactory: FeeDistributorFactory;
  readonly gaugeFactory: GaugeFactory;
  readonly pairFactory: PairFactory;
  readonly minter: Minter;
  readonly pair: Pair;
  readonly rewardsDistributor: RewardsDistributor;
  readonly router: Router;
  readonly snek: Snek;
  readonly snekLibrary: SnekLibrary;
  readonly veArtProxy: VeArtProxy;
  readonly voter: Voter;
  readonly votingEscrow: VotingEscrow;

  constructor(
    feeDistributorFactory: FeeDistributorFactory,
    gaugeFactory: GaugeFactory,
    pairFactory: PairFactory,
    minter: Minter,
    pair: Pair,
    rewardsDistributor: RewardsDistributor,
    router: Router,
    snek: Snek,
    snekLibrary: SnekLibrary,
    veArtProxy: VeArtProxy,
    voter: Voter,
    votingEscrow: VotingEscrow
  ) {
    this.feeDistributorFactory = feeDistributorFactory;
    this.gaugeFactory = gaugeFactory;
    this.pairFactory = pairFactory;
    this.minter = minter;
    this.pair = pair;
    this.rewardsDistributor = rewardsDistributor;
    this.router = router;
    this.snek = snek;
    this.snekLibrary = snekLibrary;
    this.veArtProxy = veArtProxy;
    this.voter = voter;
    this.votingEscrow = votingEscrow;
  }
}
