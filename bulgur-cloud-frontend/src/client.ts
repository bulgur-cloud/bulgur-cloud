/* eslint-disable @typescript-eslint/no-explicit-any */
import { api } from "./api";
import {
  authSlice,
  AuthState,
  errorSlice,
  storageSlice,
  store,
  useAppDispatch,
  useAppSelector,
} from "./store";
import { useEffect } from "react";
import { Persist } from "./persist";
import { isBoolean, isString } from "./typeUtils";
import { Fetch, joinURL } from "./fetch";

export function runAsync(
  fn: () => Promise<void>,
  onError?: (error: unknown) => Promise<void>,
) {
  fn().catch((error) => {
    console.error(error);
    store.dispatch(errorSlice.actions.addError(
      {
        key: `${new Date().getTime()}`,
        error
      }
    ));
    if (onError) onError(error);
  });
}

const STORAGE = "/storage";

const PERSIST_AUTH_KEY = "bulgur-cloud-auth";

function isAuthState(data: any): data is Required<Omit<AuthState, "state">> {
  return (
    isString(data?.username) &&
    isString(data?.password) &&
    isString(data?.token)
  );
}

function isLoginResponse(data: any): data is api.LoginResponse {
  return isString(data?.token) && Number.isInteger(data?.valid_for_seconds);
}

function isPathTokenResponse(data: any): data is api.PathTokenResponse {
  return isString(data?.token);
}

function isFolderEntry(data: any): data is api.FolderEntry {
  return isBoolean(data?.is_file) && isString(data?.name) && Number.isInteger(data?.size);
}

function isFolderResults(data: any): data is api.FolderResults {
  const entries = data?.entries;
  if (!Array.isArray(entries)) return false;
  return entries.every(isFolderEntry);
}

/** Allows interacting with the API, and accessing API state like the username. */
export function useClient() {
  const { state, username, token, site } = useAppSelector(
    (state) => state.auth,
  );
  const currentPath = useAppSelector((state) => state.storage.currentPath);
  const dispatch = useAppDispatch();

  async function isTokenValid(token: string, site: string) {
    const response = await Fetch.head({ url: "/api/stats", site, authToken: token });
    return response?.response.ok;
  }
  async function login({
    username,
    password,
    site,
  }: {
    username: string;
      password: string;
      site: string;
  }) {
    const out = await (await Fetch.post({
      url: "/auth/login",
      site,
      data: { username, password },
    }))?.json();
    if (!isLoginResponse(out)) return;
    
    const { token } = out;
    await Persist.set(PERSIST_AUTH_KEY, { username, password, token, site });
    dispatch(authSlice.actions.login({ username, password, token, site }));
  }
  async function logout() {
    await Persist.delete(PERSIST_AUTH_KEY);
    dispatch(authSlice.actions.logout());
  }
  async function loadFolder(path: string) {
    const out = await (await Fetch.get({
      url: joinURL(STORAGE, path),
      authToken: token,
      site,
    }))?.json();
    if (!isFolderResults(out)) return;
    dispatch(
      storageSlice.actions.loadFolder({
        currentPath: path,
        ...out,
      }),
    );
  }
  async function peekFolder(path: string) {
    const out = await (await Fetch.get({
      url: joinURL(STORAGE, path),
      authToken: token,
      site,
    }))?.json();
    if (!isFolderResults(out)) return;
    return out;
  }
  async function getPathToken(path: string) {
    const data: api.StorageAction = {
      action: "MakePathToken"
    };
    const out = await (await Fetch.post({
      url: joinURL(STORAGE, path),
      authToken: token,
      site,
      data,
    }))?.json();
    if (!isPathTokenResponse(out)) return;
    return out.token;
  }
  async function rename(from: string, to: string) {
    const data: api.StorageAction = {
      action: "Move",
      new_path: to,
    };
    const response = await Fetch.post({
      url: joinURL(STORAGE, from),
      authToken: token,
      site,
      data
    });
    if (response?.response.ok) {
      await loadFolder(currentPath);
    }
  }
  async function deletePath(path: string) {
    const response = await Fetch.delete({
      url: joinURL(STORAGE, path),
      authToken: token,
      site,
    });
    if (response?.response.ok) {
      await loadFolder(currentPath);
    }
  }
  async function upload(path: string, files: File[]) {
    const uploadForm = new FormData();
    files.map((file) => {
      uploadForm.append(file.name, file);
    });  

    const response = await Fetch.put({
      url: joinURL(STORAGE, path),
      authToken: token,
      site,
      formData: uploadForm,
    });
    if (response?.response.ok) {
      await loadFolder(currentPath);
    }
  }

  useEffect(() => {
    if (state === "uninitialized") {
      dispatch(authSlice.actions.markLoading());
      runAsync(async () => {
        const out = await Persist.get(PERSIST_AUTH_KEY);
        console.log("Found saved state", out);
        if (isAuthState(out)) {
          console.log("Saved state was valid");
          if (await isTokenValid(out.token, out.site)) {
            // Saved token is still valid, so keep using it
            console.log("Saved token was good, resuming as logged in");
            dispatch(authSlice.actions.login(out));
          } else {
            // Saved token is invalid, it's too old or revoked.
            // Try to log in again with the saved username and password.
            console.log(
              "Saved token was bad, using saved account into to log in again",
            );
            await login(out);
          }
        } else {
          console.log("Saved state was bad or did not exist");
          dispatch(authSlice.actions.logout());
          Persist.delete(PERSIST_AUTH_KEY);
        }
      });
    }
  }, [state]);

  return {
    login,
    logout,
    state,
    site,
    username,
    loadFolder,
    peekFolder,
    getPathToken,
    deletePath,
    rename,
    upload,
  };
}
