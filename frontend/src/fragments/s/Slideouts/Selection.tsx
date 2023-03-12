import { Slideout } from "@/components/Slideout";
import { useDisclosure } from "@/utils/hooks/useDisclosure";
import { shallowEquals } from "@/utils/object";
import { storageSlice, useAppDispatch, useAppSelector } from "@/utils/store";
import {
  IconCheckbox,
  IconSelect,
  IconSelector,
  IconUpload,
} from "@tabler/icons-react";
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
  // When open, disable scrolling on the body. Otherwise when a user scrolls to
  // the bottom of the slideout it will scroll the body. Except, we only want to
  // do this if the slideout is covering most of the screen (i.e. mobile
  // vertical) otherwise the user may want to keep the slideout open and scroll
  // the body at the same time.
  useEffect(() => {
    const body = document.getElementsByTagName("body")[0];
    if (!isOpen) {
      body.style.overflow = "auto";
    } else {
      if (
        body &&
        body.getBoundingClientRect().width * 0.7 <
          (slideoutInner?.current?.getBoundingClientRect().width ?? 400)
      ) {
        body.style.overflow = "hidden";
      }
    }
  }, [isOpen, slideoutInner]);

  // When the upload starts, open the slideout. When it ends, close it.
  useEffect(() => {
    if (isSelecting) {
      onOpen();
    } else {
      onClose();
    }
  }, [isSelecting, onOpen, onClose]);

  return (
    <Slideout isOpen={isOpen} side="left">
      <button
        onClick={onToggle}
        style={{ visibility: isSelecting ? "visible" : "hidden" }}
        className="absolute left-full top-16 bg-base-100 p-4 rounded-r-2xl drop-shadow-xl"
      >
        <IconCheckbox />
      </button>
      {/* w is 80% of the screen, but that's mainly for small width screens like vertical phones. We really want max-w-prose. */}
      <div
        ref={slideoutInner}
        className="rounded-r-2xl overflow-hidden border-base-content border-2 border-l-0"
      >
        <div className="bg-base-100 drop-shadow-xl min-h-1/2-screen max-h-screen p-4 w-[80vw] max-w-prose overflow-y-auto">
          <h2 className="text-2xl mb-4">Selected</h2>
          {selecting.map((file) => (
            <div className="mt-4" key={file.name}>
              <p>{file.name}</p>
            </div>
          ))}
          <div className="flex flex-row mt-8">
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
