import { ONE_MIN_IN_MS } from "./index";
import { Finding } from "../findings";

export type ShouldSubmitFindings = (
  findings: Finding[],
  lastSubmissionTimestamp: number
) => boolean;

export function provideShouldSubmitFindings(
  isProd: boolean
): ShouldSubmitFindings {
  return function shouldSubmitFindings(
    findings: Finding[],
    lastSubmissionTimestamp: number
  ) {
    // if running locally, dont submit findings
    if (!isProd) return false;

    // if no findings, dont submit
    if (findings.length === 0) return false;

    // check if findings byte size is approaching 10MB
    const isByteSizeApproaching10MB =
      Buffer.byteLength(JSON.stringify(findings)) > 9_500_000;
    if (isByteSizeApproaching10MB) return true;

    // check if been more than a minute since last submission
    const beenMoreThanAMinuteSinceSubmission =
      Date.now() - lastSubmissionTimestamp > ONE_MIN_IN_MS;
    return beenMoreThanAMinuteSinceSubmission;
  };
}
