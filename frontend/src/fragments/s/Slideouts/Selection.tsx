import { Slideout } from "@/components/Slideout";
import { useRunAsync } from "@/hooks/base";
import { useDelete, useRename } from "@/hooks/storage";
import { useDisclosure } from "@/utils/hooks/useDisclosure";
import { shallowEquals } from "@/utils/object";
import { storageSlice, useAppDispatch, useAppSelector } from "@/utils/store";
import { joinURL } from "@/utils/url";
import { IconCheckbox } from "@tabler/icons-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCurrentPath } from "../CurrentPathProvider";

export function Selection() {
  const { fullPath: currentPath } = useCurrentPath();
  const [isRunningAction, setIsRunningAction] = useState(false);
  const { runAsync } = useRunAsync();
  const { doDelete } = useDelete();
  const { doRename } = useRename();
  const selectedFiles = useAppSelector(
    (state) => state.storage.selected,
    shallowEquals,
  );
  const dispatch = useAppDispatch();
  const selecting = useMemo(() => {
    return Object.values(selectedFiles);
  }, [selectedFiles]);
  const isSelecting = useMemo(() => {
    return selecting.length > 0;
  }, [selecting]);
  const { isOpen, onToggle, onOpen, onClose } = useDisclosure(false);

  const slideoutInner = useRef<HTMLDivElement>(null);

  const onClickDelete = useCallback(() => {
    setIsRunningAction(true);
    runAsync(async () => {
      await Promise.all(
        selecting.map((file) => doDelete(joinURL(file.path, file.name))),
      );
      dispatch(storageSlice.actions.clearAllSelected());
    }).finally(() => {
      setIsRunningAction(false);
    });
  }, [dispatch, doDelete, runAsync, selecting, setIsRunningAction]);
  const onClickMoveHere = useCallback(() => {
    setIsRunningAction(true);
    runAsync(async () => {
      await Promise.all(
        selecting.map((file) =>
          doRename(
            joinURL(file.path, file.name),
            joinURL(currentPath, file.name),
          ),
        ),
      );
      dispatch(storageSlice.actions.clearAllSelected());
    }).finally(() => {
      setIsRunningAction(false);
    });
  }, [currentPath, dispatch, doRename, runAsync, selecting]);

  // When the upload starts, open the slideout. When it ends, close it.
  useEffect(() => {
    if (isSelecting) {
      onOpen();
    } else {
      onClose();
    }
  }, [isSelecting, onOpen, onClose]);

  return (
    <Slideout isOpen={isOpen} side="right">
      <button
        onClick={onToggle}
        style={{ visibility: isSelecting ? "visible" : "hidden" }}
        className="absolute right-full top-16 bg-base-100 p-4 rounded-l-box drop-shadow-xl border-base-content border-2 border-r-0"
      >
        <IconCheckbox />
      </button>
      <div
        ref={slideoutInner}
        className="rounded-l-box overflow-hidden border-base-content border-2 border-r-0"
      >
        {/* w is 80% of the screen, but that's mainly for small width screens like vertical phones. We really want max-w-prose. */}
        <div className="bg-base-100 drop-shadow-xl min-h-1/2-screen max-h-9/10-screen p-4 w-[80vw] max-w-prose overflow-y-auto overscroll-contain">
          <h2 className="text-2xl mb-4">Selected</h2>
          {selecting.map((file) => (
            <div className="mt-4" key={file.name}>
              <p>{file.name}</p>
            </div>
          ))}
          <div className="flex flex-col sm:flex-row mt-8">
            <button
              onClick={onClickMoveHere}
              disabled={isRunningAction}
              className="btn m-1"
            >
              Move here
            </button>
            <button
              onClick={onClickDelete}
              disabled={isRunningAction}
              className="btn m-1"
            >
              Delete
            </button>
            <button
              disabled={isRunningAction}
              onClick={() => {
                dispatch(storageSlice.actions.clearAllSelected());
              }}
              className="btn m-1"
            >
              Clear Selection
            </button>
          </div>
        </div>
      </div>
    </Slideout>
  );
}
