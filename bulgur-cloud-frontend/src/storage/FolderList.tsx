import { Center, Text, View, VStack } from "native-base";
import React from "react";
import useSWR from "swr";
import { useClient } from "../client";
import { NotFound } from "../NotFound";
import { DashboardParams } from "../routes";
import { CreateNewDirectory, MoveItems, UploadButton } from "../Upload";
import { FolderListEntry } from "./FolderListEntry";

export function FolderList(params: DashboardParams) {
  const { fetchFolder } = useClient();
  const { store, path } = params.route.params;
  const { data, error } = useSWR([store, path, "fetchFolder"], fetchFolder);

  const contents = data?.entries;

  if (data?.notFound) {
    return <NotFound />;
  }

  if (error) {
    console.log(error);
    return (
      <Center>
        <Text>Can't display this folder due to an error.</Text>
      </Center>
    );
  }

  if (!contents || contents.length === 0) {
    return (
      <Center>
        <Text color="darkText">This folder is empty.</Text>
        <FABs {...params} />
      </Center>
    );
  }

  return (
    <VStack space={3}>
      {contents.map((item, index) => (
        <FolderListEntry {...params} item={item} key={index} />
      ))}
      <FABs {...params} />
    </VStack>
  );
}

function FABs(params: DashboardParams) {
  return (
    <View>
      <UploadButton {...params} />
      <CreateNewDirectory {...params} />
      <MoveItems {...params} />
    </View>
  );
}
