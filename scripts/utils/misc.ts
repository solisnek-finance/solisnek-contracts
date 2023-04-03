import hre from "hardhat";
import { ethers } from "hardhat";
import { BigNumber, ContractTransaction } from "ethers";
import { log } from "./log";

export class Misc {
  public static readonly MAX_UINT = BigNumber.from(
    "115792089237316195423570985008687907853269984665640564039457584007913129639935"
  );
  public static readonly SECONDS_OF_DAY = 60 * 60 * 24;
  public static readonly SECONDS_OF_YEAR = Misc.SECONDS_OF_DAY * 365;
  public static readonly ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

  public static printDuration(text: string, start: number) {
    log.info(">>>" + text, ((Date.now() - start) / 1000).toFixed(1), "sec");
  }

  public static async runAndWait(callback: () => Promise<ContractTransaction>, stopOnError = true, wait = true) {
    const start = Date.now();
    const tr = await callback();
    if (!wait) {
      Misc.printDuration("runAndWait completed", start);
      return;
    }
    await Misc.wait(1);

    log.info("tx sent", tr.hash);

    let receipt;
    while (true) {
      receipt = await ethers.provider.getTransactionReceipt(tr.hash);
      if (!!receipt) {
        break;
      }
      log.info("not yet complete", tr.hash);
      await Misc.delay(5000);
    }
    log.info("transaction result", tr.hash, receipt?.status);
    log.info("gas used", receipt.gasUsed.toString());
    if (receipt?.status !== 1 && stopOnError) {
      throw Error("Wrong status!");
    }
    Misc.printDuration("runAndWait completed", start);
  }

  public static async impersonate(address: string) {
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [address],
    });

    await hre.network.provider.request({
      method: "hardhat_setBalance",
      params: [address, "0x1431E0FAE6D7217CAA0000000"],
    });
    console.log("address impersonated", address);
    return ethers.getSigner(address);
  }

  // ****************** WAIT ******************

  public static async delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  public static async wait(blocks: number) {
    if (hre.network.name === "hardhat" || blocks === 0) {
      return;
    }
    const start = ethers.provider.blockNumber;
    while (true) {
      log.info("wait 5sec");
      await Misc.delay(5000);
      if (ethers.provider.blockNumber >= start + blocks) {
        break;
      }
    }
  }
}
