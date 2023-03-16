import { storageSlice, useAppDispatch } from "@/utils/store";
import { useCurrentPath } from "./CurrentPathProvider";
import { useCallback } from "react";

export function NewFolderButton() {
  const { fullPath } = useCurrentPath();
  const dispatch = useAppDispatch();
  const onClick = useCallback(() => {
    dispatch(
      storageSlice.actions.promptAction({
        type: "CreateFolder",
        path: fullPath,
      }),
    );
  }, [dispatch, fullPath]);

  return (
    <button
      id="button-new-folder"
      onClick={onClick}
      className="btn btn-primary"
    >
      New Folder
    </button>
  );
}
