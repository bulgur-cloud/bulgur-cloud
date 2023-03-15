import { useSWRConfig } from "swr";
import api from "./api";
import { BError } from "../utils/error";
import { isBoolean, isString } from "../utils/type";
import FormData from "form-data";
import { urlUp1Level } from "../utils/url";
import { isOkResponse } from "./base";
import { RequestParams, useFetch, useRequest } from "./request";
import { storageSlice, useAppDispatch, useAppSelector } from "../utils/store";
import { LiveLimit } from "live-limit";
import { pick, shallowEquals } from "../utils/object";

export function usePathMeta(url: string) {
  const out = useFetch<never, api.FileMeta>({
    method: "META" as any, // Hey, this is a perfectly valid HTTP method!
    url: `storage/${url}`,
  });
  if (out.isLoading) {
    return {
      isLoading: true,
    };
  }

  if (out.data === undefined) {
    return {
      isLoading: false,
      data: undefined,
    };
  }

  const status = out.data?.status;
  const exists = !!(status && isOkResponse(status));

  return {
    isLoading: false,
    data: {
      exists,
      ...out.data.data,
    },
  };
}

export function usePathToken(url: string) {
  return useFetch<api.StorageAction, api.PathTokenResponse>({
    method: "POST",
    url: `storage/${url}`,
    data: {
      action: "MakePathToken",
    },
  });
}

function useMutateFolder() {
  const { mutate } = useSWRConfig();
  const { access_token, site } = useAppSelector(
    (state) => pick(state.auth, "access_token", "site"),
    shallowEquals,
  );

  function doMutateFolder(url: string) {
    const mutateParams: RequestParams<never> & {
      access_token?: string;
      site?: string;
    } = {
      method: "GET",
      url: `storage/${url}`,
      access_token,
      site,
    };
    mutate(mutateParams);
  }

  function doMutateContainingFolder(url: string) {
    console.log(urlUp1Level(url));
    doMutateFolder(urlUp1Level(url));
  }

  return { doMutateFolder, doMutateContainingFolder };
}

export function useCreateFolder() {
  const { doRequest } = useRequest<api.StorageAction, never>();
  const { doMutateContainingFolder } = useMutateFolder();

  async function doCreateFolder(url: string) {
    await doRequest({
      url: `storage/${url}`,
      method: "POST",
      data: {
        action: "CreateFolder",
      },
    });
    console.log(url);
    doMutateContainingFolder(url);
  }

  return { doCreateFolder };
}

export function useDelete() {
  const { doRequest } = useRequest<never, never>();
  const { doMutateContainingFolder } = useMutateFolder();

  async function doDelete(url: string) {
    await doRequest({
      url: `storage/${url}`,
      method: "DELETE",
    });
    doMutateContainingFolder(url);
  }

  return { doDelete };
}

function isFolderEntry(data: any): data is api.FolderEntry {
  return (
    isBoolean(data?.is_file) &&
    isString(data?.name) &&
    Number.isInteger(data?.size)
  );
}

function isFolderResults(data: any): data is api.FolderResults {
  const entries = data?.entries;
  if (!Array.isArray(entries)) return false;
  return entries.every(isFolderEntry);
}

export function useFolderListing(url: string) {
  const resp = useFetch<never, api.FolderResults>({
    url: `storage/${url}`,
    method: "GET",
  });

  if (resp.data?.status === 401) {
    return new BError({
      code: "load_folder_unauthorized",
      title: "Unauthorized",
      description: "You are not authorized to view this folder",
    });
  }

  if (resp.data?.status === 404) {
    return new BError({
      code: "not_found",
      title: "Not found",
      description: "This folder does not exist.",
    });
  }

  if (resp.data?.data && !isFolderResults(resp.data.data)) {
    return new BError({
      code: "load_folder_failed",
      title: "Failed to load folder",
      description: `Unable to load ${url}`,
    });
  }

  if (resp.data?.data.entries) {
    // Keep the folder sorted by name, with folders put first
    resp.data.data.entries = resp.data?.data.entries.sort((a, b) => {
      if (!a.is_file && b.is_file) return -1;
      if (!b.is_file && a.is_file) return 1;
      // TODO: The performance of this can be improved: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/localeCompare#performance
      return a.name.localeCompare(b.name);
    });
  }

  return resp;
}

export function useRename() {
  const { doRequest } = useRequest<api.StorageAction, never>();
  const { doMutateContainingFolder } = useMutateFolder();

  async function doRename(from: string, to: string) {
    await doRequest({
      method: "POST",
      url: `storage/${from}`,
      data: {
        action: "Move",
        new_path: to,
      },
    });

    doMutateContainingFolder(from);
    doMutateContainingFolder(to);
  }

  return { doRename };
}

/** Do this many uploads concurrently at maximum. */
const CONCURRENT_UPLOADS = 2;
const UPLOAD_LIMIT = new LiveLimit({ maxLive: CONCURRENT_UPLOADS });

export function useUpload() {
  const { doRequest } = useRequest<FormData, never>();
  const dispatch = useAppDispatch();
  const { doMutateFolder } = useMutateFolder();

  async function doUpload(url: string, files: File[]) {
    files.map((file) => {
      // Mark up all the uploads immediately
      dispatch(
        storageSlice.actions.uploadProgress({
          name: file.name,
          done: 0,
          total: file.size,
        }),
      );
    });

    // The uploads that are in progress right now.
    await Promise.all(
      files.map(async (file) => {
        await UPLOAD_LIMIT.limit(async () => {
          // Perform the request to upload this file
          const name = file.name;
          const form = new FormData();
          form.append(name, file);
          await doRequest(
            {
              method: "PUT",
              url: `storage/${url}`,
              data: form,
            },
            ({ total, done }) => {
              dispatch(
                storageSlice.actions.uploadProgress({
                  name,
                  done,
                  total,
                }),
              );
              if (total === done) {
                doMutateFolder(url);
              }
            },
          );
        });
      }),
    );

    files.map((file) => {
      // Make sure it's removed from the upload progress once the request is done
      dispatch(
        storageSlice.actions.uploadProgress({
          name: file.name,
          done: 0,
          total: 0,
        }),
      );
    });
    doMutateFolder(url);
  }

  return { doUpload };
}

/** Gets a publicly accessable download URL for a path. */
export function useDownloadUrl(path: string) {
  const site = useAppSelector((state) => state.auth.site);
  const resp = usePathToken(path);

  if (site === undefined || resp.data === undefined) {
    return { isLoading: true };
  }

  return {
    isLoading: false,
    url: `${site}/storage/${path}?token=${resp.data.data.token}`,
  };
}

/** Get the full contents of the file at this path.
 *
 * Be careful to not call this for files that are too large!
 */
export function useFileContents(path: string) {
  const resp = useFetch<never, string>({
    method: "GET",
    url: `storage/${path}`,
  });

  let contents: string | undefined;
  if (resp.data?.data) {
    contents = resp.data.data;
  }

  return {
    contents,
    isLoading: resp.isLoading,
  };
}
