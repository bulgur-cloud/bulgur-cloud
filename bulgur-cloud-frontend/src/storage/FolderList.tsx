import { Center, Text, View, VStack } from "native-base";
import React from "react";
import { DashboardParams } from "../routes";
import { useAppSelector } from "../store";
import { CreateNewDirectory, MoveItems, UploadButton } from "../Upload";
import { FolderListEntry } from "./FolderListEntry";

export function FolderList(params: DashboardParams) {
  const contents = useAppSelector((state) => state.storage.contents);

  if (contents.length === 0) {
    return (
      <Center>
        <Text color="darkText">This folder is empty.</Text>
        <FABs />
      </Center>
    );
  }

  return (
    <VStack space={3}>
      {contents.map((item, index) => (
        <FolderListEntry {...params} item={item} key={index} />
      ))}
      <FABs />
    </VStack>
  );
}

function FABs() {
  return (
    <View>
      <UploadButton />
      <CreateNewDirectory />
      <MoveItems />
    </View>
  );
}
