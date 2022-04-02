/* eslint-disable @typescript-eslint/no-explicit-any */

export function isString(s: any): s is string {
  return typeof s === "string";
}

export function isBoolean(s: any): s is boolean {
  return s === true || s === false;
}
