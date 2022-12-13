import {
  VStack,
  HStack,
  Text,
  Progress,
  Box,
  Heading,
  Spacer,
} from "native-base";
import { SidePanel } from "./components/SidePanel";
import { useAppSelector } from "./store";

export function UploadProgress() {
  const isEmpty = useAppSelector(
    (selector) => Object.entries(selector.storage.uploadProgress).length === 0,
  );

  return (
    <SidePanel side="right" isOpen={!isEmpty}>
      <UploadProgressItems />
    </SidePanel>
  );
}

export function UploadProgressItems() {
  const uploadProgress = useAppSelector(
    (selector) => selector.storage.uploadProgress,
  );

  return (
    <Box width={480} backgroundColor="white" shadow={4}>
      <Heading textAlign="center" fontSize={24} fontFamily="Bitter">
        Uploads
      </Heading>
      <Spacer height={4} />
      {Object.values(uploadProgress).map(({ name, total, done }) => {
        const percent = Math.floor((done / total) * 100);
        return (
          <VStack space={2} key={name} padding={4}>
            <HStack space={8}>
              <Text>{name}</Text>
              <Text>{percent}% uploaded</Text>
            </HStack>
            <Progress width="100%" colorScheme="primary" value={percent} />
          </VStack>
        );
      })}
    </Box>
  );
}
