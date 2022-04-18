import api from "../api";
import { Fetch } from "../fetch";

export class TokenCheck {
  async run(opts: { site: string; token: api.Token }) {
    const response = await Fetch.head({
      url: `/api/stats`,
      site: opts.site,
      authToken: opts.token,
    });
    return !!response?.response.ok;
  }
}
