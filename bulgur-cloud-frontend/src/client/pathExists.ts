import { joinURL, ResponseBase } from "../fetch";
import { BaseClientCommand } from "./base";
import { STORAGE } from "./loadFolder";

export class PathExists extends BaseClientCommand<boolean, [string]> {
  /**
   *
   * @param path The new path to load. Used to navigate to a new folder, or
   * refresh the existing folder.
   *
   * @returns The contents of the requested folder.
   */
  async run(path: string) {
    const response = await this.head({
      url: joinURL(STORAGE, path),
    });

    return !!response?.response.ok;
  }

  protected async handleError(
    response: ResponseBase,
  ): Promise<"done" | "continue"> {
    if (response?.response.status === 404) return "done";
    return "continue";
  }
}
