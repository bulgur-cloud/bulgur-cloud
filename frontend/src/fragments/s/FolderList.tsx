import type { MouseEvent } from "react";
import { ErrorView } from "@/components/ErrorView";
import { FullPageSpinner } from "@/components/Spinner";
import api from "@/hooks/api";
import { useFolderListing } from "@/hooks/storage";
import { BError } from "@/utils/error";
import { humanSize } from "@/utils/human";
import { storageSlice, useAppDispatch, useAppSelector } from "@/utils/store";
import { joinURL } from "@/utils/url";
import { IconCheck } from "@tabler/icons-react";
import Link from "next/link";
import { useCallback } from "react";
import { useCurrentPath } from "./CurrentPathProvider";
import ListingIcon from "./ListingIcon";
import { FileNotFound } from "./NotFound";

function Listing({ entry }: { entry: api.FolderEntry }) {
  const { fullPath } = useCurrentPath();
  const dispatch = useAppDispatch();
  const isSelected = useAppSelector((state) => {
    const path = joinURL(fullPath, entry.name);
    return state.storage.selected[path] !== undefined;
  });
  const onSelect = useCallback(
    (event: MouseEvent<unknown>) => {
      event.preventDefault();
      event.stopPropagation();
      dispatch(
        storageSlice.actions.toggleSelected({
          path: fullPath,
          name: entry.name,
        }),
      );
    },
    [dispatch, fullPath, entry.name],
  );
  const onShiftSelect = useCallback(
    (event: MouseEvent) => {
      // Shift-clicking will select text between the last selected file and here.
      // But shift-click is also used to select files, so we need to prevent the text selection.
      // We'll reimplement a text copy & paste ourselves later.
      if (event.getModifierState("Shift")) {
        document.getSelection()?.removeAllRanges();
        onSelect(event);
      }
    },
    [onSelect],
  );

  return (
    <tr className="max-w-full group" onClick={onShiftSelect}>
      <td onClick={onSelect} className="py-4">
        <div className="relative">
          <ListingIcon className="inline mr-1" entry={entry} />
          {
            <IconCheck
              size={36}
              stroke={4}
              className={`transition-opacity ease-in-out absolute left-0 top-0 text-primary translate-x-[-10%] translate-y-[-15%] ${
                isSelected ? "opacity-100" : "opacity-0"
              }`}
            />
          }
        </div>
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
