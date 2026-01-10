/**
 * Check what app identity the CLI derives
 */
import { config } from "dotenv";
config();

import { getAppIdentity } from "./lib/b3nd-client.js";

async function main() {
  const appIdentity = await getAppIdentity();
  console.log("CLI App Identity:");
  console.log("  Public Key:", appIdentity.publicKeyHex);
  console.log("  Public Index URI:", `mutable://accounts/${appIdentity.publicKeyHex}/public-notebooks`);
}

main();
