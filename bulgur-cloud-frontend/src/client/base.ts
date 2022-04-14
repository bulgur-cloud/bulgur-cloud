import { BError } from "../error";
import { Fetch, RequestWithData, Request } from "../fetch";

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

  constructor(opts: { site: string | undefined; token: string | undefined }) {
    this._site = opts.site;
    this._token = opts.token;
  }

  abstract run(...params: Params): Promise<Output>;

  protected async get(opts: Request) {
    return Fetch.get({ authToken: this._token, site: this._site, ...opts });
  }

  protected async head(opts: Request) {
    return Fetch.head({ authToken: this._token, site: this._site, ...opts });
  }

  protected async post<Data>(opts: RequestWithData<Data>) {
    return Fetch.post<Data>({
      authToken: this._token,
      site: this._site,
      ...opts,
    });
  }

  protected async put<Data>(opts: RequestWithData<Data>) {
    return Fetch.put<Data>({
      authToken: this._token,
      site: this._site,
      ...opts,
    });
  }

  protected async delete(opts: Request) {
    return Fetch.delete({ authToken: this._token, site: this._site, ...opts });
  }
}
