import { ErrorView } from "@/components/ErrorView";
import { FullPageSpinner } from "@/components/Spinner";
import api from "@/hooks/api";
import { useFolderListing } from "@/hooks/storage";
import { BError } from "@/utils/error";
import { humanSize } from "@/utils/human";
import Link from "next/link";
import { useCurrentPath } from "./CurrentPathProvider";
import ListingIcon from "./ListingIcon";
import { FileNotFound } from "./NotFound";

function Listing({ entry }: { entry: api.FolderEntry }) {
  const { fullPath } = useCurrentPath();
  return (
    <tr className="max-w-full group">
      <td className="py-4">
        <ListingIcon className="inline mr-1" entry={entry} />
      </td>
      <td className="break-all py-2 border-base-content border-b group-last:border-b-0 border-opacity-20">
        <Link
          className="w-full inline-block py-2"
          href={`/s/${fullPath}/${entry.name}`}
        >
          {entry.name}
        </Link>
      </td>
      <td className="py-4 border-base-content border-b group-last:border-b-0 border-opacity-20 text-center">
        {entry.is_file ? humanSize(entry.size) : "-"}
      </td>
    </tr>
  );
}

export function FolderList() {
  const { fullPath } = useCurrentPath();
  const resp = useFolderListing(fullPath);
  if (BError.isBError(resp)) {
    if (resp.code === "not_found") {
      return <FileNotFound />;
    }
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
