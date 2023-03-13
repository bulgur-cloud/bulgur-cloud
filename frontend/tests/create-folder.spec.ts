import { test, expect } from "@playwright/test";
import { login } from "./common";

test("creating a folder works", async ({ page }) => {
  await login({ page });
  await expect(page).toHaveURL(/\/s\/testuser\/$/);
  // Click div[role="button"]:has-text("New folder")
  await page.locator('div[role="button"]:has-text("New folder")').click();
  // Click [placeholder="Enter a name for the new folder"]
  await page.locator('[placeholder="Enter a name for the new folder"]').click();
  // Fill [placeholder="Enter a name for the new folder"]
  await page
    .locator('[placeholder="Enter a name for the new folder"]')
    .fill("hi");
  // Click div[role="button"]:has-text("Create")
  await page.locator('div[role="button"]:has-text("Create")').click();
  // Click span:has-text("hi")
  await page.locator('span:has-text("hi")').click();
  await expect(page).toHaveURL(/\/s\/testuser\/hi\/$/);
  await page
    .locator(
      '[aria-label="Go up"]',
    )
    .click();
  await expect(page).toHaveURL("http://localhost:8000/s/testuser/");
});
