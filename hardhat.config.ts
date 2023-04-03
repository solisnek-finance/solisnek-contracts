import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades";
import { config as dotEnvConfig } from "dotenv";

dotEnvConfig();
// tslint:disable-next-line:no-var-requires
const argv = require("yargs/yargs")()
  .env("")
  .options({
    avalancheRpcUrl: {
      type: "string",
      default: "https://api.avax.network/ext/bc/C/rpc",
    },
    fujiRpcUrl: {
      type: "string",
      default: "https://rpc.ankr.com/avalanche_fuji",
    },
    privateKey: {
      type: "string",
      default: "b55c9fcc2c60993e5c539f37ffd27d2058e7f77014823b461323db5eba817518", // random account
    },
    snowtraceScanKey: {
      type: "string",
      default: "",
    },
  }).argv;

const config: HardhatUserConfig = {
  networks: {
    avalanche: {
      url: argv.avalancheRpcUrl || "",
      chainId: 43114,
      accounts: [argv.privateKey],
    },
    fuji: {
      url: argv.fujiRpcUrl || "",
      chainId: 43113,
      accounts: [argv.privateKey],
    },
  },
  etherscan: {
    apiKey: {
      avalanche: argv.snowtraceScanKey,
      avalancheFujiTestnet: argv.snowtraceScanKey,
    },
  },
  solidity: {
    version: "0.8.18",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
};

export default config;
