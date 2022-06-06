import { test, expect } from "@playwright/test";

test("Logging in with an incorrect password fails", async ({ page }) => {
  await page.goto("/");
  await page.fill('input[placeholder="Username"]', "testuser");
  await page.fill('input[placeholder="Password"]', "bad");
  await page.click("text=Login");

  expect(page.locator("text=Login")).toBeTruthy();
  expect(page.locator("text=Bad username or password")).toBeTruthy();
});
