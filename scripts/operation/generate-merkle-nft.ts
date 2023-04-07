import axios from "axios";
import { BigNumber, utils } from "ethers";
import { StandardMerkleTree } from "@openzeppelin/merkle-tree";
import fs from "fs";
import { log } from "../utils/log";

async function main() {
  const base = `https://docs.google.com/spreadsheets/d/16NYFQzLwqM3D-YkYI5I1Xxk-k9OQ90WAoxgqN3iQqFs/gviz/tq?tqx=out:csv`;
  const sheetName = "List";
  const query = encodeURIComponent("Select A, B");
  const url = `${base}&sheet=${sheetName}&tq=${query}`;

  const { data: csv } = await axios.get(url);
  const rows = (csv as string).split(/[\r\n]+/).map((row) => row.replace(/\"/g, "").split(","));
  const whitelist = rows.map((row) => {
    const address = utils.getAddress(row[0]);
    const amount = BigNumber.from(row[1]).mul(BigNumber.from(10).pow(18));
    return [address, amount.toString()];
  });
  log.info("whitelist length:", whitelist.length);

  const tree = StandardMerkleTree.of(whitelist, ["address", "uint256"]);
  log.info("Merkle Root:", tree.root);
  fs.writeFileSync("ve-merkle.json", JSON.stringify(tree.dump()));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
