import { Persist } from "../persist";
import { authSlice, store } from "../store";
import { PERSIST_AUTH_KEY } from "./login";

export class Logout {
  async run() {
    await Persist.delete(PERSIST_AUTH_KEY);
    store.dispatch(authSlice.actions.logout());
  }
}
