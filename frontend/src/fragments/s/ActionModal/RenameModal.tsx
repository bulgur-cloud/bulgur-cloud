import { useRunAsync } from "@/hooks/base";
import { useRename } from "@/hooks/storage";
import { ActionRename, storageSlice, useAppDispatch } from "@/utils/store";
import { joinURL, urlFileName, urlUp1Level } from "@/utils/url";
import { useCallback } from "react";
import { BaseFilenameModal } from "./BaseFilenameModal";

export type RenameModalProps = {
  action: ActionRename;
};

export function RenameModal(props: RenameModalProps) {
  const { runAsync } = useRunAsync();
  const dispatch = useAppDispatch();
  const { doRename } = useRename();
  const name = urlFileName(props.action.path);

  const runRename = useCallback(
    (name: string) => {
      runAsync(async () => {
        const containingFolder = urlUp1Level(props.action.path);
        await doRename(props.action.path, joinURL(containingFolder, name));
      });
    },
    [doRename, props.action.path, runAsync],
  );

  return (
    <BaseFilenameModal
      onDismiss={() => {
        dispatch(storageSlice.actions.dismissPrompt());
      }}
      title={`Rename ${name}`}
      placeHolder="Enter a new name"
      primary="Rename"
      actions={{ Rename: { message: "Rename", action: runRename } }}
      initialValue={name}
    />
  );
}
