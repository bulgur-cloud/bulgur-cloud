/* eslint-disable @typescript-eslint/no-explicit-any */
import { api } from "./api";
import {
  authSlice,
  AuthState,
  errorSlice,
  store,
  useAppDispatch,
  useAppSelector,
} from "./store";
import { useEffect } from "react";
import { Persist } from "./persist";
import { isBoolean, isString } from "./typeUtils";
import { CreateFolder } from "./client/createFolder";
import { DeletePath } from "./client/deletePath";
import { LoadFolder } from "./client/loadFolder";
import { Login } from "./client/login";
import { Logout } from "./client/logout";
import { PathToken } from "./client/pathToken";
import { Rename } from "./client/rename";
import { TokenCheck } from "./client/tokenCheck";
import { Upload } from "./client/upload";

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

const STORAGE = "/storage";

const PERSIST_AUTH_KEY = "bulgur-cloud-auth";

function isAuthState(data: any): data is Required<Omit<AuthState, "state">> {
  return (
    isString(data?.username) &&
    isString(data?.password) &&
    isString(data?.token)
  );
}

function isPathTokenResponse(data: any): data is api.PathTokenResponse {
  return isString(data?.token);
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

/** Allows interacting with the API, and accessing API state like the username. */
export function useClient() {
  const { state, username, token, site } = useAppSelector(
    (state) => state.auth,
  );
  const dispatch = useAppDispatch();

  const opts = { site, token };
  const createFolder = new CreateFolder(opts);
  const deletePath = new DeletePath(opts);
  const loadFolder = new LoadFolder(opts);
  const login = new Login();
  const logout = new Logout();
  const pathToken = new PathToken(opts);
  const rename = new Rename(opts);
  const tokenCheck = new TokenCheck();
  const upload = new Upload(opts);

  useEffect(() => {
    if (state === "uninitialized") {
      dispatch(authSlice.actions.markLoading());
      runAsync(async () => {
        const out = await Persist.get(PERSIST_AUTH_KEY);
        console.log("Found saved state", out);
        if (isAuthState(out)) {
          console.log("Saved state was valid");
          if (
            await new TokenCheck().run({ site: out.site, token: out.token })
          ) {
            // Saved token is still valid, so keep using it
            console.log("Saved token was good, resuming as logged in");
            dispatch(authSlice.actions.login(out));
          } else {
            // Saved token is invalid, it's too old or revoked.
            // Try to log in again with the saved username and password.
            console.log(
              "Saved token was bad, using saved account into to log in again",
            );
            await login.run(out);
          }
        } else {
          console.log("Saved state was bad or did not exist");
          await logout.run();
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
    pathToken,
    tokenCheck,
    deletePath,
    rename,
    upload,
    createFolder,
  };
}
