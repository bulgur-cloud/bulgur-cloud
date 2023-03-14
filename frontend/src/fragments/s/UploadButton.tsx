import { useRunAsync } from "@/hooks/base";
import { useUpload } from "@/hooks/storage";
import { useCallback } from "react";
import { useCurrentPath } from "./CurrentPathProvider";

function selectFiles(): Promise<null | File[]> {
  return new Promise((resolve) => {
    const picker = document.createElement("input");
    picker.type = "file";
    picker.multiple = true;
    picker.accept = "*";
    picker.onchange = () => {
      // Cancelled prompt
      if (!picker.files) {
        resolve(null);
        return;
      }

      const files = Array.from(picker.files);
      resolve(files);
      return;
    };
    picker.click();
  });
}

export function UploadButton() {
  const { doUpload } = useUpload();
  const { runAsync } = useRunAsync();
  const { fullPath } = useCurrentPath();

  const upload = useCallback(() => {
    runAsync(async () => {
      const files = await selectFiles();
      if (!files || files.length === 0) return;
      await doUpload(fullPath, files);
    });
  }, [runAsync, doUpload, fullPath]);

  return (
    <button onClick={upload} className="btn btn-primary mx-2">
      Upload
    </button>
  );
}
