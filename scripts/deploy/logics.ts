import { ethers } from "hardhat";
import { Deploy } from "../utils/deploy";
import { Verify } from "../utils/verify";
import { Misc } from "../utils/misc";
import { log } from "../utils/log";

async function main() {
  const signer = (await ethers.getSigners())[0];

  const logics = await Deploy.deployLogics(signer);

  await Misc.wait(1);
  await Verify.verify(logics.feeDistributorFactory.address);
  await Verify.verify(logics.gaugeFactory.address);
  await Verify.verify(logics.pairFactory.address);
  await Verify.verify(logics.minter.address);
  await Verify.verify(logics.pair.address);
  await Verify.verify(logics.rewardsDistributor.address);
  await Verify.verify(logics.router.address);
  await Verify.verify(logics.snek.address);
  await Verify.verify(logics.snekLibrary.address);
  await Verify.verify(logics.veArtProxy.address);
  await Verify.verify(logics.voter.address);
  await Verify.verify(logics.votingEscrow.address);

  console.log("logics for deploy/proxies:", [
    logics.feeDistributorFactory.address,
    logics.gaugeFactory.address,
    logics.pairFactory.address,
    logics.minter.address,
    logics.rewardsDistributor.address,
    logics.router.address,
    logics.snek.address,
    logics.snekLibrary.address,
    logics.veArtProxy.address,
    logics.voter.address,
    logics.votingEscrow.address,
  ]);

  log.info("Snek:", logics.snek.address);
  log.info("PairFactory:", logics.pairFactory.address);
  log.info("Pair:", logics.pair.address);
  log.info("Router:", logics.router.address);
  log.info("SnekLibrary:", logics.snekLibrary.address);
  log.info("VeArtProxy:", logics.veArtProxy.address);
  log.info("VotingEscrow:", logics.votingEscrow.address);
  log.info("FeeDistributorFactory:", logics.feeDistributorFactory.address);
  log.info("GaugeFactory:", logics.gaugeFactory.address);
  log.info("Voter:", logics.voter.address);
  log.info("RewardsDistributor:", logics.rewardsDistributor.address);
  log.info("Minter:", logics.minter.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
