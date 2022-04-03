import { Box } from "native-base";
import React from "react";

export function FillSpacer(props: Parameters<typeof Box>[0]) {
  return <Box {...props} flexGrow={1} />;
}
