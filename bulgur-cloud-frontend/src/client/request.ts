import axios, { AxiosRequestConfig, Method } from "axios";
import useSWR from "swr";
import { BError } from "../error";
import { useAppSelector } from "../store";
import FormData from "form-data";
import { HttpStatusCode } from "./base";
import { useEnsureAuthInitialized, useLogin } from "./auth";

export type RequestParams<D> = {
  method: Method;
  url: string;
  data?: D;
};

/** Use this when writing a new hook that performs an action on the server.
 *
 * @returns.doRequest A function that will perform the request when used.
 * The request function will automatically handle reauthentication if needed.
 */
export function useRequest<D, R>() {
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
export function useFetch<D, R>(params: RequestParams<D>) {
  const { doRequest } = useRequest<D, R>();

  return useSWR(params, doRequest);
}
