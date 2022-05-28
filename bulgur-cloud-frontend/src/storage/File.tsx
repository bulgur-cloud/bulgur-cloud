import React from "react";
import { Center, Text, Image, VStack, Heading, Box, Button } from "native-base";
import { runAsync, STORAGE, usePathExists, usePathToken } from "../client";
import { Loading } from "../Loading";
import { Platform } from "react-native";
import { joinURL, urlFileExtension, urlFileName } from "../fetch";
import * as FileSystem from "expo-file-system";
import { DashboardParams } from "../routes";
import useSWR from "swr";
import { NotFound } from "../NotFound";
import { useAppSelector } from "../store";

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
      return ["mp4", "ogv", "m4a", "webm", "mkv", "flv"];
    case "ios":
      return ["mp4", "m4v", "mov"];
    default:
      return [];
  }
}

function supportedAudioExtensions() {
  switch (Platform.OS) {
    case "web":
      return ["wav", "mp3", "opus", "ogg", "flac"];
    case "android":
      return [];
    case "ios":
      return [];
    default:
      return [];
  }
}

export const VIDEO_EXTENSIONS: ReadonlySet<string> = new Set(
  supportedVideoExtensions(),
);

export const AUDIO_EXTENSIONS: ReadonlySet<string> = new Set(
  supportedAudioExtensions(),
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
  const { fullPath } = opts;

  return (
    <Image
      resizeMethod="scale"
      resizeMode="contain"
      src={fullPath}
      size={600}
    />
  );
}
export function VideoPreview(opts: FilePreviewOpts) {
  const { fullPath } = opts;

  console.log(fullPath);

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
export function AudioPreview(opts: FilePreviewOpts) {
  const { fullPath } = opts;

  console.log(fullPath);

  if (Platform.OS === "web") {
    return (
      <audio
        controls
        muted={false}
        preload="metadata"
        src={fullPath}
        style={{ width: "100%", height: "auto" }}
      >
        <NoPreview />
      </audio>
    );
  }

  return <NoPreview />;
}

export function Preview(opts: FilePreviewOpts) {
  if (IMAGE_EXTENSIONS.has(opts.extension)) {
    return <ImagePreview {...opts} />;
  }

  if (AUDIO_EXTENSIONS.has(opts.extension)) {
    return <AudioPreview {...opts} />;
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

export function File(params: DashboardParams) {
  const { path, store } = params.route.params;
  const filename = urlFileName(path);
  const site = useAppSelector((selector) => selector.auth.site);

  const pathExists = usePathExists(joinURL(STORAGE, store, path));
  const pathToken = usePathToken(joinURL(STORAGE, store, path)).data?.data
    .token;

  if (pathToken === undefined) {
    return <Loading />;
  }

  if (!pathExists) {
    return <NotFound />;
  }

  if (pathToken === null || !site || !filename) {
    return (
      <Center>
        <Text>Unable to load file.</Text>
      </Center>
    );
  }

  const fullPath =
    site +
    "/" +
    encodeURI(joinURL(STORAGE, store, path) + `?token=${pathToken}`);
  console.log(fullPath);
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
