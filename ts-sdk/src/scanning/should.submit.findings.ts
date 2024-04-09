import { Finding } from "../findings";
import { Logger, assertExists } from "../utils";

export type ShouldSubmitFindings = (
  findings: Finding[],
  lastSubmissionTimestamp: number
) => boolean;

const THIRTY_SECONDS_IN_MS = 30 * 1000;

export function provideShouldSubmitFindings(
  logger: Logger
): ShouldSubmitFindings {
  assertExists(logger, "logger");

  return function shouldSubmitFindings(
    findings: Finding[],
    lastSubmissionTimestamp: number
  ) {
    const numFindings = findings.length;
    // if no findings, dont submit
    if (numFindings === 0) {
      logger.debug("shouldSubmitFindings=false (no findings)");
      return false;
    }

    // if at least 50 findings, submit
    if (numFindings >= 50) {
      logger.debug(
        `shouldSubmitFindings=true (more than 50 findings (${numFindings}))`
      );
      return true;
    }

    // check if findings byte size is at least 5MB
    const findingsByteSize = Buffer.byteLength(JSON.stringify(findings));
    if (findingsByteSize >= 5_000_000) {
      logger.debug(
        `shouldSubmitFindings=true (at least 5MB to send (${findingsByteSize}))`
      );
      return true;
    }

    // check if been more than 30 seconds since last submission
    const beenMoreThan30SecondsSinceSubmission =
      Date.now() - lastSubmissionTimestamp > THIRTY_SECONDS_IN_MS;
    if (beenMoreThan30SecondsSinceSubmission) {
      logger.debug(
        `shouldSubmitFindings=true (been more than 30s since ${lastSubmissionTimestamp})`
      );
      return true;
    }

    logger.debug("shouldSubmitFindings=false (no conditions met");
    return false;
  };
}
