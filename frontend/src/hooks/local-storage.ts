import { useCallback, useEffect, useMemo, useState } from "react";

/** A wrapper around useState that stores the value in localStorage to survive page refreshes. */
export function useLocalStorageState(
  key: string,
  initialState: string | null = null,
) {
  const [cachedValue, setCachedValue] = useState<string | null>(initialState);

  const storageKey = useMemo(() => `bulgur-ls-${key}`, [key]);

  useEffect(() => {
    // Set initial value
    setCachedValue(localStorage.getItem(storageKey));
    // Listen for changes
    const cb = (event: StorageEvent) => {
      if (event.storageArea === localStorage && event.key === storageKey) {
        setCachedValue(event.newValue);
      }
    };
    window.addEventListener("storage", cb);
    // Cleanup
    return () => {
      window.removeEventListener("storage", cb);
    };
  }, [storageKey]);

  const setValue = useCallback(
    (value: string | null) => {
      setCachedValue(value);
      if (value === null) {
        localStorage.removeItem(storageKey);
      } else {
        localStorage.setItem(storageKey, value);
      }
    },
    [storageKey],
  );

  return [cachedValue, setValue] as const;
}
