import { FindingSeverity } from "./finding.severity";
import { FindingType } from "./finding.type";
import { Finding } from "./finding";

let IS_PRIVATE_FINDINGS = false;

const setPrivateFindings = (isPrivate: boolean) => {
  IS_PRIVATE_FINDINGS = isPrivate;
};

const isPrivateFindings = () => {
  return IS_PRIVATE_FINDINGS;
};

export {
  Finding,
  FindingSeverity,
  FindingType,
  isPrivateFindings,
  setPrivateFindings,
};
