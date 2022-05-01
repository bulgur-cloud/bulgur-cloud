import api from "../api";
import { isBoolean, isString } from "../typeUtils";
import { BError } from "../error";
import { BaseClientCommand } from "./base";
import { joinURL } from "../fetch";

function isFolderEntry(data: any): data is api.FolderEntry {
  return (
    isBoolean(data?.is_file) &&
    isString(data?.name) &&
    Number.isInteger(data?.size)
  );
}

function isFolderResults(data: any): data is api.FolderResults {
  const entries = data?.entries;
  if (!Array.isArray(entries)) return false;
  return entries.every(isFolderEntry);
}

export const STORAGE = "/storage";

export class LoadFolder extends BaseClientCommand<
  api.FolderResults,
  [string, boolean]
> {
  /**
   *
   * @param path The new path to load. Used to navigate to a new folder, or
   * refresh the existing folder.
   *
   * @returns The contents of the requested folder.
   */
  async run(path: string) {
    const response = await this.get({
      url: joinURL(STORAGE, path),
    });
    const out = await response?.json();
    if (!isFolderResults(out)) {
      const status = response?.response.status;
      let reason: string = `${status}`;

      throw new BError({
        code: "load_folder_failed",
        title: "Failed to load folder",
        description: `Unable to load ${path}: ${reason}`,
      });
    }

    return out;
  }
}
