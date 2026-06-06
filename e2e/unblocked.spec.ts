import { test, expect } from "@playwright/test";

test.describe("AetherPlay Unblocked Platform E2E Tests", () => {
  // Listen for request leaks to blocked domains
  test.beforeEach(async ({ page }) => {
    page.on("request", (request) => {
      const url = request.url();
      if (
        url.includes("twoplayergames.org") || 
        url.includes("files.twoplayergames.org") || 
        url.includes("images.twoplayergames.org")
      ) {
        // We only allow our backend to make requests, not the client!
        // So the client URL must never point to these domains directly.
        throw new Error(`CRITICAL LEAK DETECTED: Direct connection leak to blocked domain: ${url}`);
      }
    });
  });

  test("should load homepage and display game grid", async ({ page }) => {
    // 1. Load Homepage
    await page.goto("/");
    await expect(page).toHaveTitle(/AetherPlay | Unblocked Two Player Games/);

    // Wait for the loading spinner to disappear and games grid to load
    await page.waitForSelector(".game-grid");

    // Assert that we have game cards loaded
    const cardsCount = await page.locator(".game-card").count();
    expect(cardsCount).toBeGreaterThan(0);

    // Check if header elements exist
    await expect(page.locator("text=AetherPlay")).toBeVisible();
  });

  test("should filter games by category", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector(".game-grid");

    // Click on the Sports category button
    await page.click("text=Sports");
    
    // Wait for loading to finish
    await page.waitForSelector(".game-grid");

    // Assert that the section title changes
    await expect(page.locator(".section-title")).toContainText("Sports Games");

    // Ensure we have cards after filter
    const cardsCount = await page.locator(".game-card").count();
    expect(cardsCount).toBeGreaterThan(0);
  });

  test("should search for games and show results", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector(".game-grid");

    // Type query in search bar
    const searchInput = page.locator(".search-input");
    await searchInput.fill("random");
    await searchInput.press("Enter");

    // Wait for the search title to update and results to render
    await page.waitForSelector(".game-grid");
    await expect(page.locator(".section-title")).toContainText('Search Results for "random"');

    // Ensure results contain "Random" games (like Basket Random, Soccer Random)
    const cards = page.locator(".game-card");
    const firstTitle = await cards.first().locator(".game-card-title").textContent();
    expect(firstTitle?.toLowerCase()).toContain("random");
  });

  test("should play a game and verify proxy embedding with no leaks", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector(".game-grid");

    // Find the first game card and click it to go to play page
    const firstCard = page.locator(".game-card").first();
    const gameTitle = await firstCard.locator(".game-card-title").textContent();
    
    await firstCard.click();

    // Verify play page url and layout loaded
    await expect(page).toHaveURL(/\/play\//);
    await expect(page.locator(".sidebar-game-title")).toHaveText(gameTitle || "", { ignoreCase: true });

    // Assert that the iframe is embedded with the local proxy frame source
    const iframe = page.locator(".game-iframe");
    await expect(iframe).toBeVisible();
    
    const iframeSrc = await iframe.getAttribute("src");
    expect(iframeSrc).toContain("/api/gameframe/");

    // Fullscreen and favorite button should exist
    await expect(page.locator("#fullscreen-btn-id")).toBeVisible();
    await expect(page.locator("#favorite-btn-id")).toBeVisible();
  });

  test("should add a game to Favorites (Game Box) and retrieve it", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector(".game-grid");

    // Get the title of the first game
    const firstCard = page.locator(".game-card").first();
    const gameTitle = await firstCard.locator(".game-card-title").textContent();

    // Click the heart icon on the first game card
    const favButton = firstCard.locator(".favorite-btn");
    await favButton.click();

    // Go to My Game Box (Favorites) view
    await page.click("text=My Game Box");

    // Verify the favorite game is now visible in the grid
    await page.waitForSelector(".game-grid");
    await expect(page.locator(".section-title")).toHaveText("My Game Box");
    
    const favTitle = await page.locator(".game-card-title").textContent();
    expect(favTitle).toBe(gameTitle);
  });
});
