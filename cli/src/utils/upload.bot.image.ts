import shelljs from "shelljs";
import { assertExists, assertIsNonEmptyString } from "@fortanetwork/forta-bot";
import { assertShellResult } from "./assert";

// uploads bot image to repository and returns image reference
export type UploadBotImage = (runtimeArgs?: any) => Promise<string>;

export function provideUploadBotImage(
  shell: typeof shelljs,
  imageRepositoryUrl: string,
  imageRepositoryUsername: string,
  imageRepositoryPassword: string,
  botName: string,
  contextPath: string
): UploadBotImage {
  assertExists(shell, "shell");
  assertIsNonEmptyString(imageRepositoryUrl, "imageRepositoryUrl");
  assertIsNonEmptyString(botName, "botName");
  assertIsNonEmptyString(contextPath, "contextPath");

  return async function uploadBotImage(runtimeArgs: any = {}) {
    let { imageTagSuffix } = runtimeArgs;

    // change directory to context path
    shell.cd(contextPath);

    // authenticate against repository if credentials provided
    if (imageRepositoryUsername && imageRepositoryPassword) {
      const loginResult = shell.exec(
        `docker login ${imageRepositoryUrl} -u ${imageRepositoryUsername} -p ${imageRepositoryPassword}`
      );
      assertShellResult(
        loginResult,
        "error authenticating with image repository"
      );
    }

    // build the bot image
    console.log("building bot image...");
    const imageTag = `${botName}-intermediate${
      imageTagSuffix ? `-${imageTagSuffix}` : ""
    }`;
    let buildCommand = `docker buildx build --load --platform linux/amd64 --tag ${imageTag} .`;
    const buildResult = shell.exec(buildCommand);
    assertShellResult(buildResult, "error building bot image");

    // push bot image to repository
    console.log("pushing bot image to repository...");
    const tagResult = shell.exec(
      `docker tag ${imageTag} ${imageRepositoryUrl}/${imageTag}`
    );
    assertShellResult(tagResult, "error tagging bot image");
    const pushResult = shell.exec(
      `docker push ${imageRepositoryUrl}/${imageTag}`
    );
    assertShellResult(pushResult, "error pushing bot image");

    // extract image sha256 digest from pushResult
    const digestLine = pushResult.grep("sha256").toString();
    const digestStartIndex = digestLine.indexOf("sha256:") + 7;
    const imageDigest = digestLine.substring(
      digestStartIndex,
      digestStartIndex + 64
    );

    // pull all tagged images for digest to get ipfs CID
    const pullResult = shell.exec(
      `docker pull -a ${imageRepositoryUrl}/${imageDigest}`
    );
    assertShellResult(pullResult, "error pulling tagged bot images");

    // extract image ipfs CID from pullResult
    const cidLine = pullResult.grep("bafy").toString(); // v1 CID begins with 'bafy'
    const cidStartIndex = cidLine.indexOf("bafy");
    const cidEndIndex = cidLine.indexOf(":", cidStartIndex);
    const imageIpfsCid = cidLine.substring(cidStartIndex, cidEndIndex);
    const imageReference = `${imageIpfsCid}@sha256:${imageDigest}`;

    return imageReference;
  };
}
