import { ethers } from "hardhat";
import { BigNumberish, Contract } from "ethers";
import { Deploy } from "../utils/deploy";
import { Verify } from "../utils/verify";
import { Misc } from "../utils/misc";
import { log } from "../utils/log";
import {
  VeArtProxy,
  VotingEscrow,
  FeeDistributorFactory,
  GaugeFactory,
  Voter,
  RewardsDistributor,
  Minter,
} from "../../typechain-types";

interface deployItem {
  name: string;
  logic: string;
  salt: BigNumberish;
}

const deployItems: deployItem[] = [
  {
    name: "VeArtProxy",
    logic: "0x9Fe6341Daf8B57e22675d23d7549481a688680f2",
    salt: 500932475, // 0xeeeee9Dd5830Ea2B085e6DB83D9Eb4f12EF0Ab22
  },
  {
    name: "VotingEscrow",
    logic: "0xB0467b567cfB12cE77648864643909d881a8eFCB",
    salt: 203539201, // 0xeeeee84a6d623D26FF27f83f3057B611A36EcB29
  },
  {
    name: "FeeDistributorFactory",
    logic: "0xb51c3DD9051Aa2792575Bd4258D21523E7fea30e",
    salt: 500209138, // 0xeeeee3bd4f3EBD5Dc05Aa842e81A7bCa928436BB
  },
  {
    name: "GaugeFactory",
    logic: "0xe6A99980D6f13F3C692D94a8400104D37f36Ed22",
    salt: 803781385, // 0xeeeee5d9cDDa5aB12B24185078E07eff3b00f040
  },
  {
    name: "Voter",
    logic: "0x0Ac1F24F47Ca47525d76d11b058f5F1664FA0F7B",
    salt: 709347895, // 0xeeeee2BA2825991CCd9E7053712aa852498b71C3
  },
  {
    name: "RewardsDistributor",
    logic: "0x2c5221a49679E5c3Eed696Ab4986E01c5E09b93b",
    salt: 0,
  },
  {
    name: "Minter",
    logic: "0x6F26a2F335C31b7C819Fc55a686444e6b9845965",
    salt: 3760582, // 0xeeeee39137A6474F8A7a23a0866EE13Cb0DB414e
  },
];

const initialSupply = "1000000000000000000000000000"; // 1M

const snek = "0xeeeee991183AF9bF54079B2681CF28B97F1c97e2";
const pairFactoryAddress = "0xeeeee07510d6c098caeF8dA4CE73F3F66020BCFB";
const msig = "0x74D638baa8c073C8528745D0F8fBCB6FCd0fC1a2";
const deployerAddress = "0x3C252a188Aa35D5B08Ca141d79CBDC951Bc160F0";
const proxyAdminAddress = "0xa9B41ce6BD3F781Ead19d33b142270B392e7A5e2";
const weth = "0xd00ae08403b9bbb9124bb305c09058e32c39a48c";

async function main() {
  const signer = (await ethers.getSigners())[0];
  const deployerContract = await ethers.getContractFactory("Deployer", signer);
  const deployer = deployerContract.attach(deployerAddress);

  const logics = deployItems.map((item) => item.logic);
  const salts = deployItems.map((item) => item.salt);
  const proxies = await Deploy.deployProxiesWithDeployer(deployer, logics, proxyAdminAddress, salts);
  deployItems.map((item, idx) => log.info(`proxy ${item.name}:`, proxies[idx]));

  let contracts: { [key: string]: Contract } = {};
  for (let i = 0; i < proxies.length; i++) {
    contracts[deployItems[i].name] = (await ethers.getContractFactory(deployItems[i].name)).attach(proxies[i]);
  }

  await Misc.runAndWait(() => (contracts["VeArtProxy"] as VeArtProxy).initialize());
  await Misc.runAndWait(() =>
    (contracts["VotingEscrow"] as VotingEscrow).initialize(
      snek,
      contracts["VeArtProxy"].address,
      contracts["Voter"].address,
      msig
    )
  );
  await Misc.runAndWait(() =>
    (contracts["FeeDistributorFactory"] as FeeDistributorFactory).initialize(proxyAdminAddress)
  );
  await Misc.runAndWait(() => (contracts["GaugeFactory"] as GaugeFactory).initialize(proxyAdminAddress));
  await Misc.runAndWait(() =>
    (contracts["Voter"] as Voter).initialize(
      contracts["VotingEscrow"].address,
      pairFactoryAddress,
      contracts["GaugeFactory"].address,
      contracts["FeeDistributorFactory"].address,
      contracts["Minter"].address,
      msig,
      []
    )
  );
  await Misc.runAndWait(() =>
    (contracts["RewardsDistributor"] as RewardsDistributor).initialize(
      contracts["VotingEscrow"].address,
      contracts["Minter"].address
    )
  );

  // before run this, change snek minting role to this minter address
  await Misc.runAndWait(() =>
    (contracts["Minter"] as Minter).initialize(
      contracts["Voter"].address,
      contracts["VotingEscrow"].address,
      contracts["RewardsDistributor"].address,
      initialSupply,
      msig
    )
  );

  for (let i = 0; i < proxies.length; i++) {
    await Verify.linkProxyWithImplementationAbi(proxies[i], logics[i]);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
