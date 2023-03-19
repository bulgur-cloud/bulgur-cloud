/* eslint-disable @next/next/no-img-element */
import { FullPageSpinner, Spinner } from "@/components/Spinner";
import { useDownloadUrl, useFileContents, usePathMeta } from "@/hooks/storage";
import { humanSize } from "@/utils/human";
import { urlFileExtension } from "@/utils/url";
import Link from "next/link";
import { useCurrentPath } from "./CurrentPathProvider";
import { CODE_EXTENSIONS, TEXT_EXTENSIONS } from "./ListingIcon";
import { FileNotFound } from "./NotFound";

const PREVIEWABLE_IMAGE_FORMATS: ReadonlySet<string> = new Set([
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "svg",
]);
const PREVIEWABLE_TEXT_FORMATS: ReadonlySet<string> = new Set([
  ...TEXT_EXTENSIONS.keys(),
  ...CODE_EXTENSIONS.keys(),
]);
const PREVIEWABLE_AUDIO_FORMATS: ReadonlySet<string> = new Set([
  "mp3",
  "wav",
  "opus",
  "ogg",
  "aac",
  "flac",
]);
const PREVIEWABLE_VIDEO_FORMATS: ReadonlySet<string> = new Set(["mp4", "webm"]);

function ImagePreview() {
  const { fullPath } = useCurrentPath();
  const downloadUrl = useDownloadUrl(fullPath);

  if (downloadUrl.isLoading) {
    return <Spinner />;
  }

  return <img className="object-contain w-full" src={downloadUrl.url} alt="" />;
}

function AudioPreview() {
  const { fullPath } = useCurrentPath();
  const downloadUrl = useDownloadUrl(fullPath);

  if (downloadUrl.isLoading) {
    return <Spinner />;
  }

  return <audio controls className="w-full" src={downloadUrl.url} />;
}

function VideoPreview() {
  const { fullPath } = useCurrentPath();
  const downloadUrl = useDownloadUrl(fullPath);

  if (downloadUrl.isLoading) {
    return <Spinner />;
  }

  return (
    <video controls className="object-contain w-full" src={downloadUrl.url} />
  );
}

function TextPreview() {
  const { fullPath } = useCurrentPath();
  const { contents } = useFileContents(fullPath);

  if (contents === undefined) {
    return <Spinner />;
  }

  return (
    <pre
      className="p-4 lg:p-8 bg-base-200 overflow-auto rounded-box"
      style={{ height: "36rem" }}
    >
      {contents}
    </pre>
  );
}

function PreviewSelector() {
  const { name, fullPath } = useCurrentPath();
  const resp = usePathMeta(fullPath);
  const extension = urlFileExtension(name);

  if (resp.data === undefined) {
    return <Spinner />;
  }

  if (extension && PREVIEWABLE_AUDIO_FORMATS.has(extension)) {
    return <AudioPreview />;
  }

  if (extension && PREVIEWABLE_VIDEO_FORMATS.has(extension)) {
    return <VideoPreview />;
  }

  // TODO: This should be configurable per user, up to some server max
  if (resp.data.size > 20 * 1024 * 1024) {
    return <span>File is too large to preview.</span>;
  }

  if (extension && PREVIEWABLE_IMAGE_FORMATS.has(extension)) {
    return <ImagePreview />;
  }

  if (extension && PREVIEWABLE_TEXT_FORMATS.has(extension)) {
    return <TextPreview />;
  }

  return <span>This file type can&#39;t be previewed.</span>;
}

export function FilePreview() {
  const { fullPath, name } = useCurrentPath();
  const resp = usePathMeta(fullPath);
  const downloadUrl = useDownloadUrl(fullPath);

  if (resp.data === undefined || downloadUrl.url === undefined) {
    return <FullPageSpinner />;
  }
  const { exists, size } = resp.data;

  if (!exists) {
    return <FileNotFound />;
  }

  return (
    <div>
      <h1 className="text-2xl mb-4">{name}</h1>
      <div>
        <PreviewSelector />
      </div>
      <div className="stat pl-0 pr-4">
        <div className="stat-title">Size</div>
        <div className="stat-value">{humanSize(size)}</div>
        <div className="stat-desc">{size} bytes</div>
      </div>
      <Link className="btn btn-primary my-4" href={downloadUrl.url}>
        Download
      </Link>
    </div>
  );
}
