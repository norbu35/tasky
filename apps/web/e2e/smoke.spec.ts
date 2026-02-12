import { expect, test } from "@playwright/test";

test("@smoke TID-TASK-000-WEB-E2E-SMOKE renders Tasky web shell", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Tasky Web" })).toBeVisible();
  await expect(page.getByText("React web scaffold is ready.")).toBeVisible();
});
