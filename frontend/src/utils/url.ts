export function normalizeURL(url: string) {
  return url.replace(/\/\/+/g, "/");
}

export function joinURL(...args: string[]) {
  return normalizeURL(args.join("/"));
}

export function urlUp1Level(url: string) {
  const upUrl =
    normalizeURL(url)
      .replace(/\/$/, "")
      .split("/")
      .slice(undefined, -1)
      .join("/") + "/";
  if (upUrl === "/") return "";
  return upUrl;
}

export function urlFileExtension(url: string): string | undefined {
  return /[.]([^/.]+)$/.exec(url)?.[1]?.toLowerCase();
}

export function urlFileName(url: string): string | undefined {
  return /[/]?([^/]+)$/.exec(url)?.[1];
}
