import { joinURL } from "../fetch";
import { isString } from "../typeUtils";
import { useFetch } from "./request";

export const BANNER = "banner";

export function useBanner(banner: string) {
  const resp = useFetch<never, string>(
    {
      method: "GET",
      url: joinURL(BANNER, banner),
    },
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
      revalidateOnReconnect: true,
    },
  );

  if (resp.data?.status === 404) {
    return undefined;
  }

  if (isString(resp.data?.data)) {
    return resp.data?.data;
  }

  return undefined;
}
