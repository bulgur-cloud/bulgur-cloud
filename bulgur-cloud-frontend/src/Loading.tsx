import { Center, Heading, HStack, Spinner } from "native-base";

export function Loading() {
  return (
    <HStack space={2} justifyContent="center">
      <Spinner accessibilityLabel="animated spinning circle" />
      <Heading color="primary.500" fontSize="md">
        Loading
      </Heading>
    </HStack>
  );
}

export function FullPageLoading() {
  return (
    <Center justifyContent="center" flexGrow={1}>
      <Loading />
    </Center>
  );
}
