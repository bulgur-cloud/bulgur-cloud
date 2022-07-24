// Auto-generated from backend types, do not edit by hand
export default api;
export namespace api{
export type Password=string;
export type Login={"username":string;"password":api.Password;};
export type Token=string;
export type U64=number;
export type LoginResponse={"token":api.Token;"valid_for_seconds":api.U64;};
export type FolderEntry={"is_file":boolean;"name":string;"size":api.U64;};
export type FolderResults={"entries":(api.FolderEntry)[];};
export type PathTokenResponse={"token":api.Token;};
export type StorageAction=({"action":"MakePathToken";}|({"action":"Move";}&{"new_path":string;})|{"action":"CreateFolder";});
export type PutStoragePayload={"files_written":(string)[];};
}
