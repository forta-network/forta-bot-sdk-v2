import shelljs from "shelljs";
import * as keythereum from "keythereum";
import prompts from "prompts";
import { assertExists } from "forta-bot";
import { InitKeystore } from "./init.keystore";

// creates a keyfile in keystore folder (which is created if needed) encrypted using password
export type CreateKeyfile = () => Promise<{
  publicKey: string;
  privateKey: string;
}>;

export function provideCreateKeyfile(
  prompt: typeof prompts,
  initKeystore: InitKeystore,
  shell: typeof shelljs,
  fortaGlobalRoot: string
): CreateKeyfile {
  assertExists(shell, "shell");
  assertExists(fortaGlobalRoot, "fortaGlobalRoot");

  return async function createKeyfile() {
    await initKeystore();

    console.log("Creating new keyfile...");
    const { password } = await prompt({
      type: "password",
      name: "password",
      message: `Enter password to encrypt new keyfile`,
    });

    const key = keythereum.create({ keyBytes: 32, ivBytes: 16 });
    const keyObject = keythereum.dump(
      Buffer.from(password),
      key.privateKey,
      key.salt,
      key.iv
    );
    keythereum.exportToFile(keyObject, fortaGlobalRoot);

    const publicKey = `0x${keyObject.address}`;
    const privateKey = `0x${key.privateKey.toString("hex")}`;
    console.log(`created key ${publicKey} in ${fortaGlobalRoot}`);

    return {
      publicKey,
      privateKey,
    };
  };
}
