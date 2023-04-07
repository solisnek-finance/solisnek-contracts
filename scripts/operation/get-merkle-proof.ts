import fs from "fs";
import { utils } from "ethers";
import { StandardMerkleTree } from "@openzeppelin/merkle-tree";
import { log } from "../utils/log";

const address = "0x906A890766c24F62aA8f354F5eBFB51DC771e3a0";
const tree = StandardMerkleTree.load(JSON.parse(fs.readFileSync("ve-merkle.json").toString()));

for (const [i, v] of tree.entries()) {
  if (v[0] === utils.getAddress(address)) {
    const proof = tree.getProof(i);
    log.info("value:", v);
    log.info("proof:", proof);
  }
}
