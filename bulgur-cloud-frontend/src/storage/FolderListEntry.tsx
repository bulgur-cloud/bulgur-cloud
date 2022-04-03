import { Text, HStack, Icon, Spacer } from "native-base";
import React, { useState } from "react";
import { runAsync, useClient } from "../client";
import { joinURL } from "../fetch";
import { FillSpacer } from "../FillSpacer";
import { storageSlice, useAppDispatch, useAppSelector } from "../store";
import { DeleteConfirmModal } from "./DeleteConfirmModal";
import { IMAGE_EXTENSIONS, PDF_EXTENSIONS } from "./File";
import { FontAwesome5 } from "@expo/vector-icons";
import { RenameModal } from "./RenameModal";
import api from "../api";

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

export function FolderListEntry({ item }: { item: api.FolderEntry }) {
  const dispatch = useAppDispatch();
  const { loadFolder } = useClient();
  const currentPath = useAppSelector((state) => state.storage.currentPath);
  const isMarkedForMove = useAppSelector(
    (state) =>
      state.storage.markedForMove[item.name] !== undefined &&
      state.storage.markedForMove[item.name] ===
        joinURL(currentPath, item.name),
  );

  function onPressHandler(item: api.FolderEntry) {
    return () => {
      dispatch(storageSlice.actions.markLoading());
      if (item.is_file) {
        dispatch(
          storageSlice.actions.loadFile({
            ...item,
            currentPath: joinURL(currentPath, item.name),
          }),
        );
      } else {
        runAsync(async () => loadFolder(joinURL(currentPath, item.name)));
      }
    };
  }

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
        onPress={onPressHandler(item)}
      />
      <Text onPress={onPressHandler(item)}>{item.name}</Text>
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
          dispatch(
            storageSlice.actions.markForMove({
              name: item.name,
              path: joinURL(currentPath, item.name),
            }),
          );
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
      />
      <DeleteConfirmModal
        itemName={item.name}
        isFile={item.is_file}
        isOpen={isDeleteModalOpen}
        onClose={() => setDeleteModelOpen(false)}
      />
    </HStack>
  );
}
