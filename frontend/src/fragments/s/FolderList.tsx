import { FullPageSpinner } from "@/components/Spinner";
import { useFolderListing } from "@/hooks/storage";
import { BError } from "@/utils/error";
import { useCurrentPath } from "./CurrentPathProvider";

export function FolderList() {
  const { fullPath } = useCurrentPath();
  const resp = useFolderListing(fullPath);
  if (BError.isBError(resp)) {
    return <p>Uh oh!</p>;
  }
  if (resp.data === undefined) {
    return <FullPageSpinner />;
  }
  const { entries } = resp.data.data;

  return (
    <>
      {entries.map((entry) => {
        return <p key={entry.name}>{entry.name}</p>;
      })}
    </>
  );
}
