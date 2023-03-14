import { test, expect } from "@playwright/test";
import { login } from "./common";

// TODO: Re-enable once login errors are displayed
test.skip("Logging in with an incorrect password fails", async ({ page }) => {
  await login({ page, username: "testuser", password: "wrong" });

  expect(page.locator("text=Log in")).toBeTruthy();
  expect(page.locator("text=Bad username or password")).toBeTruthy();
});

test("Logging in with the right password works", async ({ page }) => {
  await login({ page });

  expect(page.locator("text=testuser")).toBeTruthy();
  await expect(page).toHaveURL(/\/s\/testuser$/);
});
