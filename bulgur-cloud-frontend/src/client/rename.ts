import { mutate } from "swr";
import api from "../api";
import { joinURL } from "../fetch";
import { BaseClientCommand } from "./base";
import { STORAGE } from "./loadFolder";

type RenameOpts = {
  from: {
    store: string;
    path: string;
    name: string;
  };
  to: {
    store: string;
    path: string;
    name: string;
  };
};

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
    await Promise.all(
      moves.map(async ({ from, to }) => {
        const data: api.StorageAction = {
          action: "Move",
          new_path: joinURL(to.store, to.path, to.name),
        };
        await this.post({
          url: joinURL(STORAGE, from.store, from.path, from.name),
          data,
        });
        console.log("rename", from, to);
        mutate([from.store, from.path]);
        mutate([to.store, to.path]);
      }),
    );
  }
}
