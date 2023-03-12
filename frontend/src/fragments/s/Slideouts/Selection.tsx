import { Slideout } from "@/components/Slideout";
import { useDisclosure } from "@/utils/hooks/useDisclosure";
import { shallowEquals } from "@/utils/object";
import { storageSlice, useAppDispatch, useAppSelector } from "@/utils/store";
import { IconCheckbox } from "@tabler/icons-react";
import { useEffect, useMemo, useRef } from "react";

export function Selection() {
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
        className="absolute right-full top-16 bg-base-100 p-4 rounded-l-2xl drop-shadow-xl"
      >
        <IconCheckbox />
      </button>
      {/* w is 80% of the screen, but that's mainly for small width screens like vertical phones. We really want max-w-prose. */}
      <div
        ref={slideoutInner}
        className="rounded-l-2xl overflow-hidden border-base-content border-2 border-r-0"
      >
        <div className="bg-base-100 drop-shadow-xl min-h-1/2-screen max-h-9/10-screen p-4 w-[80vw] max-w-prose overflow-y-auto overscroll-contain">
          <h2 className="text-2xl mb-4">Selected</h2>
          {selecting.map((file) => (
            <div className="mt-4" key={file.name}>
              <p>{file.name}</p>
            </div>
          ))}
          <div className="flex flex-col sm:flex-row mt-8">
            <button className="btn m-1">Move here</button>
            <button className="btn m-1">Delete</button>
            <button
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
