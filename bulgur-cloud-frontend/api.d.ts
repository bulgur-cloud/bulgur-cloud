// Auto-generated from backend types, do not edit by hand
export default api;
export namespace api{
export type Token=string;
export type U64=number;
export type LoginResponse={"token":api.Token;"valid_for_seconds":api.U64;};
export type FolderEntry={"is_file":boolean;"name":string;"size":api.U64;};
export type FolderResults={"entries":(api.FolderEntry)[];};
export type PathTokenResponse={"token":api.Token;};
}
