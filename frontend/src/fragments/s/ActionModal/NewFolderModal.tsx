import { useRunAsync } from "@/hooks/base";
import { useCreateFolder } from "@/hooks/storage";
import {
  ActionCreateFolder,
  storageSlice,
  useAppDispatch,
} from "@/utils/store";
import { joinURL } from "@/utils/url";
import { useCallback } from "react";
import { BaseFilenameModal } from "./BaseFilenameModal";

export type NewFolderModalProps = {
  action: ActionCreateFolder;
};

export function NewFolderModal(props: NewFolderModalProps) {
  const { runAsync } = useRunAsync();
  const dispatch = useAppDispatch();
  const { doCreateFolder } = useCreateFolder();

  const runCreateFolder = useCallback(
    (name: string) => {
      runAsync(async () => {
        // An empty upload will just create the folder in the path
        await doCreateFolder(joinURL(props.action.path, name));
      });
    },
    [doCreateFolder, props.action.path, runAsync],
  );

  return (
    <BaseFilenameModal
      idPrefix="new-folder"
      onDismiss={() => {
        dispatch(storageSlice.actions.dismissPrompt());
      }}
      title="Create new folder"
      placeHolder="Enter a name for the new folder"
      primary="Create"
      actions={{ Create: { message: "Create", action: runCreateFolder } }}
    />
  );
}
