import {
  Center,
  Text,
  View,
  VStack,
  Box,
  HStack,
  Progress,
  Spacer,
  Heading,
} from "native-base";
import { STORAGE } from "../client/base";
import { useFolderListing } from "../client/storage";
import { BError } from "../error";
import { joinURL } from "../fetch";
import { Loading } from "../Loading";
import { DashboardParams } from "../routes";
import { useAppSelector } from "../store";
import { CreateNewDirectory, MoveItems, UploadButton } from "../Upload";
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
  const uploadProgress = useAppSelector(
    (selector) => selector.storage.uploadProgress,
  );

  if (response instanceof BError) {
    return <ErrorDisplay error={response} />;
  }
  if (response.error) {
    return <ErrorDisplay error={response.error} />;
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
      <VStack space={16}>
        <VStack space={3}>
          {contents.map((item, index) => (
            <FolderListEntry {...params} item={item} key={index} />
          ))}
        </VStack>
        <VStack space={3}>
          {Object.values(uploadProgress).map(({ name, total, done }) => {
            const percent = Math.floor((done / total) * 100);
            return (
              <VStack space={2} key={name}>
                <HStack space={8}>
                  <Text>{name}</Text>
                  <Text>{percent}% uploaded</Text>
                </HStack>
                <Progress width="100%" colorScheme="primary" value={percent} />
              </VStack>
            );
          })}
        </VStack>
      </VStack>
    );
  }

  return (
    <VStack>
      <Center height="1rem">
        {response.isValidating ? <Loading /> : <Box />}
      </Center>
      {body}
      <FABs {...params} />
    </VStack>
  );
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
