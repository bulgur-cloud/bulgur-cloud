import { BError } from "../error";
import {
  Fetch,
  RequestWithData,
  Request,
  RequestBase,
  ResponseBase,
} from "../fetch";
import { store } from "../store";
import { Login } from "./login";
import { Logout } from "./logout";
import { TokenCheck } from "./tokenCheck";

export abstract class BaseClientCommand<
  Output = void,
  Params extends any[] = [],
> {
  private _site: string | undefined;
  protected get site(): string {
    if (!this._site) {
      throw new BError({
        code: "site_unset",
        title: "Internal Error (site unset)",
        description:
          "An internal error has occurred, please send a bug report if you are seeing this.",
      });
    }
    return this._site;
  }
  private _token: string | undefined;

  /** You can pass in new settings for site and token, or clone them from another command. */
  constructor(
    opts:
      | { site: string | undefined; token: string | undefined }
      | BaseClientCommand<any, any>,
  ) {
    if (opts instanceof BaseClientCommand) {
      this._site = opts._site;
      this._token = opts._token;
    } else {
      this._site = opts.site;
      this._token = opts.token;
    }
  }

  abstract run(...params: Params): Promise<Output>;

  /** Should throw an error, or take an action appropriate to the error.
   *
   * Errors not handled in here will be handled in the base.
   *
   * @returns Return `"done"` if you have fully handled the error, and don't
   * need the base to handle the error (which would throw an exception).
   * Otherwise return "continue" to have base throw an exception, which is the
   * default if this function is not overridden.
   */
  protected async handleError(
    response: ResponseBase,
  ): Promise<"done" | "continue"> {
    return "continue";
  }

  /** If we have a bad token, retry this many times to refresh the token and repeat the request. */
  private static MAX_RETRY_TOKEN_REFRESHES = 1;

  private async request<Data = unknown | undefined>(opts: RequestBase<Data>) {
    let out: ResponseBase;
    let retries = 0;
    do {
      out = await Fetch.request({
        authToken: this._token,
        site: this._site,
        ...opts,
      });
      if (out?.response.ok) return out;

      if (out?.response.status === 401) {
        const { username, password } = store.getState().auth;
        // If unauthorized, check if the token is valid first
        if (
          username === undefined ||
          password === undefined ||
          (await new TokenCheck().run({
            token: this._token!,
            site: this._site!,
          }))
        ) {
          // If it is, then the user is accessing something they shouldn't
          await new Logout().run();
          throw new BError({
            code: "unauthorized",
            title: "Unauthorized",
            description: "You are not authorized to do this action.",
          });
        }
        // If not, the token might have gotten stale. We should try to refresh
        // the token.
        const auth = await new Login().run({
          username,
          password,
          site: this.site,
        });
        this._token = auth.token;
        retries++;
      } else {
        break;
      }
    } while (retries <= BaseClientCommand.MAX_RETRY_TOKEN_REFRESHES);

    const status = out?.response.status;

    if ((await this.handleError(out)) === "done") return;

    if (status === undefined)
      throw new BError({
        code: "request_undefined",
        title: "Failed to connect to the server",
        description:
          "There was an unknown error when connecting to the server.",
      });

    if (500 <= status && status < 600)
      throw new BError({
        code: "server_error",
        title: "Internal server error",
        description: `There was an error in the server. (${status} - ${out?.response.statusText})`,
      });

    throw new BError({
      code: "unexpected_error",
      title: "Unexpected error",
      description: `An unexpected error occurred. (${status} - ${out?.response.statusText})`,
    });
  }

  protected async get(opts: Request) {
    return this.request<undefined>({
      method: "GET",
      ...opts,
    });
  }

  protected async head(opts: Request) {
    return this.request<undefined>({
      method: "HEAD",
      ...opts,
    });
  }

  protected async post<Data>(opts: RequestWithData<Data>) {
    return this.request<Data>({
      method: "POST",
      ...opts,
    });
  }

  protected async put<Data>(opts: RequestWithData<Data>) {
    return this.request<Data>({
      method: "PUT",
      ...opts,
    });
  }

  protected async delete(opts: Request) {
    return this.request<undefined>({
      method: "DELETE",
      ...opts,
    });
  }
}
