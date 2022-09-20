import { runAsync, STORAGE } from "../client/base";
import { useRename } from "../client/storage";
import { FilenameModal } from "../components/FilenameModal";
import { joinURL } from "../fetch";
import {
  StorageAction,
  storageSlice,
  useAppDispatch,
  useAppSelector,
} from "../store";

export function RenameModal() {
  const { doRename } = useRename();
  const action = useAppSelector(({ storage: { action } }) =>
    action?.type !== StorageAction.Rename ? undefined : action,
  );
  const dispatch = useAppDispatch();

  if (action === undefined) return <></>;
  const { store, path, name, isFile } = action;

  function runRename(newName: string) {
    runAsync(async () => {
      await doRename(
        joinURL(STORAGE, store, path, name),
        joinURL(store, path, newName),
      );
    });
  }

  return (
    <FilenameModal
      onDismiss={() => {
        dispatch(storageSlice.actions.dismissPrompt());
      }}
      title={isFile ? "Rename file" : "Rename folder"}
      placeHolder={
        isFile ? "New name for file including extension" : "New name for folder"
      }
      initialValue={name}
      primary="Rename"
      actions={{ Rename: { message: "Rename", action: runRename } }}
    />
  );
}
