import { log } from "../utils/log";
import { Multicall, ContractCallResults, ContractCallContext } from "ethereum-multicall";
import { ethers } from "hardhat";
import { Misc } from "../utils/misc";

const gauges = [
  "0xfc2ce1db11ecf01d0b39af8f682eac435dca2394",
  "0xba93d4d011440779474ced79846ad34567242429",
  "0xc200e7a655d8e0e0faba390102898917541a96de",
  "0x0ce8a6af9a8cad60b0cb5e580ba7bb708b601e98",
  "0xcc9d96390818d669a4f0af77f304a28eb4d429ab",
  "0x6588fb65a8afe494b5854e88fcfd2f3fb9534e91",
  "0x4032176d2364b730a5bd461b9f194738a2179d9a",
  "0x2fa9e51bf6afaa43bf1b66a38b0aafaaa9097fab",
  "0x1768040d19c29303d467a40e624f171f6e069633",
  "0x2463cf8990e968a8210a31f5e66771dbf13fe5f8",
  "0x0cb5fa94142c3785db6b4340acbef9e6520e18a7",
  "0xdb64fc90a3359bcb5865566981208ade0e174670",
  "0xb5edeabda70744184a30ae4b9a18860ff8a0b1ea",
  "0x32c80ecae6faac781d2f5bb6367b9de01734f931",
  "0x4fa571d02ad47052c3aa06be79ab7afa448622ca",
  "0xb5a69207c5c9308d4fe5db939f593833ee4c643f",
  "0x8322487ef8e2159d21aaf3bbb51826031821e1a9",
  "0x61772c2df7c02384cea3e101b999e899d78626f3",
  "0x9c805901c5c1299e81b9d97dee7d2d386bc51aa8",
  "0xce9cbc28d520fde4ea0f95a6349a39b9a65a39fd",
  "0x2e35b0947528c2790ad80f016cdb19dfa8fc9d58",
  "0x0c04ff19abe0d0ce59d52b362deef41d50476263",
  "0x6c6d3e488684fa0079e51038d9a40a87c147eb40",
  "0x49cc8271277edf20344701e17ace2e12f441ed05",
  "0xc2ec3ab02a02002847088e9e0c328f48c7ed0380",
  "0x8535928caa01e59acba0494a99372540a8b584ce",
  "0x2b483bb976bc6ab9027beb8424d68fa7ac6eec54",
  "0x5ba2989088bd9508819490469ac34535c2e08247",
  "0x5bd4b8e8ae2e40f361237579e269ef6ad46827b7",
  "0x9a3c95f11a7ca8e54b3bce372fb19a28afce6b1d",
];

async function main() {
  const signer = (await ethers.getSigners())[0];

  const gaugeAbi = new ethers.utils.Interface([
    {
      inputs: [],
      name: "claimFees",
      outputs: [
        { internalType: "uint256", name: "claimed0", type: "uint256" },
        { internalType: "uint256", name: "claimed1", type: "uint256" },
      ],
      stateMutability: "nonpayable",
      type: "function",
    },
  ]);
  const claimFeesData = gaugeAbi.encodeFunctionData("claimFees");

  const multicallAbi = new ethers.utils.Interface([
    {
      inputs: [
        {
          components: [
            { internalType: "address", name: "target", type: "address" },
            { internalType: "bytes", name: "callData", type: "bytes" },
          ],
          internalType: "struct Multicall3.Call[]",
          name: "calls",
          type: "tuple[]",
        },
      ],
      name: "aggregate",
      outputs: [
        { internalType: "uint256", name: "blockNumber", type: "uint256" },
        { internalType: "bytes[]", name: "returnData", type: "bytes[]" },
      ],
      stateMutability: "payable",
      type: "function",
    },
  ]);

  const multicallData = multicallAbi.encodeFunctionData("aggregate", [gauges.map((g) => [g, claimFeesData])]);

  const fee = await ethers.provider.getFeeData();

  const tx = await signer.sendTransaction({
    to: "0xcA11bde05977b3631167028862bE2a173976CA11",
    data: multicallData,
    maxFeePerGas: fee.maxFeePerGas?.mul(15).div(10),
    maxPriorityFeePerGas: fee.maxPriorityFeePerGas?.mul(15).div(10),
  });
  log.info(`tx:`, tx.hash);

  let receipt;
  while (true) {
    receipt = await ethers.provider.getTransactionReceipt(tx.hash);
    if (!!receipt) {
      break;
    }
    log.info("not yet complete", tx.hash);
    await Misc.delay(5000);
  }
  log.info(`done`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
