import { AxiosInstance } from "axios";
import { assertExists } from "../utils";
import { MOCK_SCANNER_JWT } from "./index";

// retrieves a JWT containing provided claims that is signed by the scan node
export type GetScannerJwt = (
  claims: object,
  expiresAt?: Date
) => Promise<string>;

export function provideGetScannerJwt(
  axios: AxiosInstance,
  isProd: boolean,
  fortaJwtProviderHost: string,
  fortaJwtProviderPort: number
): GetScannerJwt {
  assertExists(axios, "axios");

  return async function getScannerJwt(claims: object, expiresAt?: Date) {
    if (!isProd) return MOCK_SCANNER_JWT;

    if (expiresAt) {
      const expInSec = Math.floor(expiresAt.getTime() / 1000);
      claims = {
        exp: expInSec,
        ...claims,
      };
    }

    const response = await axios.post(
      `http://${fortaJwtProviderHost}:${fortaJwtProviderPort}/create`,
      {
        claims,
      }
    );
    return response.data.token;
  };
}
