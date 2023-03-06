import { FullPageSpinner } from "@/components/Spinner";
import api from "@/hooks/api";
import { useFolderListing } from "@/hooks/storage";
import { BError } from "@/utils/error";
import { useCurrentPath } from "./CurrentPathProvider";
import ListingIcon from "./ListingIcon";

function Listing({ entry }: { entry: api.FolderEntry }) {
  return (
    <li className="my-2">
      <ListingIcon className="inline mr-2" entry={entry} />
      {entry.name}
    </li>
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
    <ul>
      {entries.map((entry) => (
        <Listing entry={entry} key={entry.name} />
      ))}
    </ul>
  );
}
