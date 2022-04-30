import api from "../api";
import { BError } from "../error";
import { joinURL } from "../fetch";
import { isString } from "../typeUtils";
import { BaseClientCommand } from "./base";
import { STORAGE } from "./loadFolder";

function isPathTokenResponse(data: any): data is api.PathTokenResponse {
  return isString(data?.token);
}

export class PathToken extends BaseClientCommand<api.Token, [string]> {
  /**
   *
   * @param path The new path to load. Used to navigate to a new folder, or
   * refresh the existing folder.
   * @param peek If true, this function will return the contents of the folder
   * without replacing the current folder.
   *
   * @returns The contents of the requested folder.
   */
  async run(path: string): Promise<api.Token> {
    const out = await this.post<api.StorageAction>({
      url: encodeURI(joinURL(STORAGE, path)),
      data: {
        action: "MakePathToken",
      },
    });
    const data = await out?.json();
    if (!isPathTokenResponse(data))
      throw new BError({
        code: "path_token",
        title: "Server did not send authorization",
        description: `Unable to get authorization form server for ${path}`,
      });
    return data.token;
  }
}
