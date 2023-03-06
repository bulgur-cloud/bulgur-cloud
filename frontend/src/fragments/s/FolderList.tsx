import { FullPageSpinner } from "@/components/Spinner";
import api from "@/hooks/api";
import { useFolderListing } from "@/hooks/storage";
import { BError } from "@/utils/error";
import { useCurrentPath } from "./CurrentPathProvider";
import ListingIcon from "./ListingIcon";

function humanSize(sizeBytes: number) {
  if (sizeBytes < 1024) {
    return `${sizeBytes} B`;
  }
  if (sizeBytes < 1024 * 1024) {
    return `${(sizeBytes / 1024).toFixed(2)} KB`;
  }
  if (sizeBytes < 1024 * 1024 * 1024) {
    return `${(sizeBytes / 1024 / 1024).toFixed(2)} MB`;
  }
  if (sizeBytes < 1024 * 1024 * 1024 * 1024) {
    return `${(sizeBytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
  }
  return `${(sizeBytes / 1024 / 1024 / 1024 / 1024).toFixed(2)} TB`;
}

function Listing({ entry }: { entry: api.FolderEntry }) {
  return (
    <tr className="max-w-full">
      <td>
        <ListingIcon className="inline mr-1" entry={entry} />
      </td>
      <td className="break-all w-4 text-ellipsis overflow-hidden">
        {entry.name}
      </td>
      <td>{humanSize(entry.size)}</td>
    </tr>
  );
}

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
    <table className="table">
      <thead>
        <tr>
          <th></th>
          <th>Name</th>
          <th>Size</th>
        </tr>
      </thead>
      <tbody>
        {entries.map((entry) => (
          <Listing entry={entry} key={entry.name} />
        ))}
      </tbody>
    </table>
  );
}
