import { Portal } from "@/components/Portal";
import { useRunAsync } from "@/hooks/base";
import { useUpload } from "@/hooks/storage";
import { clsx } from "@/utils/clsx";
import { useDisclosure } from "@/utils/hooks/useDisclosure";
import React, { useCallback, useEffect } from "react";
import { useCurrentPath } from "./CurrentPathProvider";

function onDragOver(e: React.DragEvent) {
  e.preventDefault();
  e.stopPropagation();
}

export function UploadDropzone() {
  const { fullPath } = useCurrentPath();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { doUpload } = useUpload();
  const { runAsync } = useRunAsync();

  const onDragEnter = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onOpen();
    },
    [onOpen],
  );
  const onDragLeave = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onClose();
    },
    [onClose],
  );
  const onDrop = useCallback(
    (e: React.DragEvent) => {
      console.log("on drop");
      e.preventDefault();
      e.stopPropagation();
      onClose();

      runAsync(async () => {
        const files: File[] = [];
        for (let i = 0; i < e.dataTransfer.files.length; i++) {
          files.push(e.dataTransfer.files[i]);
        }
        await doUpload(fullPath, files);
      });
    },
    [doUpload, onClose, fullPath],
  );

  // The dragenter event will not fire on the dropzone because the dropzone is
  // hidden. It will still fire on the window, so we'll listen for that.
  useEffect(() => {
    window.addEventListener("dragenter", onDragEnter);
    return () => {
      window.removeEventListener("dragenter", onDragEnter);
    };
  }, [onDragEnter]);

  // We don't need to attach dragenter to the dropzone because the one fired
  // from the window is enough
  return (
    <Portal>
      <div
        className={clsx(
          "w-screen h-screen fixed top-0 left-0 z-50 bg-black bg-opacity-80 flex items-center justify-center text-4xl p-4 transition-all duration-200 ease-in-out",
          isOpen ? "visible opacity-100" : "invisible opacity-0",
        )}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onDragOver={onDragOver}
      >
        Drop files here to upload them
      </div>
    </Portal>
  );
}
