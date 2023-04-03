import hre from "hardhat";
import {
  callEtherscanApi,
  EtherscanAPIConfig,
  getEtherscanAPIConfig,
  RESPONSE_OK,
} from "@openzeppelin/hardhat-upgrades/dist/utils/etherscan-api";
import { log } from "./log";

export class Verify {
  public static async verify(address: string) {
    try {
      await hre.run("verify:verify", {
        address,
      });
    } catch (e) {
      log.info("error verify " + e);
    }
  }

  // tslint:disable-next-line:no-any
  public static async verifyWithArgs(address: string, args: any[]) {
    try {
      await hre.run("verify:verify", {
        address,
        constructorArguments: args,
      });
    } catch (e) {
      log.info("error verify " + e);
    }
  }

  // tslint:disable-next-line:no-any
  public static async verifyWithContractName(address: string, contractPath: string, args?: any[]) {
    try {
      await hre.run("verify:verify", {
        address,
        contract: contractPath,
        constructorArguments: args,
      });
    } catch (e) {
      log.info("error verify " + e);
    }
  }

  // tslint:disable-next-line:no-any
  public static async verifyWithArgsAndContractName(address: string, args: any[], contractPath: string) {
    try {
      await hre.run("verify:verify", {
        address,
        constructorArguments: args,
        contract: contractPath,
      });
    } catch (e) {
      log.info("error verify " + e);
    }
  }

  static async checkProxyVerificationStatus(etherscanApi: EtherscanAPIConfig, guid: string) {
    const checkProxyVerificationParams = {
      module: "contract",
      action: "checkproxyverification",
      apikey: etherscanApi.key,
      guid: guid,
    };
    return await callEtherscanApi(etherscanApi, checkProxyVerificationParams);
  }

  public static async linkProxyWithImplementationAbi(proxyAddress: string, implAddress: string) {
    console.log(`Linking proxy ${proxyAddress} with implementation`);
    const params = {
      module: "contract",
      action: "verifyproxycontract",
      address: proxyAddress,
      expectedimplementation: implAddress,
    };
    const etherscanApi = await getEtherscanAPIConfig(hre);
    let responseBody = await callEtherscanApi(etherscanApi, params);

    if (responseBody.status === RESPONSE_OK || (responseBody.result as string).toLowerCase() === "pending in queue") {
      // initial call was OK, but need to send a status request using the returned guid to get the actual verification status
      const guid = responseBody.result;
      responseBody = await this.checkProxyVerificationStatus(etherscanApi, guid);

      while ((responseBody.result as string).toLowerCase() === "pending in queue") {
        await delay(3000);
        responseBody = await this.checkProxyVerificationStatus(etherscanApi, guid);
      }
    }

    if (responseBody.status === RESPONSE_OK) {
      console.log("successfully linked proxy to implementation.");
    } else {
      log.error(`failed to link proxy ${proxyAddress} with its implementation. Reason: ${responseBody.result}`);
    }

    async function delay(ms: number): Promise<void> {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }
  }
}
