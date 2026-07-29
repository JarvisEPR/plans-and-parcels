import { expect, test } from "@playwright/test";

test("facilitator creates a QR room and a guest claims a role", async ({ browser, page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Every plan has a price/i })).toBeVisible();
  await page.getByRole("button", { name: "Facilitate a game" }).click();
  await expect(page).toHaveURL(/\/host\/[23456789A-HJ-NP-Z]{6}$/);
  const roomCode = page.url().split("/").at(-1);
  expect(roomCode).toHaveLength(6);
  await expect(page.getByRole("heading", { name: "Scan to enter" })).toBeVisible();

  const playerContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true
  });
  const player = await playerContext.newPage();
  await player.goto(`/join/${roomCode}`);
  await player.getByLabel("Display name").fill("Alex");
  await player.getByRole("button", { name: "Enter Copperline" }).click();
  await expect(player.getByRole("heading", { name: "Choose your role" })).toBeVisible();
  await player.getByRole("button", { name: "Choose role" }).first().click();
  await expect(player.getByRole("button", { name: "I am ready" })).toBeVisible();

  await expect(page.getByText("Alex", { exact: true })).toBeVisible();
  await playerContext.close();
});

test("manual room entry preserves the six-character code", async ({ page }) => {
  await page.goto("/");
  const input = page.getByLabel("Six-character room code");
  await input.fill("ab0-23z");
  await expect(input).toHaveValue("AB23Z");
});
