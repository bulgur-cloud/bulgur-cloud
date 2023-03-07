/* eslint-disable @next/next/no-img-element */
import { FullPageSpinner, Spinner } from "@/components/Spinner";
import { useDownloadUrl, usePathMeta, usePathToken } from "@/hooks/storage";
import { humanSize } from "@/utils/human";
import { useAppSelector } from "@/utils/store";
import { urlFileExtension } from "@/utils/url";
import Link from "next/link";
import { useCurrentPath } from "./CurrentPathProvider";
import { FileNotFound } from "./NotFound";

const PREVIEWABLE_IMAGE_FORMATS: ReadonlySet<string> = new Set([
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "svg",
]);

function ImagePreview() {
  const { fullPath } = useCurrentPath();
  const downloadUrl = useDownloadUrl(fullPath);

  if (downloadUrl.isLoading) {
    return <Spinner />;
  }

  return <img className="object-contain w-full" src={downloadUrl.url} alt="" />;
}

function PreviewSelector() {
  const { name } = useCurrentPath();
  const extension = urlFileExtension(name);

  if (extension && PREVIEWABLE_IMAGE_FORMATS.has(extension)) {
    return <ImagePreview />;
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
