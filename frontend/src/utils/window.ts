export function getWindow() {
  try {
    if (typeof window !== undefined) {
      return window;
    }
  } catch (_err) {
    return undefined;
  }
}

export function getDocument() {
  try {
    if (typeof document !== undefined) {
      return document;
    }
  } catch (_err) {
    return undefined;
  }
}
