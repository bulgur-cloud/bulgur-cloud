import { mutate } from "swr";
import api from "../api";
import { joinURL } from "../fetch";
import { BaseClientCommand } from "./base";
import { STORAGE } from "./loadFolder";

type CreateFolderParams = {
  store: string;
  path: string;
  name: string;
};

export class CreateFolder extends BaseClientCommand<
  void,
  [CreateFolderParams]
> {
  /**
   *
   * @param path The new path to load. Used to navigate to a new folder, or
   * refresh the existing folder.
   * @param peek If true, this function will return the contents of the folder
   * without replacing the current folder.
   *
   * @returns The contents of the requested folder.
   */
  async run({ store, path, name }: CreateFolderParams) {
    const data: api.StorageAction = {
      action: "CreateFolder",
    };
    await this.post({
      url: joinURL(STORAGE, store, path, name),
      data,
    });
    console.log(store, path);
    mutate([store, path]);
  }
}
