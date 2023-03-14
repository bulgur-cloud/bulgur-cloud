export function humanSize(sizeBytes: number) {
  if (sizeBytes < 1024) {
    return `${sizeBytes} B`;
  }
  if (sizeBytes < 1024 * 1024) {
    return `${(sizeBytes / 1024).toFixed(2)} KB`;
  }
  if (sizeBytes < 1024 * 1024 * 1024) {
    return `${(sizeBytes / 1024 / 1024).toFixed(2)} MB`;
  }
  if (sizeBytes < 1024 * 1024 * 1024 * 1024) {
    return `${(sizeBytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
  }
  return `${(sizeBytes / 1024 / 1024 / 1024 / 1024).toFixed(2)} TB`;
}
