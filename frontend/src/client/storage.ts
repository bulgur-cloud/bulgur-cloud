import { useSWRConfig } from "swr";
import api from "../client/api";
import { BError } from "../utils/error";
import { isBoolean, isString } from "../utils/type";
import FormData from "form-data";
import { joinURL, urlUp1Level } from "../utils/url";
import { isOkResponse, STORAGE } from "./base";
import { RequestParams, useFetch, useRequest } from "./request";
import { storageSlice, useAppDispatch, useAppSelector } from "../utils/store";
import { LiveLimit } from "live-limit";
import { pick, shallowEquals } from "../utils/object";

export function usePathExists(url: string) {
  const out = useFetch({
    method: "HEAD",
    url,
  });
  const status = out.data?.status;

  return {
    ...out,
    data: !!(status && isOkResponse(status)),
  };
}

export function usePathToken(url: string) {
  return useFetch<api.StorageAction, api.PathTokenResponse>({
    method: "POST",
    url,
    data: {
      action: "MakePathToken",
    },
  });
}

function useMutateFolder() {
  const { mutate } = useSWRConfig();
  const { access_token, site } = useAppSelector(
    (selector) => pick(selector.auth, "access_token", "site"),
    shallowEquals,
  );

  function doMutateFolder(url: string) {
    const mutateParams: RequestParams<never> & {
      access_token?: string;
      site?: string;
    } = {
      method: "GET",
      url,
      access_token,
      site,
    };
    mutate(mutateParams);
  }

  function doMutateContainingFolder(url: string) {
    doMutateFolder(urlUp1Level(url));
  }

  return { doMutateFolder, doMutateContainingFolder };
}

export function useCreateFolder() {
  const { doRequest } = useRequest<api.StorageAction, never>();
  const { doMutateContainingFolder } = useMutateFolder();

  async function doCreateFolder(url: string) {
    await doRequest({
      url,
      method: "POST",
      data: {
        action: "CreateFolder",
      },
    });
    doMutateContainingFolder(url);
  }

  return { doCreateFolder };
}

export function useDelete() {
  const { doRequest } = useRequest<never, never>();
  const { doMutateContainingFolder } = useMutateFolder();

  async function doDelete(url: string) {
    await doRequest({
      url,
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
    // Normalize the path, it should be in the form of storage/foo/bar/
    url: url.replace(/[/]+$/, "") + "/",
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
      url: from,
      data: {
        action: "Move",
        new_path: to,
      },
    });

    doMutateContainingFolder(from);
    const toPath = joinURL(STORAGE, to);
    doMutateContainingFolder(toPath);
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
              url,
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
