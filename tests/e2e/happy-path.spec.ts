import { test, expect } from "@playwright/test";

test("happy path run", async ({ page }) => {
  await page.goto("/");
  await page.getByText("Cellular Automata → Music Playground").waitFor();
  await page.getByRole("button", { name: "Play" }).click();
  await page.waitForTimeout(2000);
  await page.getByRole("button", { name: "Pause" }).click();
  await page.getByRole("button", { name: "Random" }).click();
  const stat = await page.getByText("Gen:", { exact: false }).first();
  await expect(stat).toBeVisible();
});
