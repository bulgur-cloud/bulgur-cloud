import { Text, HStack, Icon, Spacer } from "native-base";
import React, { useState } from "react";
import { joinURL } from "../fetch";
import { FillSpacer } from "../FillSpacer";
import { storageSlice, useAppDispatch, useAppSelector } from "../store";
import { DeleteConfirmModal } from "./DeleteConfirmModal";
import { IMAGE_EXTENSIONS, PDF_EXTENSIONS } from "./File";
import { FontAwesome5 } from "@expo/vector-icons";
import { RenameModal } from "./RenameModal";
import api from "../api";
import { Link } from "@react-navigation/native";
import { DashboardParams } from "../routes";

function itemIconType({
  isFile,
  itemName,
}: {
  isFile: boolean;
  itemName: string;
}) {
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
      state.storage.markedForMove[item.name] !== undefined &&
      state.storage.markedForMove[item.name] ===
        joinURL(route.params.store, route.params.path, item.name),
  );
  const { store, path } = route.params;

  const [isRenameModalOpen, setRenameModelOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setDeleteModelOpen] = useState<boolean>(false);

  return (
    <HStack space={4} key={item.name} alignItems="center">
      <Icon
        size="sm"
        as={FontAwesome5}
        name={itemIconType({ isFile: item.is_file, itemName: item.name })}
        color="darkText"
        opacity={isMarkedForMove ? 20 : 100}
      />
      <Link
        to={{
          screen: "Dashboard",
          params: {
            store,
            path: path === "" ? item.name : joinURL(path, item.name),
            isFile: item.is_file,
          },
        }}
      >
        <Text opacity={isMarkedForMove ? 20 : 100}>{item.name}</Text>
      </Link>
      <FillSpacer />
      <Icon
        as={FontAwesome5}
        name="pencil-alt"
        height="100%"
        size={4}
        onPress={() => {
          setRenameModelOpen(true);
        }}
      />
      <Spacer flexGrow={0} />
      <Icon
        as={FontAwesome5}
        name="arrows-alt"
        height="100%"
        size={4}
        onPress={() => {
          if (isMarkedForMove) {
            dispatch(
              storageSlice.actions.unmarkForMove({
                name: item.name,
                path: joinURL(route.params.store, route.params.path, item.name),
              }),
            );
          } else {
            dispatch(
              storageSlice.actions.markForMove({
                name: item.name,
                path: joinURL(route.params.store, route.params.path, item.name),
              }),
            );
          }
        }}
      />
      <Spacer flexGrow={0} />
      <Icon
        as={FontAwesome5}
        name="trash-alt"
        height="100%"
        size={4}
        onPress={() => {
          setDeleteModelOpen(true);
        }}
      />
      <RenameModal
        itemName={item.name}
        isOpen={isRenameModalOpen}
        onClose={() => setRenameModelOpen(false)}
        {...params}
      />
      <DeleteConfirmModal
        itemName={item.name}
        isFile={item.is_file}
        isOpen={isDeleteModalOpen}
        onClose={() => setDeleteModelOpen(false)}
        {...params}
      />
    </HStack>
  );
}
