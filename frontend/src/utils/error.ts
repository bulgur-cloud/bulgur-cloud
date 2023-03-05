export class BError {
  public static isBError(error: unknown): error is BError {
    return error instanceof BError;
  }

  private _code: string;
  public get code(): string {
    return this._code;
  }
  private _title: string;
  public get title(): string {
    return this._title;
  }
  private _description: string;
  public get description(): string {
    return this._description;
  }

  constructor(opts: { code: string; title: string; description: string }) {
    this._code = opts.code;
    this._title = opts.title;
    this._description = opts.description;
  }
}
