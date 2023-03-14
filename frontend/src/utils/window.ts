export function getWindow() {
  try {
    if (typeof window !== undefined) {
      return window;
    }
  } catch (_err) {
    return undefined;
  }
}
