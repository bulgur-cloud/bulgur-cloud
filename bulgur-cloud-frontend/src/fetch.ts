import { ERR_DATA_AND_FORM_DATA } from "./error";

export function normalizeURL(url: string) {
  return url.replace(/\/\/+/g, "/");
}

export function joinURL(...args: string[]) {
  return normalizeURL(args.join("/"));
}

export function urlUp1Level(url: string) {
  const upUrl =
    normalizeURL(url)
      .replace(/\/$/, "")
      .split("/")
      .slice(undefined, -1)
      .join("/") + "/";
  if (upUrl === "/") return "";
  return upUrl;
}

export function urlFileExtension(url: string): string | undefined {
  const extensionMatch = /[.]([^.]+)$/.exec(url);
  const extension = extensionMatch ? extensionMatch[1] : undefined;
  return extension;
}

export function urlFileName(url: string): string | undefined {
  const fileNameMatch = /[/]?([^/]+)$/.exec(url);
  const fileName = fileNameMatch ? fileNameMatch[1] : undefined;
  return fileName;
}

export type Request = {
  site?: string;
  url: string;
  pathToken?: string;
  authToken?: string;
};
export type RequestWithData<Data> = Request & {
  data?: Data;
  formData?: FormData;
};
export type RequestBase<Data> = {
  method: string;
} & Request & { data?: Data; formData?: FormData };
export type ResponseBase =
  | { response: Response; json: () => unknown }
  | undefined;

export class Fetch {
  public static async request<Data = unknown | undefined>({
    site,
    url,
    method,
    authToken,
    pathToken,
    data,
    formData,
  }: RequestBase<Data>): Promise<ResponseBase> {
    const headers = new Headers();
    if (data) {
      headers.append("Content-Type", "application/json");
    }
    if (authToken !== undefined) {
      headers.append("authorization", authToken);
    }
    // Make sure URL starts with a single slash, and site has no trailing slash, so it combined correctly with the site
    if (!site) {
      console.error("Request before site is set");
      return;
    }
    site = site.replace(/\/*$/, "");
    url = normalizeURL("/" + url);
    url = `${site}${url}`;
    if (pathToken) url = `${url}?token=${pathToken}`;

    try {
      let body: undefined | string | FormData;
      if (data) {
        body = JSON.stringify(data);
        if (formData) throw ERR_DATA_AND_FORM_DATA;
      }
      if (formData) {
        body = formData;
      }

      const out = await fetch(url, {
        method,
        body,
        headers: headers,
      });
      return {
        response: out,
        json: () => {
          try {
            return out.json();
          } catch (error) {
            console.error("Failed to parse response from the API", error);
            return;
          }
        },
      };
    } catch (err) {
      console.error(err);
      return;
    }
  }

  public static async get(opts: Request) {
    return this.request<undefined>({ ...opts, method: "GET" });
  }

  public static async head(opts: Request) {
    return this.request({ ...opts, method: "HEAD" });
  }

  public static async post<Data>(opts: RequestWithData<Data>) {
    return this.request<Data>({ ...opts, method: "POST" });
  }

  public static async put<Data>(opts: RequestWithData<Data>) {
    return this.request<Data>({ ...opts, method: "PUT" });
  }

  public static async delete(opts: Request) {
    return this.request<undefined>({ ...opts, method: "DELETE" });
  }
}
