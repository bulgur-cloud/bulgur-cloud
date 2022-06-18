import { useBanner } from "../client/meta";
import { Center, VStack, Text, Box } from "native-base";

export function Banner({ bannerKey }: { bannerKey: string }) {
  const bannerText = useBanner(bannerKey);

  if (bannerText === undefined) {
    return null;
  }

  return (
    <Center>
      <Box
        maxWidth={"sm"}
        borderBottomRadius={12}
        padding={4}
        backgroundColor={"primary.100"}
      >
        <Text>{bannerText}</Text>
      </Box>
    </Center>
  );
}
