import { useSWRConfig } from "swr";
import api from "../api";
import { BError } from "../error";
import { Persist } from "../persist";
import {
  authSlice,
  AuthState,
  LoginPayload,
  useAppDispatch,
  useAppSelector,
} from "../store";
import { isString } from "../typeUtils";
import { useEffect } from "react";
import { HttpStatusCode, isOkResponse, runAsync } from "./base";
import { axiosThrowless } from "./request";
import { encodeRouteForRedirect, useAppNavigation } from "../routes";
import { Platform } from "react-native";

export const PERSIST_AUTH_KEY = "bulgur-cloud-auth";

function isLoginResponse(data: any): data is api.LoginResponse {
  return isString(data?.access_token) && isString(data?.refresh_token) && Number.isInteger(data?.valid_for_seconds);
}

export function useTokenCheck() {
  async function doTokenCheck({
    site,
    token,
  }: {
    site: string;
    token: string;
  }) {
    try {
      const out = await axiosThrowless<never, never>({
        method: "HEAD",
        url: "/api/stats",
        headers: {
          authorization: token,
        },
        baseURL: site,
      });

      return isOkResponse(out.status);
    } catch {
      return false;
    }
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
    dispatch(authSlice.actions.markLoading());

    try {
      const data: api.Login = {
        username,
        password,
      };
      const out = await axiosThrowless<api.Login, api.LoginResponse>({
        url: "/auth/login",
        baseURL: site,
        method: "POST",
        data,
      });

      if (out.status === HttpStatusCode.BAD_REQUEST) {
        throw new BError({
          code: "login_bad",
          title: "Bad username or password",
          description:
            "The username or password you tried to use is incorrect.",
        });
      }

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
        access_token: out.data.access_token,
        refresh_token: out.data.refresh_token,
        site,
      };
      await Persist.set(PERSIST_AUTH_KEY, payload);
      dispatch(authSlice.actions.login(payload));
      return { username };
    } catch (err) {
      // If the login fails, mark the status as done so the loading indicator is dismissed.
      dispatch(authSlice.actions.logout());
      throw err;
    }
  }

  return { doLogin };
}

export function useRefresh() {
  const dispatch = useAppDispatch();

  async function doRefresh({
    site,
    username,
    refresh_token,
  }: {
    site: string;
    username: string;
    refresh_token: string;
  }) {
    dispatch(authSlice.actions.markLoading());

    try {
      const data: api.Refresh = {
        username,
        refresh_token,
      };
      const out = await axiosThrowless<api.Refresh, api.LoginResponse>({
        url: "/auth/refresh",
        baseURL: site,
        method: "POST",
        data,
      });

      if (out.status === HttpStatusCode.BAD_REQUEST) {
        throw new BError({
          code: "refresh_bad",
          title: "Bad refresh",
          description:
            "The username or password you tried to use is incorrect.",
        });
      }

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
        access_token: out.data.access_token,
        refresh_token: out.data.refresh_token,
        site,
      };
      await Persist.set(PERSIST_AUTH_KEY, payload);
      dispatch(authSlice.actions.login(payload));
      return { username };
    } catch (err) {
      // If the login fails, mark the status as done so the loading indicator is dismissed.
      dispatch(authSlice.actions.logout());
      throw err;
    }
  }

  return { doRefresh };
}

export function useLogout() {
  const dispatch = useAppDispatch();
  const { cache } = useSWRConfig();
  const navigation = useAppNavigation();

  async function doLogout({ noRedirect }: { noRedirect?: boolean } | undefined = {}) {
    // Delete any saved tokens, otherwise we'd re-log the user.
    await Persist.delete(PERSIST_AUTH_KEY);
    // Clear out any cached data. Not strictly necessary since they are keyed by
    // the current token, but clearing it out should save memory.

    // Type mismatch, function is available: https://github.com/vercel/swr/issues/1887
    // @ts-ignore
    cache.clear();

    // Reset the redux auth state
    dispatch(authSlice.actions.logout());

    // Go back to the login screen. If the user was looking at a page other than
    // the login page, save the redirect so we can send them back there
    // afterwards.
    const navState = navigation.getState();
    const route = navState.routes[navState.index];
    if (route.name === "Login" || noRedirect) {
      navigation.navigate("Login");
    } else {
      const redirect = encodeRouteForRedirect({ name: route.name, params: route.params });
      navigation.navigate("Login", { redirect });
    }
  }

  return { doLogout };
}

function isAuthState(data: any): data is Required<Omit<AuthState, "state">> {
  return (
    isString(data?.username) &&
    isString(data?.access_token) &&
    isString(data?.refresh_token)
  );
}

/** Ensures that if there's a saved auth token, the app is authenticated with the saved token. */
export function useEnsureAuthInitialized() {
  const state = useAppSelector((selector) => selector.auth.state);
  const dispatch = useAppDispatch();
  const { doTokenCheck } = useTokenCheck();
  const { doRefresh } = useRefresh();
  const { doLogout } = useLogout();

  useEffect(() => {
    if (state === "uninitialized" && Platform.OS === "web") {
      // On web platforms, immediately set the site since it's known to be the
      // current page.
      if (__DEV__) {
        dispatch(authSlice.actions.setSite("http://localhost:8000"));
      } else {
        dispatch(
          authSlice.actions.setSite(
            `${window.location.protocol}//${window.location.host}`,
          ),
        );
      }
      dispatch(authSlice.actions.markLoading());
      runAsync(async () => {
        const out = await Persist.get(PERSIST_AUTH_KEY);
        console.log("Found saved state", out);
        if (isAuthState(out)) {
          console.log("Saved state was valid");
          if (await doTokenCheck({ site: out.site, token: out.access_token })) {
            // Saved token is still valid, so keep using it
            console.log("Saved token was good, resuming as logged in");
            dispatch(authSlice.actions.login(out));
          } else {
            // Saved token is invalid, it's too old or revoked.
            // Try to log in again with the saved username and password.
            console.log(
              "Saved token was bad, using saved account into to log in again",
            );
            await doRefresh(out);
          }
        } else {
          console.log("Saved state was bad or did not exist");
          Persist.delete(PERSIST_AUTH_KEY);
          await doLogout();
        
        }
      });
    }
  });

  return state;
}
