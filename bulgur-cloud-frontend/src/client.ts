import axios, { AxiosRequestConfig, Method } from "axios";
import useSWR, { useSWRConfig } from "swr";
import api from "./api";
import { BError } from "./error";
import { Persist } from "./persist";
import {
  authSlice,
  AuthState,
  errorSlice,
  LoginPayload,
  store,
  useAppDispatch,
  useAppSelector,
} from "./store";
import { isBoolean, isString } from "./typeUtils";
import FormData from "form-data";
import { useEffect } from "react";
import { useNavigation } from "@react-navigation/native";

export const STORAGE = "storage";

export function runAsync(
  fn: () => Promise<void>,
  onError?: (error: unknown) => Promise<void>,
) {
  fn().catch((error) => {
    console.error(error);
    store.dispatch(
      errorSlice.actions.addError({
        key: `${new Date().getTime()}`,
        error,
      }),
    );
    if (onError) onError(error);
  });
}

enum HttpStatusCode {
  UNAUTHORIZED = 401,
  NOT_FOUND = 404,
}

function isOkResponse(responseCode: number): boolean {
  return 200 <= responseCode && responseCode < 300;
}

export const PERSIST_AUTH_KEY = "bulgur-cloud-auth";

function isLoginResponse(data: any): data is api.LoginResponse {
  return isString(data?.token) && Number.isInteger(data?.valid_for_seconds);
}

export function useTokenCheck() {
  async function doTokenCheck({
    site,
    token,
  }: {
    site: string;
    token: string;
  }) {
    const out = await axios.request<never>({
      method: "HEAD",
      url: "/api/stats",
      headers: {
        authorization: token,
      },
      baseURL: site,
    });

    return isOkResponse(out.status);
  }

  return { doTokenCheck };
}

export function useLogin() {
  const dispatch = useAppDispatch();

  async function doLogin({
    site,
    username,
    password,
  }: {
    site: string;
    username: string;
    password: string;
  }) {
    const data: api.Login = {
      username,
      password,
    };
    const out = await axios.post<api.LoginResponse>("/auth/login", data, {
      baseURL: site,
    });
    if (!isLoginResponse(out.data)) {
      throw new BError({
        code: "login_failed",
        title: "Failed to log in or reauthenticate",
        description:
          "You may be trying to log in with the wrong password, the server may be having internal issues, or your account may have been deleted.",
      });
    }

    const payload: LoginPayload = {
      username,
      password,
      token: out.data.token,
      site,
    };
    await Persist.set(PERSIST_AUTH_KEY, payload);
    dispatch(authSlice.actions.login(payload));
    return { username };
  }

  return { doLogin };
}

export function useLogout() {
  const dispatch = useAppDispatch();
  const { cache } = useSWRConfig();
  const navigation = useNavigation();

  async function doLogout() {
    // Delete any saved tokens, otherwise we'd re-log the user.
    await Persist.delete(PERSIST_AUTH_KEY);
    // Clear out any cached data. Not strictly necessary since they are keyed by
    // the current token, but clearing it out should save memory.

    // Type mismatch, function is available: https://github.com/vercel/swr/issues/1887
    // @ts-ignore
    cache.clear();

    // Reset the redux auth state
    dispatch(authSlice.actions.logout());

    // Go back to the login screen
    navigation.navigate("Login");
  }

  return { doLogout };
}

function isAuthState(data: any): data is Required<Omit<AuthState, "state">> {
  return (
    isString(data?.username) &&
    isString(data?.password) &&
    isString(data?.token)
  );
}

