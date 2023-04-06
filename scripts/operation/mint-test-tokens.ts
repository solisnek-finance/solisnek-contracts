import { ethers } from "hardhat";
import { Misc } from "../utils/misc";
import { log } from "../utils/log";

const receiver = "0x84370B7590211cCea48B659A539A9Bc27C9f3CE3";
const amount = "10000000";

interface token {
  symbol: string;
  address: string;
  decimals: number;
}

const tokens: token[] = [
  {
    symbol: "WETH",
    address: "0xB124CD5F735810B3C672A4a0a208f0aAEF861201",
    decimals: 18,
  },
  {
    symbol: "USDC",
    address: "0x8530f66241E47eE93dbDd3542455889f9f12FA6E",
    decimals: 6,
  },
  {
    symbol: "USDT",
    address: "0x3Bb3dA843522f65b18d1E23d63124AA035f9A3D1",
    decimals: 6,
  },
  {
    symbol: "MIM",
    address: "0x6223D4BF70e5aD440c41F39F3420178a0CF3AC70",
    decimals: 18,
  },
  {
    symbol: "DAI",
    address: "0x3383791f2C0CCd0f6f8f39043cBBb009DD9d7E21",
    decimals: 18,
  },
];

async function main() {
  const signer = (await ethers.getSigners())[0];
  for (let i = 0; i < tokens.length; i++) {
    const contracts = (await ethers.getContractFactory("TestToken", signer)).attach(tokens[i].address);
    await Misc.runAndWait(() => contracts.mint(receiver, ethers.utils.parseUnits(amount, tokens[i].decimals)));
    log.info(`mint ${amount} ${tokens[i].symbol} to ${receiver}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
