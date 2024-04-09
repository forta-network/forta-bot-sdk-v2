import { asFunction } from "awilix";
import axios, { AxiosRequestConfig } from "axios";
import { provideUploadBotImage } from "./upload.bot.image";
import { provideUploadBotManifest } from "./upload.bot.manifest";
import { provideUploadToIpfs } from "./upload.to.ipfs";
import { FortaConfig } from "@fortanetwork/forta-bot";
import provideAppendToFile from "./append.to.file";

export default {
  ipfsHttpClient: asFunction(
    (ipfsGatewayUrl: string, ipfsGatewayAuth: string) => {
      const options: AxiosRequestConfig = { baseURL: ipfsGatewayUrl };
      if (ipfsGatewayAuth) {
        options["headers"] = {
          authorization: ipfsGatewayAuth,
        };
      }
      return axios.create(options);
    }
  ).singleton(),
  ipfsGatewayUrl: asFunction((fortaConfig: FortaConfig) => {
    return fortaConfig.ipfsGatewayUrl || "https://ipfs.forta.network";
  }),
  ipfsGatewayAuth: asFunction(
    (ipfsGatewayUrl: string, fortaConfig: FortaConfig) => {
      if (
        ipfsGatewayUrl.includes("ipfs.infura.io") &&
        !fortaConfig.ipfsGatewayAuth
      ) {
        throw new Error(`no ipfsGatewayAuth provided in config`);
      }
      return fortaConfig.ipfsGatewayAuth;
    }
  ),

  imageRepositoryUrl: asFunction((fortaConfig: FortaConfig) => {
    return fortaConfig.imageRepositoryUrl || "disco.forta.network";
  }),
  imageRepositoryUsername: asFunction((fortaConfig: FortaConfig) => {
    return fortaConfig.imageRepositoryUsername || "discouser";
  }),
  imageRepositoryPassword: asFunction((fortaConfig: FortaConfig) => {
    return fortaConfig.imageRepositoryPassword || "discopass";
  }),

  uploadToIpfs: asFunction(provideUploadToIpfs),
  uploadBotImage: asFunction(provideUploadBotImage),
  uploadBotManifest: asFunction(provideUploadBotManifest),
  appendToFile: asFunction(provideAppendToFile),
};
