import { ErrorView } from "@/components/ErrorView";
import { FullPageSpinner } from "@/components/Spinner";
import api from "@/hooks/api";
import { useFolderListing } from "@/hooks/storage";
import { BError } from "@/utils/error";
import Link from "next/link";
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
  const { fullPath } = useCurrentPath();
  return (
    <tr className="max-w-full group">
      <td className="py-4">
        <ListingIcon className="inline mr-1" entry={entry} />
      </td>
      <Link href={`/s/${fullPath}/${entry.name}`}>
        <td className="break-all py-4 border-base-content border-b group-last:border-b-0 border-opacity-20">
          {entry.name}
        </td>
      </Link>
      <td className="py-4 border-base-content border-b group-last:border-b-0 border-opacity-20">
        {humanSize(entry.size)}
      </td>
    </tr>
  );
}

export function FolderList() {
  const { fullPath } = useCurrentPath();
  const resp = useFolderListing(fullPath);
  if (BError.isBError(resp)) {
    return <ErrorView error={resp} />;
  }
  if (resp.data === undefined) {
    return <FullPageSpinner />;
  }
  const { entries } = resp.data.data;

  return (
    <table className="w-full">
      <colgroup>
        <col style={{ width: "32px" }} />
        <col />
        <col style={{ width: "85px" }} />
      </colgroup>
      <thead>
        <tr>
          <th className="bg-base-200 rounded-tl-lg py-4"></th>
          <th className="bg-base-200 py-4">Name</th>
          <th className="bg-base-200 rounded-tr-lg py-4">Size</th>
        </tr>
      </thead>
      <tbody>
        {entries.length === 0 && (
          <tr>
            <td colSpan={3} className="text-center p-8">
              This folder is empty.
            </td>
          </tr>
        )}
        {entries.map((entry) => (
          <Listing entry={entry} key={entry.name} />
        ))}
      </tbody>
    </table>
  );
}
