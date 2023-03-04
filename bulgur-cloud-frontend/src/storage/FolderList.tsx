import { Center, Text, View, VStack, Spacer, Heading } from "native-base";
import { STORAGE } from "../client/base";
import { useFolderListing } from "../client/storage";
import { BError } from "../../../frontend/src/utils/error";
import { joinURL } from "../fetch";
import { Loading } from "../Loading";
import { DashboardParams } from "../routes";
import { CreateNewFolder, UploadButton } from "../Upload";
import { FolderListEntry } from "./FolderListEntry";

function ErrorDisplay({ error }: { error: unknown }) {
  if (error instanceof BError) {
    return (
      <Center>
        <VStack space={4}>
          <Text>Can&apos;t display this folder due to an error.</Text>
          <Spacer />
          <Heading>{error.title}</Heading>
          <Text>{error.description}</Text>
          <Text>
            Error code: <Text fontFamily={"monospace"}>{error.code}</Text>
          </Text>
        </VStack>
      </Center>
    );
  } else {
    return (
      <Center>
        <VStack>
          <Text>Can&apos;t display this folder due to an error.</Text>
          <Spacer />
          <Text>{JSON.stringify(error)}</Text>
        </VStack>
      </Center>
    );
  }
}

export function FolderList(params: DashboardParams) {
  const { store, path } = params.route.params;
  const response = useFolderListing(joinURL(STORAGE, store, path));

  if (response instanceof BError) {
    return <ErrorDisplay error={response} />;
  }
  if (response.error) {
    return <ErrorDisplay error={response.error} />;
  }

  const contents = response.data?.data?.entries;

  if (!contents || contents.length === 0) {
    return (
      <VStack>
        <IsLoadingIndicator isValidating={response.isValidating} />
        <Center>
          <Text color="darkText">This folder is empty.</Text>
        </Center>
      </VStack>
    );
  }

  return (
    <VStack>
      <IsLoadingIndicator isValidating={response.isValidating} />
      <VStack space={3}>
        {contents.map((item) => (
          <FolderListEntry {...params} item={item} key={item.name} />
        ))}
      </VStack>
    </VStack>
  );
}

function IsLoadingIndicator({ isValidating }: { isValidating: boolean }) {
  return (
    <Center height="1rem">
      <Loading visible={isValidating} />
    </Center>
  );
}

export function FABs(params: DashboardParams) {
  return (
    <View height={32}>
      <UploadButton {...params} />
      <CreateNewFolder {...params} />
    </View>
  );
}
