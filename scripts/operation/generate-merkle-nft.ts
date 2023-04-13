import axios from "axios";
import { BigNumber, utils } from "ethers";
import { StandardMerkleTree } from "@openzeppelin/merkle-tree";
import fs from "fs";
import { log } from "../utils/log";

async function main() {
  const base = `https://docs.google.com/spreadsheets/d/1jm01nHZ5EJC11ACBnDmqx274892PbBGbdYPlEVOQ5b4/gviz/tq?tqx=out:csv`;
  const sheetName = "List";
  const query = encodeURIComponent("Select A, B");
  const url = `${base}&sheet=${sheetName}&tq=${query}`;

  let totalAmount = BigNumber.from(0);
  const { data: csv } = await axios.get(url);
  const rows = (csv as string).split(/[\r\n]+/).map((row) => row.replace(/\"/g, "").split(","));
  const whitelist = rows.map((row) => {
    const address = utils.getAddress(row[0]);
    const amount = BigNumber.from(row[1]);
    totalAmount = totalAmount.add(amount);
    return [address, amount.toString()];
  });
  log.info("total amount:", totalAmount.toString());
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
