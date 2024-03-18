import {
  Contract,
  JsonRpcProvider,
  keccak256,
  recoverAddress,
  toUtf8Bytes,
} from "ethers";
import { assertIsNonEmptyString } from "../utils";

export type VerifyJwt = (token: string) => Promise<boolean>;

export function provideVerifyJwt(polygonRpcUrl: string): VerifyJwt {
  assertIsNonEmptyString(polygonRpcUrl, "polygonRpcUrl");

  return async function verifyJwt(token: string) {
    const splitJwt = token.split(".");
    const rawHeader = splitJwt[0];
    const rawPayload = splitJwt[1];

    const header = JSON.parse(Buffer.from(rawHeader, "base64").toString());
    const payload = JSON.parse(Buffer.from(rawPayload, "base64").toString());

    const botId = payload["bot-id"] as string;
    const expiresAt = payload["exp"] as number;
    const algorithm = header?.alg;

    if (algorithm !== "ETH") {
      console.warn(`Unexpected signing method: ${algorithm}`);
      return false;
    }

    if (!botId) {
      console.warn(`Invalid claim`);
      return false;
    }

    const signerAddress = payload?.sub as string | undefined; // public key should be contract address that signed the JWT

    if (!signerAddress) {
      console.warn(`Invalid claim`);
      return false;
    }

    const currentUnixTime = Math.floor(Date.now() / 1000);

    if (expiresAt < currentUnixTime) {
      console.warn(`Jwt is expired`);
      return false;
    }

    const digest = keccak256(toUtf8Bytes(`${rawHeader}.${rawPayload}`));
    const signature = `0x${Buffer.from(splitJwt[2], "base64").toString("hex")}`;

    const recoveredSignerAddress = recoverAddress(digest, signature); // Contract address that signed message

    if (recoveredSignerAddress !== signerAddress) {
      console.warn(
        `Signature invalid: expected=${signerAddress}, got=${recoveredSignerAddress}`
      );
      return false;
    }

    const polygonProvider = new JsonRpcProvider(polygonRpcUrl);

    const DISPTACHER_ARE_THEY_LINKED =
      "function areTheyLinked(uint256 agentId, uint256 scannerId) external view returns(bool)";
    const DISPATCH_CONTRACT = "0xd46832F3f8EA8bDEFe5316696c0364F01b31a573"; // Source: https://docs.forta.network/en/latest/smart-contracts/
    const dispatchContract = new Contract(
      DISPATCH_CONTRACT,
      [DISPTACHER_ARE_THEY_LINKED],
      polygonProvider
    );
    const areTheyLinked = await dispatchContract.areTheyLinked(
      botId,
      recoveredSignerAddress
    );

    return areTheyLinked;
  };
}
