import { joinURL } from "../fetch";
import { store } from "../store";
import { BaseClientCommand } from "./base";
import { LoadFolder, STORAGE } from "./loadFolder";

export class Upload extends BaseClientCommand<void, [string, File[]]> {
  /**
   *
   * @param path The new path to load. Used to navigate to a new folder, or
   * refresh the existing folder.
   * @param peek If true, this function will return the contents of the folder
   * without replacing the current folder.
   *
   * @returns The contents of the requested folder.
   */
  async run(path: string, files: File[]) {
    const uploadForm = new FormData();
    files.forEach((file) => {
      uploadForm.append(file.name, file);
    });

    await this.put({
      url: joinURL(STORAGE, path),
      formData: uploadForm,
    });

    await new LoadFolder(this).run(store.getState().storage.currentPath);
  }
}
