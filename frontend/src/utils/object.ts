export function pick<T, K extends keyof T>(obj: T, ...keys: K[]): Pick<T, K> {
  const pairs = keys.map((key): [K, T[K]] => [key, obj[key]]);
  const newObj = Object.fromEntries(pairs);
  return newObj as any;
}

/** A shallow equality comparison for objects.
 *
 * Checks that immediate children of the objects are equal.
 */
export function shallowEquals<
  Left extends Record<string, unknown>,
  Right extends Record<string, unknown>,
>(left: Left | undefined, right: Right | undefined) {
  // handle undefined as a special case
  if (left === undefined && right === undefined) return true;
  if (left === undefined || right === undefined) return false;

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

/** A deep equality comparison for objects.
 *
 * Will recursively check all children of the objects.
 */
export function deepEquals<
  Left extends Record<string, unknown>,
  Right extends Record<string, unknown>,
>(left: Left, right: Right) {
  // If they have a different number of keys, they can't be equal
  if (Object.keys(left).length !== Object.keys(right).length) return false;
  // If right doesn't contain all the same key-value pairs left does, they can't
  // be equal
  for (const key of Object.keys(left)) {
    // Recursive check for nested objects
    if (typeof left[key] === "object" && typeof right[key] === "object") {
      // TODO This is a potential source of issues, this should be cleaned up!
      if (!deepEquals(left[key] as any, right[key] as any)) {
        return false;
      }
    } else if (left[key] !== right[key]) {
      // Other types can be directly compared
      return false;
    }
  }
  // We know already that right contains all the keys-value pairs that the left
  // does. We also know that they have the same number of keys. Then, there
  // can't be any key-value pairs in right that left doesn't have. We're
  // guaranteed that they are equal.
  return true;
}
