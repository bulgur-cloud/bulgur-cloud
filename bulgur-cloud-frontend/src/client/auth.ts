import axios from "axios";
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
import { useNavigation } from "@react-navigation/native";
import { isOkResponse, runAsync } from "./base";

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
    try {
      const out = await axios.request<never>({
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
