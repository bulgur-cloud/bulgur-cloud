import { joinURL } from "../fetch";
import { store } from "../store";
import { BaseClientCommand } from "./base";
import { LoadFolder, STORAGE } from "./loadFolder";

export class DeletePath extends BaseClientCommand<void, [string]> {
  /**
   *
   * @param path The new path to load. Used to navigate to a new folder, or
   * refresh the existing folder.
   * @param peek If true, this function will return the contents of the folder
   * without replacing the current folder.
   *
   * @returns The contents of the requested folder.
   */
  async run(path: string) {
    await this.delete({
      url: joinURL(STORAGE, path),
    });
    await new LoadFolder(this).run(store.getState().storage.currentPath);
  }
}
