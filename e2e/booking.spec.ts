import { test, expect } from "@playwright/test";

// Full happy path: sign in -> search -> hotel -> reserve -> pay (dev) -> confirmed.
test("a signed-in user can search, book, and see confirmation", async ({ page }) => {
  // --- Sign in with the seeded demo account ---
  await page.goto("/signin");
  await page.getByLabel("Email").fill("demo@wanderlust.test");
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/trips");

  // --- Search hotels in a known destination ---
  await page.goto("/hotels?destination=santorini");
  await expect(page.getByRole("heading", { name: /Hotels in Santorini/i })).toBeVisible();

  // Open the first hotel.
  await page.getByRole("link", { name: "View rooms" }).first().click();
  await page.waitForURL("**/hotels/**");
  await expect(page.getByRole("heading", { name: "Choose your room" })).toBeVisible();

  // Reserve the first available room.
  await page.getByRole("link", { name: "Reserve" }).first().click();
  await page.waitForURL("**/booking**");

  // --- Guest details (email/name prefilled from session) ---
  await expect(page.getByRole("heading", { name: "Guest details" })).toBeVisible();
  await page.getByLabel("First name").fill("Demo");
  await page.getByLabel("Last name").fill("Traveler");
  await page.getByRole("button", { name: "Continue to payment" }).click();

  // --- Payment (dev mode: simulated) ---
  await expect(page.getByRole("heading", { name: "Payment" })).toBeVisible();
  await page.getByRole("button", { name: /Pay .* \(simulated\)/ }).click();

  // --- Confirmation ---
  await page.waitForURL(/\/trips\/WL-/);
  await expect(page.getByText("You're booked!")).toBeVisible();
  await expect(page.getByText("Confirmed")).toBeVisible();
});
