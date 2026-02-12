import { expect, test } from "@playwright/test";

test("@smoke TID-TASK-000-WEB-E2E-SMOKE renders Tasky web shell", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Post A Domestic Task" })).toBeVisible();
  await expect(page.getByText(/Shadcn component baseline is active/)).toBeVisible();
});
