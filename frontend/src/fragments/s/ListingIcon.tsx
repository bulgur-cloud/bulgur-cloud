import api from "@/hooks/api";
import { urlFileExtension } from "@/utils/url";
import {
  IconBook,
  IconFile,
  IconFileCode,
  IconFileText,
  IconFolder,
  IconMovie,
  IconMusic,
  IconPhoto,
} from "@tabler/icons-react";

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
  "avif",
]);
export const VIDEO_EXTENSIONS: ReadonlySet<string> = new Set([
  "mp4",
  "webm",
  "ogv",
  "mkv",
  "avi",
  "wmv",
]);
export const AUDIO_EXTENSIONS: ReadonlySet<string> = new Set([
  "mp3",
  "wav",
  "flac",
  "opus",
  "ogg",
]);
export const BOOK_EXTENSIONS: ReadonlySet<string> = new Set([
  "pdf",
  "epub",
  "mobi",
]);
export const TEXT_EXTENSIONS: ReadonlySet<string> = new Set(["txt", "md"]);
export const CODE_EXTENSIONS: ReadonlySet<string> = new Set([
  "js",
  "jsx",
  "ts",
  "tsx",
  "py",
  "rs",
  "go",
  "c",
  "cpp",
  "cxx",
  "h",
  "hpp",
  "hxx",
  "java",
  "sh",
  "bash",
  "zsh",
  "fish",
  "cmd",
  "html",
  "css",
  "scss",
  "sass",
  "less",
  "json",
  "yaml",
  "yml",
  "toml",
  "xml",
  "csv",
  "json",
  "hs",
  "lua",
  "rb",
  "php",
]);

export default function ListingIcon({
  entry,
  className,
}: {
  entry: api.FolderEntry;
  className?: string;
}) {
  const { name, is_file: isFile } = entry;
  if (!isFile) {
    return <IconFolder className={className} />;
  }
  const extension = urlFileExtension(name);
  if (!extension) {
    return <IconFile className={className} />;
  }
  if (IMAGE_EXTENSIONS.has(extension)) {
    return <IconPhoto className={className} />;
  }
  if (VIDEO_EXTENSIONS.has(extension)) {
    return <IconMovie className={className} />;
  }
  if (AUDIO_EXTENSIONS.has(extension)) {
    return <IconMusic className={className} />;
  }
  if (CODE_EXTENSIONS.has(extension)) {
    return <IconFileCode className={className} />;
  }
  if (TEXT_EXTENSIONS.has(extension)) {
    return <IconFileText className={className} />;
  }
  if (BOOK_EXTENSIONS.has(extension)) {
    return <IconBook className={className} />;
  }
  return <IconFile className={className} />;
}
