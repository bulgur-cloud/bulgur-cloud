import { FullPageSpinner } from "@/components/Spinner";
import { usePathMeta } from "@/hooks/storage";
import { useCurrentPath } from "./CurrentPathProvider";
import { FileNotFound } from "./NotFound";

export function FolderList() {
  const { fullPath, name } = useCurrentPath();
  const resp = usePathMeta(fullPath);
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
