import { BaseClientCommand } from "./base";

export class TokenCheck extends BaseClientCommand<boolean> {
  async run() {
    const response = await this.head({
      url: `/api/stats`,
    });
    return !!response?.response.ok;
  }
}
