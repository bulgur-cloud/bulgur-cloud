import { HStack, Icon, Spacer, Text } from "native-base";
import { joinURL } from "../fetch";
import { FillSpacer } from "../FillSpacer";
import {
  StorageAction,
  storageSlice,
  useAppDispatch,
  useAppSelector,
} from "../store";
import { IMAGE_EXTENSIONS, PDF_EXTENSIONS } from "./File";
import { FontAwesome5 } from "@expo/vector-icons";
import api from "../api";
import { DashboardParams } from "../routes";
import { BLink } from "../BLink";

function itemIconType({
  isFile,
  isMarkedForMove,
  itemName,
}: {
  isFile: boolean;
  isMarkedForMove: boolean;
  itemName: string;
}) {
  if (isMarkedForMove) return "check";
  if (!isFile) return "folder";
  const extensionMatch = /[.]([^.]+)$/.exec(itemName);
  const extension = extensionMatch ? extensionMatch[1] : undefined;
  if (extension) {
    if (IMAGE_EXTENSIONS.has(extension)) return "file-image";
    if (PDF_EXTENSIONS.has(extension)) return "file-pdf";
  }
  return "file";
}

export function FolderListEntry(
  params: { item: api.FolderEntry } & DashboardParams,
) {
  const { item, route } = params;
  const dispatch = useAppDispatch();
  const isMarkedForMove = useAppSelector(
    (state) =>
      state.storage.selected[
        joinURL(route.params.store, route.params.path, item.name)
      ] !== undefined,
  );
  const isHidden = item.name.startsWith(".");

  const { store, path } = route.params;

  return (
    <HStack space={4} key={item.name} alignItems="center">
      <Icon
        size="sm"
        as={FontAwesome5}
        name={itemIconType({
          isFile: item.is_file,
          itemName: item.name,
          isMarkedForMove,
        })}
        color="darkText"
        opacity={isHidden ? 40 : 100}
      />
      <BLink
        screen="Dashboard"
        params={{
          store,
          path: path === "" ? item.name : joinURL(path, item.name),
          isFile: item.is_file,
        }}
      >
        <Text opacity={isHidden ? 40 : 100}>{item.name}</Text>
      </BLink>
      <FillSpacer />
      <Icon
        as={FontAwesome5}
        name="pencil-alt"
        accessibilityLabel="rename"
        height="100%"
        size={4}
        onPress={() => {
          dispatch(
            storageSlice.actions.promptAction({
              type: StorageAction.Rename,
              name: item.name,
              path,
              store,
              isFile: item.is_file,
            }),
          );
        }}
      />
      <Spacer flexGrow={0} />
      <Icon
        as={FontAwesome5}
        name="arrows-alt"
        accessibilityLabel="move"
        height="100%"
        size={4}
        onPress={() => {
          const params = {
            store: route.params.store,
            path: route.params.path,
            name: item.name,
          };
          if (isMarkedForMove) {
            dispatch(storageSlice.actions.unmarkForMove(params));
          } else {
            dispatch(storageSlice.actions.markForMove(params));
          }
        }}
      />
      <Spacer flexGrow={0} />
      <Icon
        as={FontAwesome5}
        name="trash-alt"
        accessibilityLabel="delete"
        height="100%"
        size={4}
        onPress={() => {
          dispatch(
            storageSlice.actions.promptAction({
              type: StorageAction.Delete,
              name: item.name,
              store,
              path,
              isFile: item.is_file,
            }),
          );
        }}
      />
    </HStack>
  );
}
