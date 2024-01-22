import { AxiosInstance } from "axios";
import { assertExists, assertIsNonEmptyString } from "../utils";
import { GetScannerJwt } from "./get.scanner.jwt";

export type GetRpcJwt = (
  url: string,
  keyId: string,
  claims?: { [key: string]: string }
) => Promise<string>;

export function provideGetRpcJwt(
  getScannerJwt: GetScannerJwt,
  tokenExchangeUrl: string,
  axios: AxiosInstance
): GetRpcJwt {
  assertExists(getScannerJwt, "getScannerJwt");
  assertIsNonEmptyString(tokenExchangeUrl, "tokenExchangeUrl");
  assertExists(axios, "axios");

  return async function getRpcJwt(
    rpcUrl: string,
    rpcKeyId: string,
    rpcJwtClaims: { [key: string]: string } = {}
  ) {
    const jwtData = {
      kid: rpcKeyId,
      claims: { access: "token_exchange", ...rpcJwtClaims } as any,
    };

    // infura is expecting an extra aud claim (which should be set to "infura.io")
    if (rpcUrl.includes("infura")) {
      jwtData.claims["aud"] = "infura.io";
    }

    // fetch the scanner JWT
    const scannerJwt = await getScannerJwt(jwtData.claims);

    // exchange scanner JWT for RPC JWT using token exchange server
    const response = await axios.post(tokenExchangeUrl, jwtData, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${scannerJwt}`,
      },
    });

    return response.headers["authorization"];
  };
}
