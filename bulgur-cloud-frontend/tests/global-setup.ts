import { chromium, FullConfig } from "@playwright/test";
import { AUTH_STATE_FILE, login } from "./common";

async function globalSetup(config: FullConfig) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const homepage = config.webServer?.url ?? "http://localhost:8000";
  await login({ page, homepage });
  await page.context().storageState({ path: AUTH_STATE_FILE });
}

export default globalSetup;
