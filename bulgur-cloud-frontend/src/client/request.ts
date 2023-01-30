import axios, {
  AxiosError,
  AxiosRequestConfig,
  AxiosResponse,
  Method,
} from "axios";
import useSWR, { SWRConfiguration } from "swr";
import { BError } from "../error";
import { useAppSelector } from "../store";
import { useEnsureAuthInitialized } from "./auth";
import { pick, shallowEquals } from "../utils";
import debounce from "debounce";

export type RequestParams<D> = {
  method: Method;
  url: string;
  data?: D;
};

export async function axiosThrowless<D, R>(config: AxiosRequestConfig<D>) {
  let response: AxiosResponse<R, unknown>;
  try {
    response = await axios.request<R>(config);
  } catch (err) {
    if (err instanceof AxiosError && err.response) {
      response = err.response;
    } else {
      throw err;
    }
  }
  return response;
}

export type OnProgressCallback = (opts: {
  total: number;
  done: number;
}) => void;

/** Use this when writing a new hook that performs an action on the server.
 *
 * @returns.doRequest A function that will perform the request when used.
 * The request function will automatically handle reauthentication if needed.
 */
export function useRequest<D, R>() {
  const { site, access_token } = useAppSelector((selector) => selector.auth);
  useEnsureAuthInitialized();

  async function doRequest(
    params: RequestParams<D>,
    onUploadProgress?: OnProgressCallback | undefined,
  ) {
    if (!site) {
      console.log("Missing auth error");
      throw new BError({
        code: "missing_auth",
        title: "Authentication Data Missing",
        description:
          "The app data may have been corrupted. Please try erasing your browser cache and reloading the page.",
      });
    }

    const headers: { [key: string]: string } = {};
    if (access_token) {
      headers.authorization = access_token;
    }

    const config: AxiosRequestConfig = {
      baseURL: site,
      headers,
      method: params.method,
      url: params.url,
    };

    if (params.data) {
      if (typeof params.data === "object" && "getHeaders" in params.data) {
        config.headers = {
          ...config.headers,
          ...config.data.getHeaders(),
        };
      }
      config.data = params.data;
    }

    if (onUploadProgress) {
      config.onUploadProgress = debounce((progress: any) => {
        // For XMLHttpRequest on the web
        if (
          progress &&
          Number.isInteger(progress.loaded) &&
          Number.isInteger(progress.total)
        ) {
          onUploadProgress({
            total: progress.total,
            done: progress.loaded,
          });
        }
        // TODO: Implement for mobile
      }, 200);
    }

    return await axiosThrowless<D, R>(config);
  }

  return { doRequest };
}

/** Use this when writing a new hook that fetches data from the server. */
export function useFetch<D, R>(
  params: RequestParams<D>,
  swrConfig?: SWRConfiguration,
) {
  const { access_token, site } = useAppSelector(
    (selector) => pick(selector.auth, "access_token", "site"),
    shallowEquals,
  );

  const { doRequest } = useRequest<D, R>();

  return useSWR<AxiosResponse<R, any>, any, any>(
    {
      ...params,
      // Passing the token in, even though `doRequest` doesn't need it, so the
      // cache will be invalidated if the token changes. This is necessary when
      // the page is refreshed, where there's a race between the page trying to
      // fetch results and the saved auth state being loaded.
      access_token,
      site,
    },
    doRequest,
    swrConfig,
  );
}
