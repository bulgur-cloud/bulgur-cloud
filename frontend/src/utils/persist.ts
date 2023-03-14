import { getWindow } from "./window";

/** Cross-platform web/native persistent storage. Intended for sensitive data. */
export class Persist {
  public static async get<T>(key: string): Promise<T | null> {
    const out: string | undefined | null =
      getWindow()?.localStorage.getItem(key);
    if (!out) return null;
    return JSON.parse(out) as T;
  }

  public static async set<T>(key: string, value: T) {
    const data = JSON.stringify(value);
    getWindow()?.localStorage.setItem(key, data);
  }

  public static async delete(key: string) {
    getWindow()?.localStorage.removeItem(key);
  }
}
