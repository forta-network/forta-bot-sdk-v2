import { assertExists, assertIsNonEmptyString } from "forta-bot";
import { ListKeyfiles, CreateKeyfile } from "../../keys";

// create keyfile if one doesnt already exist
export type InitKeyfile = () => Promise<void>;

export function provideInitKeyfile(
  fortaGlobalRoot: string,
  listKeyfiles: ListKeyfiles,
  createKeyfile: CreateKeyfile
): InitKeyfile {
  assertIsNonEmptyString(fortaGlobalRoot, "fortaGlobalRoot");
  assertExists(listKeyfiles, "listKeyfiles");
  assertExists(createKeyfile, "createKeyfile");

  return async function initKeyfile() {
    const keyfiles = listKeyfiles();

    if (!keyfiles.length) {
      await createKeyfile();
    } else {
      console.log(
        `Found existing keyfile ${keyfiles[0]} in ${fortaGlobalRoot}`
      );
    }
  };
}
