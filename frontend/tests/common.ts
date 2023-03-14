import { Page } from "@playwright/test";

export async function login({
  page,
  username = "testuser",
  password = "testpass",
  homepage,
}: {
  page: Page;
  username?: string;
  password?: string;
  homepage?: string;
}) {
  await page.goto(homepage ?? "/login");
  await page.fill("#username", username);
  await page.fill("#password", password);
  await page.click("text=Log in");
}

export const AUTH_STATE_FILE = "test-data/testing_auth_state.json";
