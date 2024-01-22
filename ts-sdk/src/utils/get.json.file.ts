import path from "path";
import fs from "fs";
import { jsonc } from "jsonc";

export type GetJsonFile = (filePath: string) => any;

export function provideGetJsonFile(): GetJsonFile {
  return function getJsonFile(filePath: string) {
    if (filePath.startsWith(`.${path.sep}`)) {
      filePath = filePath.replace(
        `.${path.sep}`,
        `${process.cwd()}${path.sep}`
      );
    }
    const data = fs.readFileSync(filePath, "utf8");
    return jsonc.parse(data);
  };
}
