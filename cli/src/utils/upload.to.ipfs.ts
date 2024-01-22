import { AxiosInstance } from "axios";
import FormData from "form-data";
import { assertExists } from "forta-bot";

// uploads provided string to IPFS and returns IPFS hash
export type UploadToIpfs = (value: string) => Promise<string>;

export function provideUploadToIpfs(
  ipfsHttpClient: AxiosInstance
): UploadToIpfs {
  assertExists(ipfsHttpClient, "ipfsHttpClient");

  return async function uploadToIpfs(value: string) {
    const formData = new FormData();
    formData.append("value", value);
    const { data } = await ipfsHttpClient.post("/api/v0/add", formData, {
      headers: formData.getHeaders(),
    });
    return data.Hash;
  };
}
