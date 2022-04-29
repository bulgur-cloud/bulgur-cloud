import React, { useEffect, useState } from "react";
import {
  Center,
  Text,
  Image,
  Link,
  VStack,
  Heading,
  Box,
  Button,
} from "native-base";
import { useAppSelector } from "../store";
import { runAsync, useClient } from "../client";
import { Loading } from "../Loading";
import { Platform } from "react-native";
import { joinURL, urlFileExtension, urlFileName } from "../fetch";
import * as FileSystem from "expo-file-system";

export const IMAGE_EXTENSIONS: ReadonlySet<string> = new Set([
  "png",
  "jpg",
  "jpeg",
  "svg",
  "gif",
  "webp",
  "bmp",
  "ico",
  "tiff",
]);
export const PDF_EXTENSIONS: ReadonlySet<string> = new Set(["pdf"]);

function supportedVideoExtensions() {
  switch (Platform.OS) {
    case "web":
      return ["mp4", "webm"];
    case "android":
      return ["mp4", "ogg", "ogv", "m4a", "webm", "mkv", "flv"];
    case "ios":
      return ["mp4", "m4v", "mov"];
    default:
      return [];
  }
}

export const VIDEO_EXTENSIONS: ReadonlySet<string> = new Set(
  supportedVideoExtensions(),
);

type FilePreviewOpts = {
  filename: string;
  fullPath: string;
  extension: string;
};

function NoPreview() {
  return (
    <Text>
      We can&apos;t preview this file, but you can click below to download it.
    </Text>
  );
}

export function ImagePreview(opts: FilePreviewOpts) {
  const { fullPath, filename } = opts;

  return <Image src={fullPath} alt={`Image file ${filename}`} size={600} />;
}
export function PDFPreview(opts: FilePreviewOpts) {
  if (Platform.OS === "web") {
    return (
      <object
        width={600}
        height={800}
        title={`PDF preview for ${opts.filename}`}
        data={opts.fullPath}
        type="application/pdf"
      />
    );
  }

  return <NoPreview />;
}
export function VideoPreview(opts: FilePreviewOpts) {
  const { fullPath } = opts;

  if (Platform.OS === "web") {
    return (
      <video
        controls
        muted={false}
        preload="metadata"
        src={fullPath}
        style={{ width: "100%", height: "auto" }}
      />
    );
  }

  return <NoPreview />;
}

export function Preview(opts: FilePreviewOpts) {
  if (IMAGE_EXTENSIONS.has(opts.extension)) {
    return <ImagePreview {...opts} />;
  }

  if (PDF_EXTENSIONS.has(opts.extension)) {
    return <PDFPreview {...opts} />;
  }

  if (VIDEO_EXTENSIONS.has(opts.extension)) {
    return <VideoPreview {...opts} />;
  }

  return <NoPreview />;
}

function DownloadButton({
  filename,
  downloadUrl,
}: {
  filename: string;
  downloadUrl: string;
}) {
  if (Platform.OS === "web") {
    return (
      <a
        style={{ maxWidth: 120, textAlign: "center" }}
        download={filename}
        href={downloadUrl}
      >
        <Box
          px="3"
          py="2"
          bg="primary.800"
          rounded="sm"
          _text={{
            color: "lightText",
            fontWeight: "medium",
          }}
        >
          Download
        </Box>
      </a>
    );
  } else {
    return (
      <Button
        onPress={() => {
          runAsync(async () => {
            // TODO see `createDownloadResumable` for a progress bar later
            await FileSystem.downloadAsync(
              downloadUrl,
              FileSystem.documentDirectory + filename,
            );
          });
        }}
        bgColor={"primary.800"}
      >
        <Text color={"lightText"} fontWeight={"medium"}>
          Download
        </Text>
      </Button>
    );
  }
}

export function File() {
  const currentPath = useAppSelector((state) => state.storage.currentPath);
  const filename = urlFileName(currentPath);

  const api = useClient();
  const [pathToken, setPathToken] = useState<undefined | null | string>();

  useEffect(() => {
    if (pathToken === undefined) {
      runAsync(async () => {
        const token = await api.pathToken.run("/" + currentPath);
        setPathToken(token);
      });
    }
  }, [pathToken, currentPath]);

  if (pathToken === undefined) {
    return <Loading />;
  }

  if (pathToken === null || api.site === undefined || !filename) {
    return (
      <Center>
        <Text>Unable to load file.</Text>
      </Center>
    );
  }

  const fullPath =
    api.site + joinURL("/storage", currentPath) + `?token=${pathToken}`;
  const extension = urlFileExtension(filename) || "";

  return (
    <Center>
      <VStack space={4}>
        <Heading>{filename}</Heading>
        <Preview
          extension={extension}
          filename={filename}
          fullPath={fullPath}
        />
        <DownloadButton filename={filename} downloadUrl={fullPath} />
      </VStack>
    </Center>
  );
}
