import { generateSigningKeyPair } from "@bandeira-tech/b3nd-web/encrypt";

async function main() {
  const k = await generateSigningKeyPair();
  console.log("export const APP_IDENTITY = {");
  console.log('  publicKeyHex: "' + k.publicKeyHex + '",');
  console.log('  privateKeyHex: "' + k.privateKeyHex + '"');
  console.log("};");
}

main();