/** Ensures that if there's a saved auth token, the app is authenticated with the saved token. */
export function useEnsureAuthInitialized() {
  const state = useAppSelector((selector) => selector.auth.state);
  const dispatch = useAppDispatch();
  const { doTokenCheck } = useTokenCheck();
  const { doLogin } = useLogin();
  const { doLogout } = useLogout();

  useEffect(() => {
    if (state === "uninitialized") {
      dispatch(authSlice.actions.markLoading());
      runAsync(async () => {
        const out = await Persist.get(PERSIST_AUTH_KEY);
        console.log("Found saved state", out);
        if (isAuthState(out)) {
          console.log("Saved state was valid");
          if (await doTokenCheck({ site: out.site, token: out.token })) {
            // Saved token is still valid, so keep using it
            console.log("Saved token was good, resuming as logged in");
            dispatch(authSlice.actions.login(out));
          } else {
            // Saved token is invalid, it's too old or revoked.
            // Try to log in again with the saved username and password.
            console.log(
              "Saved token was bad, using saved account into to log in again",
            );
            await doLogin(out);
          }
        } else {
          console.log("Saved state was bad or did not exist");
          await doLogout();
          Persist.delete(PERSIST_AUTH_KEY);
        }
      });
    }
  });

  return state;
}

type RequestParams<D> = {
  method: Method;
  url: string;
  data?: D;
};

/** Use this when writing a new hook that performs an action on the server.
 *
 * @returns.doRequest A function that will perform the request when used.
 * The request function will automatically handle reauthentication if needed.
 */
function useRequest<D, R>() {
  const { site, token, username, password } = useAppSelector(
    (selector) => selector.auth,
  );
  const { doLogin } = useLogin();
  useEnsureAuthInitialized();

  async function doRequest(params: RequestParams<D>) {
    console.log("doRequest");
    if (!site || !token)
      throw new BError({
        code: "missing_auth",
        title: "Authentication Data Missing",
        description:
          "The app data may have been corrupted. Please try erasing your browser cache and reloading the page.",
      });

    const config: AxiosRequestConfig = {
      baseURL: site,
      headers: {
        authorization: token,
      },
      method: params.method,
      url: params.url,
    };

    if (params.data) {
      if (params.data instanceof FormData) {
        config.headers = {
          ...config.headers,
          ...config.data.getHeaders(),
        };
      }
      config.data = params.data;
    }
    console.log("doRequest", config);
    const response = await axios.request<R>(config);
    if (response.status === HttpStatusCode.UNAUTHORIZED) {
      if (!site || !username || !password) return response;
      // Once we log in again, this request should automatically get retried
      // since the token will change, and the hooks depend on the token (plus a
      // token change invalidates the cached requests)
      await doLogin({ site, username, password });
    }
    return response;
  }

  return { doRequest };
}

/** Use this when writing a new hook that fetches data from the server. */
function useFetch<D, R>(params: RequestParams<D>) {
  const { doRequest } = useRequest<D, R>();

  return useSWR(params, doRequest);
}

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
  });
}

export function useCreateFolder() {
  const { doRequest } = useRequest<api.StorageAction, never>();

  async function doCreateFolder(url: string) {
    doRequest({
      url,
      method: "POST",
      data: {
        action: "CreateFolder",
      },
    });
  }

  return { doCreateFolder };
}

export function useDelete() {
  const { doRequest } = useRequest<never, never>();

  async function doDelete(url: string) {
    doRequest({
      url,
      method: "DELETE",
    });
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
    url: "/" + url,
    method: "GET",
  });

  if (resp.data && isFolderResults(resp.data)) {
    throw new BError({
      code: "load_folder_failed",
      title: "Failed to load folder",
      description: `Unable to load ${url}`,
    });
  }

  return resp;
}

export function useRename() {
  const { doRequest } = useRequest<api.StorageAction, never>();

  async function doRename(from: string, to: string) {
    return doRequest({
      method: "POST",
      url: from,
      data: {
        action: "Move",
        new_path: to,
      },
    });
  }

  return { doRename };
}

export function useUpload() {
  const { doRequest } = useRequest<FormData, never>();

  async function doUpload(url: string, files: File[]) {
    const uploadForm = new FormData();
    files.forEach((file) => {
      uploadForm.append(file.name, file);
    });

    await doRequest({
      method: "PUT",
      url,
      data: uploadForm,
    });
  }

  return { doUpload };
}
