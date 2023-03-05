import { HStack, Icon, Menu, Pressable, Text } from "native-base";
import { joinURL } from "../fetch";
import {
  StorageAction,
  storageSlice,
  useAppDispatch,
  useAppSelector,
} from "../store";
import { IMAGE_EXTENSIONS, PDF_EXTENSIONS } from "./File";
import { FontAwesome5 } from "@expo/vector-icons";
import api from "../../../frontend/src/hooks/api";
import { DashboardParams } from "../routes";
import { BLink } from "../BLink";

function itemIconType({
  isFile,
  isSelected,
  itemName,
}: {
  isFile: boolean;
  isSelected: boolean;
  itemName: string;
}) {
  if (isSelected) return "check";
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
  const isSelected = useAppSelector(
    (state) =>
      state.storage.selected[
        joinURL(route.params.store, route.params.path, item.name)
      ] !== undefined,
  );
  const isHidden = item.name.startsWith(".");

  const { store, path } = route.params;

  const selectEntry = () => {
    const params = {
      store: route.params.store,
      path: route.params.path,
      name: item.name,
      isFile: item.is_file,
    };
    if (isSelected) {
      dispatch(storageSlice.actions.unmarkSelected(params));
    } else {
      dispatch(storageSlice.actions.markSelected(params));
    }
  };

  return (
    <HStack space={4} key={item.name} alignItems="center">
      <Icon
        size="sm"
        as={FontAwesome5}
        name={itemIconType({
          isFile: item.is_file,
          itemName: item.name,
          isSelected,
        })}
        color="darkText"
        opacity={isHidden ? 40 : 100}
        onPress={selectEntry}
      />
      <BLink
        style={{ flexGrow: 1 }}
        screen="Dashboard"
        params={{
          store,
          path: path === "" ? item.name : joinURL(path, item.name),
          isFile: item.is_file,
        }}
        onPress={(e) => {
          const { ctrlKey, shiftKey } = e.nativeEvent as {
            ctrlKey?: boolean;
            shiftKey?: boolean;
          };
          if (ctrlKey || shiftKey) {
            e.preventDefault();
            selectEntry();
          }
        }}
      >
        <Text opacity={isHidden ? 40 : 100}>{item.name}</Text>
      </BLink>
      <ActionMenu
        store={store}
        path={path}
        isFile={item.is_file}
        name={item.name}
        isSelected={isSelected}
      />
    </HStack>
  );
}

type ActionMenuProps = {
  store: string;
  path: string;
  name: string;
  isFile: boolean;
  isSelected: boolean;
};

/** The action menu displayed for every folder entry.
 *
 * TODO: There should be just one Action Menu component! Rendering this over and
 * over again is expensive and unnecessary. Pressing the icon button or right
 * clicking/long pressing on the item should trigger an action that displays the
 * menu on the location of the mouse.
 */
function ActionMenu({
  store,
  path,
  name,
  isFile,
  isSelected,
}: ActionMenuProps) {
  const dispatch = useAppDispatch();

  return (
    <Menu
      trigger={(props) => {
        return (
          <Pressable {...props}>
            <Icon
              as={FontAwesome5}
              name="ellipsis-h"
              accessibilityLabel="actions"
              opacity={props ? 0.8 : 1}
              height="100%"
              size={4}
            />
          </Pressable>
        );
      }}
    >
      <Menu.Item
        onPress={() => {
          if (isSelected) {
            dispatch(
              storageSlice.actions.unmarkSelected({
                store,
                name,
                path,
              }),
            );
          } else {
            dispatch(
              storageSlice.actions.markSelected({
                store,
                name,
                isFile,
                path,
              }),
            );
          }
        }}
      >
        {isSelected ? "Unselect" : "Select"}
      </Menu.Item>
      <Menu.Item
        onPress={() => {
          dispatch(
            storageSlice.actions.promptAction({
              type: StorageAction.Rename,
              isFile,
              name,
              path,
              store,
            }),
          );
        }}
      >
        Rename
      </Menu.Item>
      <Menu.Item
        onPress={() => {
          dispatch(
            storageSlice.actions.promptAction({
              type: StorageAction.Delete,
              isFile,
              name,
              path,
              store,
            }),
          );
        }}
      >
        Delete
      </Menu.Item>
    </Menu>
  );
}
