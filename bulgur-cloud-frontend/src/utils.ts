export function pick<T, K extends keyof T>(obj: T, ...keys: K[]): Pick<T, K> {
  const pairs = keys.map((key): [K, T[K]] => [key, obj[key]]);
  const newObj = Object.fromEntries(pairs);
  return newObj as any;
}
