import { Center, Text, View, VStack, Box } from "native-base";
import { STORAGE } from "../client/base";
import { useFolderListing } from "../client/storage";
import { joinURL } from "../fetch";
import { Loading } from "../Loading";
import { DashboardParams } from "../routes";
import { CreateNewDirectory, MoveItems, UploadButton } from "../Upload";
import { FolderListEntry } from "./FolderListEntry";

export function FolderList(params: DashboardParams) {
  const { store, path } = params.route.params;
  console.log("FolderList", store, path);
  console.log(joinURL(STORAGE, store, path));
  const response = useFolderListing(joinURL(STORAGE, store, path));

  if (response.error) {
    console.log(response.error);
    return (
      <Center>
        <Text>Can&apos;t display this folder due to an error.</Text>
      </Center>
    );
  }

  let body: JSX.Element;

  const contents = response.data?.data?.entries;
  if (!contents || contents.length === 0) {
    body = (
      <Center>
        <Text color="darkText">This folder is empty.</Text>
      </Center>
    );
  } else {
    body = (
      <VStack space={3}>
        {contents.map((item, index) => (
          <FolderListEntry {...params} item={item} key={index} />
        ))}
      </VStack>
    );
  }

  return <VStack>
    <Center height="1rem">
      {
        response.isValidating ? <Loading /> : <Box />
      }
    </Center>
    {body}
    <FABs {...params} />
  </VStack>;
}

function FABs(params: DashboardParams) {
  return (
    <View height={32}>
      <UploadButton {...params} />
      <CreateNewDirectory {...params} />
      <MoveItems {...params} />
    </View>
  );
}
