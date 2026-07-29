import { expect, test, type Browser, type BrowserContext, type Page } from "@playwright/test";

interface JoinedPlayer {
  context: BrowserContext;
  page: Page;
}

async function joinPlayer(browser: Browser, roomCode: string, displayName: string) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto(`/join/${roomCode}`);
  await page.getByLabel("Display name").fill(displayName);
  await page.getByRole("button", { name: "Enter Copperline" }).click();
  await expect(page.getByRole("heading", { name: "Choose your role" })).toBeVisible();
  return { context, page } satisfies JoinedPlayer;
}

async function chooseRole(player: Page, characterName: string) {
  const card = player.getByRole("article").filter({
    has: player.getByRole("heading", { name: characterName })
  });
  await card.getByRole("button", { name: "Choose role" }).click();
  const ready = player.getByRole("button", { name: "I am ready" });
  await expect(ready).toBeVisible();
  await ready.click();
  await expect(player.getByRole("button", { name: /Ready - click to revise/ })).toBeVisible();
}

test("six players complete a synchronized Copperline session and export it", async ({
  browser,
  page: host
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "The six-device flow runs once.");

  await host.goto("/");
  await host.getByRole("button", { name: "Facilitate a game" }).click();
  await expect(host).toHaveURL(/\/host\/[23456789A-HJ-NP-Z]{6}$/);
  const roomCode = host.url().split("/").at(-1);
  expect(roomCode).toMatch(/^[23456789A-HJ-NP-Z]{6}$/);

  const names = ["Alex", "Blair", "Casey", "Devon", "Ellis", "Frankie"];
  const players = await Promise.all(names.map((name) => joinPlayer(browser, roomCode ?? "", name)));
  await expect(host.getByRole("heading", { name: "6/6 players" })).toBeVisible();

  const overflow = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const seventh = await overflow.newPage();
  await seventh.goto(`/join/${roomCode}`);
  await seventh.getByLabel("Display name").fill("Gray");
  await seventh.getByRole("button", { name: "Enter Copperline" }).click();
  await expect(seventh.getByRole("alert")).toContainText("six players");
  await overflow.close();

  const characters = [
    "Rowan Vale",
    "Morgan Reed",
    "Avery Chen",
    "Samira Ortiz",
    "Jordan Brooks",
    "Taylor Okafor"
  ];
  for (const [index, player] of players.entries()) {
    await chooseRole(player.page, characters[index] ?? "");
  }

  const start = host.getByRole("button", { name: "Advance to briefing" });
  await expect(start).toBeEnabled();
  await start.click();
  await expect(host.getByRole("heading", { name: "briefing", exact: true })).toBeVisible();

  await expect(players[0].page.getByText("Project Viability", { exact: true })).toHaveCount(0);
  const evidence = host.getByRole("article").filter({
    has: host.getByRole("heading", { name: "Project Viability" })
  });
  await evidence.getByRole("button", { name: "Reveal" }).click();
  await expect(players[0].page.getByRole("heading", { name: "Project Viability" })).toBeVisible();

  await host.getByRole("button", { name: "Advance to investigation" }).click();
  await expect(host.getByRole("heading", { name: "investigation", exact: true })).toBeVisible();
  await host.getByLabel("Acting planner").selectOption({ label: "Alex" });
  await host.getByLabel("Stakes").fill("Can the team establish a defensible planning basis?");
  await host.getByRole("button", { name: "Open check" }).click();
  await expect(players[1].page.getByRole("button", { name: "Support this check" })).toBeVisible();
  await players[1].page.getByRole("button", { name: "Support this check" }).click();
  await expect(players[0].page.getByText("Supported by Blair")).toBeVisible();
  await players[0].page.getByRole("button", { name: "Roll d20" }).click();
  await expect(host.getByRole("button", { name: "Close result" })).toBeVisible();
  await host.getByRole("button", { name: "Close result" }).click();

  await host.getByLabel("Reason for changing Public Trust").fill("Evidence entered the record");
  await host.getByRole("button", { name: "Increase Public Trust" }).click();
  await expect(players[0].page.getByRole("meter", { name: "Public Trust" })).toHaveAttribute(
    "aria-valuenow",
    "5"
  );
  await players[0].page.reload();
  await expect(players[0].page.getByRole("heading", { name: "Rowan Vale" })).toBeVisible();
  await expect(players[0].page.getByRole("meter", { name: "Public Trust" })).toHaveAttribute(
    "aria-valuenow",
    "5"
  );

  await host.getByRole("button", { name: "Advance to stakeholder forum" }).click();
  await expect(host.getByRole("heading", { name: "stakeholder forum", exact: true })).toBeVisible();
  await host.getByRole("button", { name: "Advance to recommendation" }).click();
  await expect(host.getByRole("heading", { name: "recommendation", exact: true })).toBeVisible();

  await host.getByRole("radio", { name: /Compact Transit District/ }).check();
  const commitments = [
    "Durable Affordability",
    "Hearthside Stability Program",
    "Connected Streets",
    "Copper Run Restoration"
  ];
  for (const commitment of commitments) {
    await host
      .getByRole("checkbox", { name: new RegExp(commitment) })
      .first()
      .check();
    await host.getByLabel(`${commitment} responsible party`).fill("Town implementation team");
    await host.getByLabel(`${commitment} funding or authority`).fill("Adopted agreement");
    await host.getByLabel(`${commitment} timing`).fill("Before first occupancy");
  }
  for (const supported of await host.getByRole("checkbox", { name: /Supported:/ }).all()) {
    await supported.check();
  }
  await host.getByLabel("Acknowledged tradeoff").fill("Fewer homes in exchange for durable terms.");
  await host.getByLabel("Unresolved risk").fill("Long-term funding still requires annual action.");
  await host.getByRole("button", { name: "Save shared draft" }).click();
  await expect(
    players[0].page.getByRole("radio", { name: /Compact Transit District/ })
  ).toBeChecked();
  await host.getByRole("button", { name: "Finalize and apply effects" }).click();
  await expect(host.getByText("The team finalized its recommendation.")).toBeVisible();

  await host.getByRole("button", { name: "Advance to hearing" }).click();
  await expect(host.getByRole("heading", { name: "hearing", exact: true })).toBeVisible();
  const challengeSelectors = host.getByRole("checkbox", { name: "Select" });
  await challengeSelectors.nth(0).check();
  await challengeSelectors.nth(1).check();
  await challengeSelectors.nth(2).check();
  await host.getByRole("button", { name: "Confirm three challenges" }).click();
  await expect(players[0].page.getByRole("heading", { name: "The Notice Defect" })).toBeVisible();

  await host.getByRole("button", { name: "Calculate epilogue" }).click();
  await expect(host.getByRole("heading", { name: /legacy$/ })).toBeVisible();
  const exported = await host.evaluate(async (code) => {
    const response = await fetch(`/api/v1/rooms/${code}/export`);
    return {
      status: response.status,
      body: (await response.json()) as {
        room: {
          phase: string;
          participants: unknown[];
          recommendation: { finalized: boolean };
          result: unknown;
        };
      }
    };
  }, roomCode);
  expect(exported.status).toBe(200);
  expect(exported.body.room.phase).toBe("epilogue");
  expect(exported.body.room.participants).toHaveLength(6);
  expect(exported.body.room.recommendation.finalized).toBe(true);
  expect(exported.body.room.result).not.toBeNull();

  await host.getByRole("button", { name: "Close public record" }).click();
  await expect(host.getByRole("heading", { name: "completed", exact: true })).toBeVisible();

  await Promise.all(players.map(({ context }) => context.close()));
});

