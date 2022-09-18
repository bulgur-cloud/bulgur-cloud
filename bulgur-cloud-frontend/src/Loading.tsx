import { Center, Heading, HStack, Spinner } from "native-base";

export function Loading({ visible = true }: { visible?: boolean }) {
  return (
    <HStack
      space={2}
      justifyContent="center"
      style={{ opacity: visible ? 1 : 0 }}
    >
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
