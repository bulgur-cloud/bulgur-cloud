import { FullPageSpinner } from "@/components/Spinner";
import api from "@/hooks/api";
import { useFolderListing, usePathMeta } from "@/hooks/storage";
import { BError } from "@/utils/error";
import { useCurrentPath } from "./CurrentPathProvider";
import { FileNotFound } from "./NotFound";

export function FolderList() {
  const { fullPath, name } = useCurrentPath();
  const resp = usePathMeta(fullPath);
  if (BError.isBError(resp)) {
    return <p>Uh oh!</p>;
  }
  if (resp.data === undefined) {
    return <FullPageSpinner />;
  }
  const { exists, size } = resp.data;

  if (!exists) {
    return <FileNotFound />;
  }

  return (
    <p>
      File {name} has size {size}
    </p>
  );
}
