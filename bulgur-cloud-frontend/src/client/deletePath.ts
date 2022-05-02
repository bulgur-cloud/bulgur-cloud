import { mutate } from "swr";
import { joinURL } from "../fetch";
import { BaseClientCommand } from "./base";
import { STORAGE } from "./loadFolder";

type DeletePathParams = {
  store: string;
  path: string;
  name: string;
};

export class DeletePath extends BaseClientCommand<void, [DeletePathParams]> {
  /**
   *
   * @param path The new path to load. Used to navigate to a new folder, or
   * refresh the existing folder.
   * @param peek If true, this function will return the contents of the folder
   * without replacing the current folder.
   *
   * @returns The contents of the requested folder.
   */
  async run({ store, path, name }: DeletePathParams) {
    await this.delete({
      url: joinURL(STORAGE, store, path, name),
    });
    mutate([store, path]);
  }
}
