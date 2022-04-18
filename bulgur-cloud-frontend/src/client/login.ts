import api from "../api";
import { isString } from "../typeUtils";
import { BError } from "../error";
import { Persist } from "../persist";
import { authSlice, store } from "../store";
import { Fetch } from "../fetch";

type LoginOpts = { username: string; password: string; site: string };

export const PERSIST_AUTH_KEY = "bulgur-cloud-auth";

function isLoginResponse(data: any): data is api.LoginResponse {
  return isString(data?.token) && Number.isInteger(data?.valid_for_seconds);
}

export class Login {
  async run(data: LoginOpts) {
    const response = await Fetch.post({
      url: `/auth/login`,
      site: data.site,
      data: {
        username: data.username,
        password: data.password,
      },
    });
    const out = await response?.json();
    if (!isLoginResponse(out)) {
      const status = response?.response.status;
      let reason: string = `${status}`;
      if (status === undefined) reason = `There was an unknown error.`;
      else if (500 <= status && status < 600)
        reason = `There was an internal server error. (${status})`;
      else if (status === 400) {
        reason = "Incorrect username or password";
      } else {
        reason = `There was an unknown error. (${status})`;
      }

      throw new BError({
        code: "login_failed",
        title: "Login failed",
        description: `Unable to log in: ${reason}`,
      });
    }

    const { token } = out;

    console.debug("Persisting the auth token");
    const payload = {
      username: data.username,
      password: data.password,
      token,
      site: data.site,
    };
    await Persist.set(PERSIST_AUTH_KEY, payload);
    store.dispatch(authSlice.actions.login(payload));
    return out;
  }
}
