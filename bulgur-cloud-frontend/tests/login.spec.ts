import { test, expect } from "@playwright/test";
import { login } from "./common";

test("Logging in with an incorrect password fails", async ({ page }) => {
  await login({ page, username: "testuser", password: "wrong" });

  expect(page.locator("text=Login")).toBeTruthy();
  expect(page.locator("text=Bad username or password")).toBeTruthy();
});

test("Logging in with the right password works", async ({ page }) => {
  await login({ page });

  expect(page.locator("text=testuser")).toBeTruthy();
  expect(page.locator("text=Logout")).toBeTruthy();
  await expect(page).toHaveURL(/\/s\/testuser\/$/);
});
