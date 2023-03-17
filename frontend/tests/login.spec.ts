import { test, expect } from "@playwright/test";
import { login } from "./common";

test("Logging in with an incorrect password fails", async ({ page }) => {
  await login({ page, username: "testuser", password: "wrong" });

  expect(page.locator("text=Log in")).toBeTruthy();
  expect(page.locator("text=username or password is incorrect")).toBeTruthy();
});

test("Logging in with the right password works", async ({ page }) => {
  await login({ page });

  expect(page.locator("text=testuser")).toBeTruthy();
  await expect(page).toHaveURL("http://localhost:3000/s/testuser");
});
