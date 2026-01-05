import { test, expect } from "@playwright/test";

test.describe("Theme System", () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to start fresh
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test("should load with default peaceful theme", async ({ page }) => {
    await page.goto("/discover");

    // Check that peaceful theme variables are applied
    const root = page.locator("html");
    await expect(root).toHaveAttribute("data-theme", "peaceful");
    await expect(root).toHaveAttribute("data-variant", "light");
  });

  test("should toggle between light and dark mode", async ({ page }) => {
    await page.goto("/discover");

    // Click theme toggle
    const themeToggle = page.getByTestId("theme-toggle");
    await expect(themeToggle).toBeVisible();

    // Toggle to dark
    await themeToggle.click();

    const root = page.locator("html");
    await expect(root).toHaveAttribute("data-variant", "dark");
    await expect(root).toHaveClass(/dark/);

    // Toggle back to light
    await themeToggle.click();
    await expect(root).toHaveAttribute("data-variant", "light");
    await expect(root).not.toHaveClass(/dark/);
  });

  test("should open settings and change theme", async ({ page }) => {
    await page.goto("/discover");

    // Open settings modal
    await page.getByTestId("settings-button").click();

    // Check that theme selector is visible
    await expect(page.getByTestId("theme-default")).toBeVisible();
    await expect(page.getByTestId("theme-peaceful")).toBeVisible();
    await expect(page.getByTestId("theme-ocean")).toBeVisible();
    await expect(page.getByTestId("theme-forest")).toBeVisible();

    // Select ocean theme
    await page.getByTestId("theme-ocean").click();

    const root = page.locator("html");
    await expect(root).toHaveAttribute("data-theme", "ocean");
  });

  test("should change variant in settings modal", async ({ page }) => {
    await page.goto("/discover");

    // Open settings modal
    await page.getByTestId("settings-button").click();

    // Click dark variant
    await page.getByTestId("variant-dark").click();

    const root = page.locator("html");
    await expect(root).toHaveAttribute("data-variant", "dark");
    await expect(root).toHaveClass(/dark/);

    // Click light variant
    await page.getByTestId("variant-light").click();
    await expect(root).toHaveAttribute("data-variant", "light");
  });

  test("should persist theme choice across page reloads", async ({ page }) => {
    await page.goto("/discover");

    // Open settings and select forest theme + dark mode
    await page.getByTestId("settings-button").click();
    await page.getByTestId("theme-forest").click();
    await page.getByTestId("variant-dark").click();

    // Close modal and reload
    await page.keyboard.press("Escape");
    await page.reload();

    // Verify theme persisted
    const root = page.locator("html");
    await expect(root).toHaveAttribute("data-theme", "forest");
    await expect(root).toHaveAttribute("data-variant", "dark");
  });

  test("should apply theme colors correctly", async ({ page }) => {
    await page.goto("/discover");

    // Get computed background color
    const body = page.locator("body");

    // Peaceful light has a cream background
    const bgColor = await body.evaluate((el) =>
      getComputedStyle(el).backgroundColor
    );

    // Check it's not white (peaceful theme uses cream)
    expect(bgColor).not.toBe("rgb(255, 255, 255)");
  });

  test("all four themes should be selectable", async ({ page }) => {
    await page.goto("/discover");

    const themes = ["default", "peaceful", "ocean", "forest"];
    const root = page.locator("html");

    // Open settings once and cycle through themes
    await page.getByTestId("settings-button").click();

    for (const theme of themes) {
      await page.getByTestId(`theme-${theme}`).click();
      await expect(root).toHaveAttribute("data-theme", theme);
    }

    // Close modal at the end
    await page.keyboard.press("Escape");
  });
});
