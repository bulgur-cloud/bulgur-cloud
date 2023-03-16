import { test, expect } from "@playwright/test";
import { nanoid } from "@reduxjs/toolkit";
import { login } from "./common";

test("creating a folder works", async ({ page }) => {
  await login({ page });
  await expect(page).toHaveURL(/\/s\/testuser$/);

  const folderName = nanoid();

  await page.click("[id='new-folder-button']");
  await page.click("[id='new-folder-filename-input']");
  await page.fill("[id='new-folder-filename-input']", folderName);
  await page.click("[id='new-folder-filename-submit']");

  // Verify the folder was created

  await page.click(`:has-text('${folderName}')`);
  await expect(page).toHaveURL(
    new RegExp(`/\\/s\\/testuser\\/${folderName}\\/$/`),
  );

  // Check that we can go back to the root folder with the breadcrumbs
  await page.getByRole("list").getByRole("link", { name: "testuser" }).click();
  await expect(page).toHaveURL(/\/s\/testuser$/);
});
