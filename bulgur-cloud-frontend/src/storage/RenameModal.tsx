import { runAsync, STORAGE } from "../client/base";
import { useRename } from "../client/storage";
import { useFilenameModal } from "../components/FilenameModal";
import { joinURL } from "../fetch";
import { DashboardParams } from "../routes";

export function useRenameModal(
  props: {
    itemName: string;
    isFile: boolean;
  } & DashboardParams,
) {
  const { doRename } = useRename();
  const { path, store } = props.route.params;

  function runRename(newName: string) {
    runAsync(async () => {
      await doRename(
        joinURL(STORAGE, store, path, props.itemName),
        joinURL(store, path, newName),
      );
    });
  }

  return useFilenameModal({
    title: props.isFile ? "Rename file" : "Rename folder",
    placeHolder: props.isFile
      ? "New name for file including extension"
      : "New name for folder",
    initialValue: props.itemName,
    primary: "Rename",
    actions: {
      Rename: {
        message: "Rename",
        action: runRename,
      },
    },
  });
}
