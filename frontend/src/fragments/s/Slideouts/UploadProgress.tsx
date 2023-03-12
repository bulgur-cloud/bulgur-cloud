import { Slideout } from "@/components/Slideout";
import { useDisclosure } from "@/utils/hooks/useDisclosure";
import { shallowEquals } from "@/utils/object";
import { useAppSelector } from "@/utils/store";
import { IconUpload } from "@tabler/icons-react";
import { useEffect, useMemo, useRef } from "react";

export function UploadProgress() {
  const uploadProgress = useAppSelector(
    (state) => state.storage.uploadProgress,
    shallowEquals,
  );
  const uploads = useMemo(() => {
    return Object.values(uploadProgress);
  }, [uploadProgress]);
  const isUploading = useMemo(() => {
    return uploads.length > 0;
  }, [uploads]);
  const { isOpen, onToggle, onOpen, onClose } = useDisclosure(false);

  const slideoutInner = useRef<HTMLDivElement>(null);

  // When the upload starts, open the slideout. When it ends, close it.
  useEffect(() => {
    if (isUploading) {
      onOpen();
    } else {
      onClose();
    }
  }, [isUploading, onOpen, onClose]);

  return (
    <Slideout isOpen={isOpen} side="left">
      <button
        onClick={onToggle}
        style={{ visibility: isUploading ? "visible" : "hidden" }}
        className="absolute left-full top-16 bg-base-100 p-4 rounded-r-2xl drop-shadow-xl"
      >
        <IconUpload />
      </button>
      {/* w is 80% of the screen, but that's mainly for small width screens like vertical phones. We really want max-w-prose. */}
      <div ref={slideoutInner} className="rounded-r-2xl overflow-hidden">
        <div className="bg-base-100 drop-shadow-xl min-h-1/2-screen max-h-screen p-4 w-[80vw] max-w-prose border-base-content border-2 border-l-0 rounded-r-2xl overflow-y-scroll overscroll-contain my-2">
          <h2 className="text-2xl mb-4">Uploads</h2>

          {uploads.map((upload) => (
            <div className="mt-4" key={upload.name}>
              <p>{upload.name}</p>
              <div className="w-full flex flex-row items-center">
                <progress
                  className="progress mr-2"
                  value={(upload.done / upload.total) * 100}
                  max={100}
                />
                <span>
                  {((upload.done / upload.total) * 100).toPrecision(3)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Slideout>
  );
}