test("simultaneous claims cannot assign one role twice", async ({
  browser,
  page: host
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "The concurrency flow runs once.");

  await host.goto("/");
  await host.getByRole("button", { name: "Facilitate a game" }).click();
  await expect(host).toHaveURL(/\/host\/[23456789A-HJ-NP-Z]{6}$/);
  const roomCode = host.url().split("/").at(-1) ?? "";
  const [first, second] = await Promise.all([
    joinPlayer(browser, roomCode, "Arden"),
    joinPlayer(browser, roomCode, "Bailey")
  ]);
  const firstChoice = first.page
    .getByRole("article")
    .filter({ has: first.page.getByRole("heading", { name: "Rowan Vale" }) })
    .getByRole("button", { name: "Choose role" });
  const secondChoice = second.page
    .getByRole("article")
    .filter({ has: second.page.getByRole("heading", { name: "Rowan Vale" }) })
    .getByRole("button", { name: "Choose role" });
  await Promise.all([
    firstChoice.evaluate((button: HTMLButtonElement) => button.click()),
    secondChoice.evaluate((button: HTMLButtonElement) => button.click())
  ]);

  await expect(host.getByText("Comprehensive Planner", { exact: true })).toHaveCount(1);
  await Promise.all([first.context.close(), second.context.close()]);
});
