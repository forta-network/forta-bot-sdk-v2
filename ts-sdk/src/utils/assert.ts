import _ from "lodash";
import { Finding } from "../findings";

export const assertExists = (obj: any, objName: string) => {
  if (_.isNil(obj)) throw new Error(`${objName} is required`);
};

export const assertIsNonEmptyString = (str: string, varName: string) => {
  if (!_.isString(str) || str.length === 0) {
    throw new Error(`${varName} must be non-empty string`);
  }
};

export const assertIsFromEnum = (value: any, Enum: any, varName: string) => {
  if (!Object.values(Enum).includes(value)) {
    throw new Error(`${varName} must be valid enum value`);
  }
};

export const assertIsStringKeyAndStringValueMap = (
  value: any,
  varName: string
) => {
  if (!value) return;

  if (typeof value !== "object") throw new Error(`${varName} must be a map`);
  for (const [k, v] of Object.entries(value)) {
    if (!_.isString(k)) throw new Error(`${varName} keys must be strings`);
    if (!_.isString(v)) throw new Error(`${varName} values must be strings`);
  }
};

export const assertFindings = (findings: Finding[]) => {
  const byteLength = Buffer.byteLength(JSON.stringify(findings));
  const kilobyte = 1024;

  if (byteLength > kilobyte * 10000)
    throw Error(
      `Cannot return more than 10MB of findings per request (received ${byteLength} bytes)`
    );
  if (findings.length > 1000)
    throw Error(
      `Cannot return more than 1000 findings per request (received ${findings.length})`
    );
};
