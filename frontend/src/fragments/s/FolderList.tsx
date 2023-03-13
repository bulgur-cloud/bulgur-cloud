import type { MouseEvent } from "react";
import { ErrorView } from "@/components/ErrorView";
import { FullPageSpinner } from "@/components/Spinner";
import api from "@/hooks/api";
import { useFolderListing } from "@/hooks/storage";
import { BError } from "@/utils/error";
import { humanSize } from "@/utils/human";
import { storageSlice, useAppDispatch, useAppSelector } from "@/utils/store";
import { joinURL } from "@/utils/url";
import { IconCheck, IconDots, IconMenu } from "@tabler/icons-react";
import Link from "next/link";
import { useCallback } from "react";
import { useCurrentPath } from "./CurrentPathProvider";
import ListingIcon from "./ListingIcon";
import { FileNotFound } from "./NotFound";
import { Dropdown } from "@/components/Dropdown";

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
      // We want to use shift-clicking to select files, not text range selection.
      // So we'll remove text selected by shift clicking.
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
      <td className="py-4 border-base-content border-b group-last:border-b-0 border-opacity-20 text-center">
        {/* TODO: Should use a single dropdown that targets the correct button instead of a different dropdown per item */}
        <Dropdown
          trigger={
            <button className="btn btn-square btn-ghost">
              <IconDots />
            </button>
          }
        >
          <button
            onClick={() => {
              dispatch(
                storageSlice.actions.promptAction({
                  path: joinURL(fullPath, entry.name),
                  type: "Rename",
                }),
              );
            }}
            className="btn btn-ghost w-full rounded-none focus:bg-base-200 focus:outline-none"
          >
            Rename
          </button>
          <button
            onClick={() => {
              dispatch(
                storageSlice.actions.promptAction({
                  path: joinURL(fullPath, entry.name),
                  type: "Delete",
                }),
              );
            }}
            className="btn btn-ghost w-full rounded-none focus:bg-base-200 focus:outline-none"
          >
            Delete
          </button>
        </Dropdown>
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
        <col style={{ width: "32px" }} />
      </colgroup>
      <thead>
        <tr>
          <th className="bg-base-200 py-4 rounded-tl-lg"></th>
          <th className="bg-base-200 py-4">Name</th>
          <th className="bg-base-200 py-4">Size</th>
          <th className="bg-base-200 py-4 rounded-tr-lg "></th>
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
