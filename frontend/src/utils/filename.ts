/* eslint-disable no-control-regex */

/** File and folder names that are not allowed in Windows or Linux. */
const BAD_CHARACTERS = /[/\\<>:"|?*\x00-\x1F]/;
/** File and folder names disallowed (primarily Windows), with or without an extension. */
const BAD_NAMES = /^CON|PRN|AUX|NUL|COM\d|LPT\d([.][^.]*)?$/;
/** Windows adds these extra rules as to what the filename can end with. */
const BAD_END = /[ .]$/;

enum UnsafeFilename {
  BadCharacter = "BadCharacter",
  BadName = "BadName",
  BadEnd = "BadEnd",
}

export function isSafeFilename(
  name: string,
): [UnsafeFilename, string] | undefined {
  const { index } = BAD_CHARACTERS.exec(name) ?? {};
  if (index !== undefined) {
    return [UnsafeFilename.BadCharacter, name[index]];
  }

  const [badName] = BAD_NAMES.exec(name) ?? [];
  if (badName) {
    return [UnsafeFilename.BadName, badName];
  }

  if (BAD_END.test(name)) {
    return [UnsafeFilename.BadEnd, name[name.length - 1]];
  }
}

export function describeUnsafeFilename([reason, str]: [UnsafeFilename, string]) {
  switch (reason) {
  case UnsafeFilename.BadCharacter:
    if (/[\x00-\x1F]/.test(str)) {
      return "The name can't contain invisible control characters";
    } else {
      return `The name can't contain the character ${str}`;
    }
  case UnsafeFilename.BadName:
    return `The name can't be ${str}`;
  case UnsafeFilename.BadEnd:
    if (str === " ") {
      return "The name can't end with a space";
    } else if (str === ".") {
      return "The name can't end with a dot";
    } else {
      return `The name can't end with ${str}`;
    }
  }
}
