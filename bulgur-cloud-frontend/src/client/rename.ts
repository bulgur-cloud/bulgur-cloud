import api from "../api";
import { joinURL } from "../fetch";
import { store } from "../store";
import { BaseClientCommand } from "./base";
import { LoadFolder, STORAGE } from "./loadFolder";

type RenameOpts = { from: string; to: string };

export class Rename extends BaseClientCommand<void, [RenameOpts[]]> {
  /**
   *
   * @param path The new path to load. Used to navigate to a new folder, or
   * refresh the existing folder.
   * @param peek If true, this function will return the contents of the folder
   * without replacing the current folder.
   *
   * @returns The contents of the requested folder.
   */
  async run(moves: RenameOpts[]) {
    for (const { from, to } of moves) {
      const data: api.StorageAction = {
        action: "Move",
        new_path: to,
      };
      await this.post({
        url: joinURL(STORAGE, from),
        data,
      });
    }
    await new LoadFolder(this).run(store.getState().storage.currentPath);
  }
}
