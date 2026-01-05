import { test, expect } from "@playwright/test";

test.describe("Internationalization (i18n)", () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to start fresh
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test("should load with English by default", async ({ page }) => {
    await page.goto("/discover");

    // Check English text is present (use heading for specificity)
    await expect(page.getByRole("heading", { name: "Discover" })).toBeVisible();
    await expect(page.getByText("Explore public notebooks from the community")).toBeVisible();
  });

  test("should switch to Portuguese (Brazil)", async ({ page }) => {
    await page.goto("/discover");

    // Open settings
    await page.getByTestId("settings-button").click();

    // Click Portuguese option
    await page.getByTestId("lang-pt-BR").click();

    // Close settings
    await page.keyboard.press("Escape");

    // Wait for translation to apply
    await page.waitForTimeout(100);

    // Check Portuguese text is present (use heading for specificity)
    await expect(page.getByRole("heading", { name: "Descobrir" })).toBeVisible();
    await expect(page.getByText("Explore cadernos públicos da comunidade")).toBeVisible();
  });

  test("should toggle language via navbar toggle", async ({ page }) => {
    await page.goto("/discover");

    // Initial: English (check heading)
    await expect(page.getByRole("heading", { name: "Discover" })).toBeVisible();

    // Click language toggle to switch to Portuguese
    await page.getByTestId("language-toggle").click();

    // Should now show Portuguese
    await expect(page.getByRole("heading", { name: "Descobrir" })).toBeVisible();

    // Click again to switch back to English
    await page.getByTestId("language-toggle").click();

    // Should now show English again
    await expect(page.getByRole("heading", { name: "Discover" })).toBeVisible();
  });

  test("should persist language choice across reloads", async ({ page }) => {
    await page.goto("/discover");

    // Switch to Portuguese
    await page.getByTestId("settings-button").click();
    await page.getByTestId("lang-pt-BR").click();
    await page.keyboard.press("Escape");

    // Reload page
    await page.reload();

    // Portuguese should still be active
    await expect(page.getByRole("heading", { name: "Descobrir" })).toBeVisible();
  });

  test("should translate navigation items", async ({ page }) => {
    await page.goto("/discover");

    // English navigation - check link in nav
    const discoverLink = page.getByRole("link", { name: "Discover" });
    await expect(discoverLink).toBeVisible();
    await expect(page.getByRole("button", { name: "Login" })).toBeVisible();

    // Switch to Portuguese
    await page.getByTestId("language-toggle").click();

    // Portuguese navigation
    await expect(page.getByRole("link", { name: "Descobrir" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Entrar" })).toBeVisible();
  });

  test("should translate page titles correctly", async ({ page }) => {
    // Start in English
    await page.goto("/discover");

    // English title
    await expect(page.getByRole("heading", { name: "Discover" })).toBeVisible();

    // Switch to Portuguese
    await page.getByTestId("language-toggle").click();

    // Portuguese title
    await expect(page.getByRole("heading", { name: "Descobrir" })).toBeVisible();
  });

  test("should show correct language indicator in toggle", async ({ page }) => {
    await page.goto("/discover");

    const toggle = page.getByTestId("language-toggle");

    // Should show EN initially
    await expect(toggle).toContainText("EN");

    // Click to switch to Portuguese
    await toggle.click();

    // Should show PT
    await expect(toggle).toContainText("PT");
  });

  test("should translate empty state messages", async ({ page }) => {
    await page.goto("/discover");

    // English empty state
    await expect(page.getByText("No public notebooks yet")).toBeVisible();
    await expect(page.getByText("Be the first to share your thoughts with the world!")).toBeVisible();

    // Switch to Portuguese
    await page.getByTestId("language-toggle").click();

    // Portuguese empty state
    await expect(page.getByText("Nenhum caderno público ainda")).toBeVisible();
    await expect(page.getByText("Seja o primeiro a compartilhar seus pensamentos com o mundo!")).toBeVisible();
  });
});

test.describe("Theme and i18n Integration", () => {
  test("should maintain both theme and language settings", async ({ page }) => {
    await page.goto("/discover");
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    // Set forest theme + dark mode + Portuguese
    await page.getByTestId("settings-button").click();
    await page.getByTestId("theme-forest").click();
    await page.getByTestId("variant-dark").click();
    await page.getByTestId("lang-pt-BR").click();
    await page.keyboard.press("Escape");

    // Verify all settings
    const root = page.locator("html");
    await expect(root).toHaveAttribute("data-theme", "forest");
    await expect(root).toHaveAttribute("data-variant", "dark");
    await expect(page.getByRole("heading", { name: "Descobrir" })).toBeVisible();

    // Reload and verify persistence
    await page.reload();

    await expect(root).toHaveAttribute("data-theme", "forest");
    await expect(root).toHaveAttribute("data-variant", "dark");
    await expect(page.getByRole("heading", { name: "Descobrir" })).toBeVisible();
  });
});
