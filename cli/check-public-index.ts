/**
 * Check what's in the public index
 */
import { config } from "dotenv";
config();

import { getAppIdentity, httpClient } from "./lib/b3nd-client.js";

async function main() {
  const appIdentity = await getAppIdentity();
  const listUri = `mutable://accounts/${appIdentity.publicKeyHex}/public-notebooks`;

  console.log("Checking public index at:", listUri);
  console.log();

  const result = await httpClient.list(listUri);

  if (!result.success) {
    console.log("❌ Failed to list:", result.error);
    return;
  }

  console.log("✅ Found", result.data.length, "entries");
  console.log();

  for (const item of result.data) {
    console.log("  -", item);
  }
}

main();
