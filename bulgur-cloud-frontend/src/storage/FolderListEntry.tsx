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
import { Link, StackActions } from "@react-navigation/native";
import { DashboardParams } from "../routes";
import { BLink } from "../BLink";

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
      state.storage.markedForMove[
        joinURL(route.params.store, route.params.path, item.name)
      ] !== undefined,
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
      <BLink
        screen="Dashboard"
        params={{
          store,
          path: path === "" ? item.name : joinURL(path, item.name),
          isFile: item.is_file,
        }}
      >
        <Text opacity={isMarkedForMove ? 20 : 100}>{item.name}</Text>
      </BLink>
      <FillSpacer />
      <Icon
        as={FontAwesome5}
        name="pencil-alt"
        accessibilityLabel="rename"
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
