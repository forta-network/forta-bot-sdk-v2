import { AxiosInstance } from "axios";
import { Signature, SigningKey } from "ethers";
import {
  assertExists,
  assertIsNonEmptyString,
  keccak256,
} from "@fortanetwork/forta-bot";
import { GetCredentials } from "../../keys";
import { CommandHandler } from "../..";

export function provideRegisterRpcKey(
  getCredentials: GetCredentials,
  registerKeyIdUrl: string,
  axios: AxiosInstance,
  cliArgs: any
): CommandHandler {
  assertIsNonEmptyString(registerKeyIdUrl, "registerKeyIdUrl");
  assertExists(axios, "axios");
  assertExists(cliArgs, "cliArgs");

  return async function registerRpcKey(key?: string) {
    const rpcKeyId = cliArgs?.key || key;
    assertIsNonEmptyString(rpcKeyId, "key");

    const { privateKey, publicKey } = await getCredentials();

    const signingKey = new SigningKey(privateKey);
    const messageHash = keccak256(rpcKeyId);
    const signature = Signature.from(signingKey.sign(messageHash)).serialized;

    await axios.post(registerKeyIdUrl, {
      keyId: rpcKeyId,
      signature,
    });

    console.log(
      `successfully registered key ID ${rpcKeyId} to owner ${publicKey}`
    );
  };
}
