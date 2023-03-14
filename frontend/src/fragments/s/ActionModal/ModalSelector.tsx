import { shallowEquals } from "@/utils/object";
import { useAppSelector } from "@/utils/store";
import { DeleteModal } from "./DeleteModal";
import { NewFolderModal } from "./NewFolderModal";
import { RenameModal } from "./RenameModal";

export function ModalSelector() {
  const action = useAppSelector(
    ({ storage: { action } }) => action,
    shallowEquals,
  );

  if (action?.type === "CreateFolder") {
    return <NewFolderModal action={action} />;
  }

  if (action?.type === "Rename") {
    return <RenameModal action={action} />;
  }

  if (action?.type === "Delete") {
    return <DeleteModal action={action} />;
  }

  return <></>;
}
