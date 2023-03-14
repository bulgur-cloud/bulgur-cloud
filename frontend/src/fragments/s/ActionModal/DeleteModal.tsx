import { Portal } from "@/components/Portal";
import { useRunAsync } from "@/hooks/base";
import { useDelete } from "@/hooks/storage";
import { ActionDelete, storageSlice, useAppDispatch } from "@/utils/store";
import { urlFileName } from "@/utils/url";
import { useCallback } from "react";
import { ModalButton } from "./BaseFilenameModal";

export type DeleteModalProps = {
  action: ActionDelete;
};

export function DeleteModal(props: DeleteModalProps) {
  const { runAsync } = useRunAsync();
  const dispatch = useAppDispatch();
  const { doDelete } = useDelete();
  const name = urlFileName(props.action.path);

  const runDelete = useCallback(() => {
    runAsync(async () => {
      await doDelete(props.action.path);
      dispatch(storageSlice.actions.dismissPrompt());
    });
  }, [dispatch, doDelete, props.action.path, runAsync]);
  const onDismiss = useCallback(() => {
    dispatch(storageSlice.actions.dismissPrompt());
  }, [dispatch]);

  return (
    <Portal>
      <div className="modal modal-open">
        <div className="modal-box flex flex-col">
          <h2 className="text-xl">Delete {name}</h2>
          <div className="flex flex-row">
            <ModalButton
              onPress={runDelete}
              message={"Delete"}
              highlight={true}
            />
            <ModalButton onPress={onDismiss} message={"Cancel"} />
          </div>
        </div>
      </div>
    </Portal>
  );
}
