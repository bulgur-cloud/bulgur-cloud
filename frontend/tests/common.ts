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
  await page.goto(homepage ?? "/");
  await page.fill('input[placeholder="Username"]', username);
  await page.fill('input[placeholder="Password"]', password);
  await page.click("text=Login");
}

export const AUTH_STATE_FILE = "test-data/testing_auth_state.json";
