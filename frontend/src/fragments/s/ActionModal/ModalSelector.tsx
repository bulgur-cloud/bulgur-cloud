import { shallowEquals } from "@/utils/object";
import { useAppSelector } from "@/utils/store";
import { NewFolderModal } from "./NewFolderModal";

export function ModalSelector() {
  const action = useAppSelector(
    ({ storage: { action } }) => action,
    shallowEquals,
  );

  if (action?.type === "CreateFolder") {
    return <NewFolderModal action={action} />;
  }

  return <></>;
}
