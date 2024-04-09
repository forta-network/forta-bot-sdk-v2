import fs from "fs";
import { Wallet, SigningKey, Signature } from "ethers";
import {
  assertExists,
  assertIsNonEmptyString,
  keccak256,
} from "@fortanetwork/forta-bot";
import { assertIsValidChainSettings } from "./assert";
import { UploadToIpfs } from "./upload.to.ipfs";

// uploads signed bot manifest to ipfs and returns ipfs reference
export type UploadBotManifest = (
  imageReference: string | undefined, // can be undefined for external bots
  privateKey: string
) => Promise<string>;

export type ChainSetting = {
  shards: number;
  target: number;
};

export type ChainSettings = { [id: string]: ChainSetting };

type Manifest = {
  from: string;
  name: string;
  description: string;
  longDescription?: string;
  botId: string;
  botName: string;
  agentId: string;
  agentIdHash: string;
  version: string;
  timestamp: string;
  imageReference?: string;
  documentation: string;
  repository?: string;
  licenseUrl?: string;
  promoUrl?: string;
  chainIds: number[];
  publishedFrom: string;
  chainSettings?: ChainSettings;
  external?: boolean;
  protocolVersion: number;
};

export function provideUploadBotManifest(
  filesystem: typeof fs,
  uploadToIpfs: UploadToIpfs,
  botName: string,
  botDisplayName: string,
  description: string,
  longDescription: string,
  botId: string,
  version: string,
  documentation: string,
  repository: string,
  licenseUrl: string,
  promoUrl: string,
  cliVersion: string,
  chainIds: number[],
  external: boolean,
  chainSettings?: ChainSettings
): UploadBotManifest {
  assertExists(filesystem, "filesystem");
  assertExists(uploadToIpfs, "uploadToIpfs");
  assertIsNonEmptyString(botName, "botName");
  assertIsNonEmptyString(description, "description");
  assertIsNonEmptyString(botId, "botId");
  assertIsNonEmptyString(version, "version");
  assertIsNonEmptyString(documentation, "documentation");
  assertIsNonEmptyString(cliVersion, "cliVersion");
  assertIsValidChainSettings(chainSettings);

  return async function uploadBotManifest(
    imageReference: string | undefined,
    privateKey: string
  ) {
    // upload documentation to ipfs
    if (!filesystem.existsSync(documentation)) {
      throw new Error(`documentation file ${documentation} not found`);
    }
    if (!filesystem.statSync(documentation).size) {
      throw new Error(`documentation file ${documentation} cannot be empty`);
    }
    console.log("pushing bot documentation to IPFS...");
    const documentationFile = filesystem.readFileSync(documentation, "utf8");
    const documentationReference = await uploadToIpfs(documentationFile);

    // create bot manifest
    const manifest: Manifest = {
      from: new Wallet(privateKey).address,
      name: botDisplayName ?? botName,
      description,
      longDescription: longDescription,
      botId,
      botName,
      agentId: botName, // keeping for backwards compatibility
      agentIdHash: botId, // keeping for backwards compatibility
      version,
      timestamp: new Date().toUTCString(),
      imageReference,
      documentation: documentationReference,
      repository,
      licenseUrl,
      promoUrl,
      chainIds,
      publishedFrom: `Forta CLI ${cliVersion}`,
      external,
      chainSettings: formatChainSettings(chainSettings),
      protocolVersion: 2,
    };

    // sign bot manifest
    const signingKey = new SigningKey(privateKey);
    const message = keccak256(JSON.stringify(manifest));
    const signature = Signature.from(signingKey.sign(message)).serialized;

    // upload signed manifest to ipfs
    console.log("pushing bot manifest to IPFS...");
    const manifestReference = await uploadToIpfs(
      JSON.stringify({ manifest, signature })
    );

    return manifestReference;
  };
}

function formatChainSettings(
  chainSettings?: ChainSettings
): ChainSettings | undefined {
  if (!chainSettings) return undefined;

  const formattedChainSettings = Object.assign({}, chainSettings);
  for (const key of Object.keys(chainSettings)) {
    // make sure keys are not numbers
    if (typeof key === "number") {
      delete formattedChainSettings[key];
      formattedChainSettings[`${key}`] = chainSettings[key];
    }
    // make sure shards and targets are numbers
    if (typeof chainSettings[key].shards === "string") {
      formattedChainSettings[`${key}`].shards = parseInt(
        chainSettings[key].shards as any
      );
    }
    if (typeof chainSettings[key].target === "string") {
      formattedChainSettings[`${key}`].target = parseInt(
        chainSettings[key].target as any
      );
    }
  }
  return formattedChainSettings;
}
