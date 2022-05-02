import { mutate } from "swr";
import { joinURL } from "../fetch";
import { BaseClientCommand } from "./base";
import { STORAGE } from "./loadFolder";

export class Upload extends BaseClientCommand<void, [string, string, File[]]> {
  /**
   *
   * @param path The new path to load. Used to navigate to a new folder, or
   * refresh the existing folder.
   * @param peek If true, this function will return the contents of the folder
   * without replacing the current folder.
   *
   * @returns The contents of the requested folder.
   */
  async run(store: string, path: string, files: File[]) {
    const uploadForm = new FormData();
    files.forEach((file) => {
      uploadForm.append(file.name, file);
    });

    await this.put({
      url: joinURL(STORAGE, store, path),
      formData: uploadForm,
    });
    mutate([store, path]);
  }
}
