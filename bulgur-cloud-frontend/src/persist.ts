import { Platform } from "react-native";
import RNSInfo from "react-native-sensitive-info";

/** Cross-platform web/native persistent storage. Intended for sensitive data. */
export class Persist {
  private static STORAGE_PROPS = {
    sharedPreferencesName: "Bulgur Cloud",
    keychainService: "Bulgur Cloud",
  };

  public static async get<T>(key: string): Promise<T | null> {
    let out: string | undefined | null;
    if (Platform.OS === "web") {
      out = window.localStorage.getItem(key);
    } else {
      try {
        out = await RNSInfo.getItem(key, Persist.STORAGE_PROPS);
      } catch {
        console.log(`Unable to read key ${key} from the store`);
      }
    }
    if (!out) return null;
    return JSON.parse(out) as T;
  }

  public static async set<T>(key: string, value: T) {
    const data = JSON.stringify(value);
    if (Platform.OS === "web") {
      window.localStorage.setItem(key, data);
    } else {
      await RNSInfo.setItem(key, data, Persist.STORAGE_PROPS);
    }
  }

  public static async delete(key: string) {
    if (Platform.OS === "web") {
      window.localStorage.removeItem(key);
    } else {
      await RNSInfo.deleteItem(key, Persist.STORAGE_PROPS);
    }
  }
}
