export function pick<T, K extends keyof T>(obj: T, ...keys: K[]): Pick<T, K> {
  const pairs = keys.map((key): [K, T[K]] => [key, obj[key]]);
  const newObj = Object.fromEntries(pairs);
  return newObj as any;
}

/** A shallow equality comparison for objects. */
export function shallowEquals<Left extends Record<string, unknown>, Right extends Record<string, unknown>>(left: Left, right: Right) {
  // If they have a different number of keys, they can't be equal
  if (Object.keys(left).length !== Object.keys(right).length) return false;
  // If right doesn't contain all the same key-value pairs left does, they can't
  // be equal
  for (const key of Object.keys(left)) {
    if (left[key] !== right[key]) return false;
  }
  // We know already that right contains all the keys-value pairs that the left
  // does. We also know that they have the same number of keys. Then, there
  // can't be any key-value pairs in right that left doesn't have. We're
  // guaranteed that they are equal.
  return true;
}