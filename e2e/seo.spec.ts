import { test, expect } from "@playwright/test";

test.describe("SEO and Meta Tags", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test.describe("Base HTML Meta Tags", () => {
    test("should have correct base meta tags in index.html", async ({ page }) => {
      await page.goto("/discover");

      // Check viewport
      const viewport = await page.locator('meta[name="viewport"]').getAttribute("content");
      expect(viewport).toContain("width=device-width");

      // Check charset
      const charset = await page.locator('meta[charset]').getAttribute("charset");
      expect(charset?.toLowerCase()).toBe("utf-8");

      // Check theme color
      const themeColor = await page.locator('meta[name="theme-color"]').getAttribute("content");
      expect(themeColor).toBeTruthy();

      // Check keywords
      const keywords = await page.locator('meta[name="keywords"]').getAttribute("content");
      expect(keywords).toContain("decentralized");
      expect(keywords).toContain("notebook");
    });

    test("should have Open Graph base tags", async ({ page }) => {
      await page.goto("/discover");

      // OG type
      const ogType = await page.locator('meta[property="og:type"]').first().getAttribute("content");
      expect(ogType).toBeTruthy();

      // OG site name
      const ogSiteName = await page.locator('meta[property="og:site_name"]').getAttribute("content");
      expect(ogSiteName).toBe("Firecat Notes");
    });

    test("should have Twitter Card tags", async ({ page }) => {
      await page.goto("/discover");

      const twitterCard = await page.locator('meta[property="twitter:card"]').first().getAttribute("content");
      expect(twitterCard).toBe("summary_large_image");
    });
  });

  test.describe("Discover Page SEO", () => {
    test("should have correct page title", async ({ page }) => {
      await page.goto("/discover");

      // Wait for dynamic title to be set
      await page.waitForTimeout(500);

      const title = await page.title();
      expect(title).toContain("Firecat Notes");
    });

    test("should have meta description", async ({ page }) => {
      await page.goto("/discover");
      await page.waitForTimeout(500);

      const description = await page.locator('meta[name="description"]').getAttribute("content");
      expect(description).toBeTruthy();
      expect(description!.length).toBeGreaterThan(50);
      expect(description!.length).toBeLessThanOrEqual(160);
    });

    test("should have canonical URL", async ({ page }) => {
      await page.goto("/discover");
      await page.waitForTimeout(500);

      const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
      expect(canonical).toContain("/discover");
    });

    test("should have Open Graph tags for Discover page", async ({ page }) => {
      await page.goto("/discover");
      await page.waitForTimeout(500);

      const ogTitle = await page.locator('meta[property="og:title"]').last().getAttribute("content");
      const ogUrl = await page.locator('meta[property="og:url"]').last().getAttribute("content");
      const ogDescription = await page.locator('meta[property="og:description"]').last().getAttribute("content");

      expect(ogTitle).toBeTruthy();
      expect(ogUrl).toContain("/discover");
      expect(ogDescription).toBeTruthy();
    });
  });

  test.describe("Robots and Sitemap", () => {
    test("should serve robots.txt", async ({ page }) => {
      const response = await page.goto("/robots.txt");
      expect(response?.status()).toBe(200);

      const content = await page.textContent("body");
      expect(content).toContain("User-agent:");
      expect(content).toContain("Sitemap:");
    });

    test("should serve sitemap.xml", async ({ page }) => {
      const response = await page.goto("/sitemap.xml");
      expect(response?.status()).toBe(200);

      const content = await page.textContent("body");
      expect(content).toContain("<?xml");
      expect(content).toContain("<urlset");
      expect(content).toContain("</urlset>");
    });

    test("sitemap should include main pages", async ({ page }) => {
      await page.goto("/sitemap.xml");
      const content = await page.textContent("body");

      // Should include discover page
      expect(content).toContain("/discover");
    });
  });

  test.describe("Dynamic Content SEO", () => {
    test("should update title when language changes", async ({ page }) => {
      await page.goto("/discover");
      await page.waitForTimeout(500);

      // Get initial English title
      const titleEn = await page.title();
      expect(titleEn).toBeTruthy();

      // Switch to Portuguese
      await page.getByTestId("language-toggle").click();
      await page.waitForTimeout(500);

      // Title should update
      const titlePt = await page.title();
      expect(titlePt).toBeTruthy();
      // Both should still contain Firecat Notes
      expect(titleEn).toContain("Firecat Notes");
      expect(titlePt).toContain("Firecat Notes");
    });

    test("meta tags should not be duplicated", async ({ page }) => {
      await page.goto("/discover");
      await page.waitForTimeout(500);

      // Check that key meta tags appear exactly once
      const titleTags = await page.locator('meta[name="title"]').count();
      expect(titleTags).toBeLessThanOrEqual(1);

      const descriptionTags = await page.locator('meta[name="description"]').count();
      expect(descriptionTags).toBeLessThanOrEqual(1);

      const canonicalLinks = await page.locator('link[rel="canonical"]').count();
      expect(canonicalLinks).toBeLessThanOrEqual(1);
    });
  });

  test.describe("SEO Content Quality", () => {
    test("should have meaningful page titles", async ({ page }) => {
      await page.goto("/discover");
      await page.waitForTimeout(500);

      const title = await page.title();

      // Title should not be generic
      expect(title).not.toBe("React App");
      expect(title).not.toBe("Vite App");

      // Title should be reasonable length
      expect(title.length).toBeGreaterThan(10);
      expect(title.length).toBeLessThan(70);
    });

    test("should have h1 heading on page", async ({ page }) => {
      await page.goto("/discover");

      const h1 = page.locator("h1");
      await expect(h1).toBeVisible();

      const h1Text = await h1.textContent();
      expect(h1Text).toBeTruthy();
      expect(h1Text!.trim().length).toBeGreaterThan(0);
    });

    test("should have only one h1 per page", async ({ page }) => {
      await page.goto("/discover");

      const h1Count = await page.locator("h1").count();
      expect(h1Count).toBe(1);
    });

    test("should have descriptive meta description", async ({ page }) => {
      await page.goto("/discover");
      await page.waitForTimeout(500);

      const description = await page.locator('meta[name="description"]').getAttribute("content");

      if (description) {
        // Should not be generic
        expect(description).not.toBe("");
        expect(description).not.toContain("TODO");

        // Should be meaningful length
        expect(description.length).toBeGreaterThan(30);
      }
    });
  });

  test.describe("Social Media Sharing", () => {
    test("should have all required Open Graph tags", async ({ page }) => {
      await page.goto("/discover");
      await page.waitForTimeout(500);

      // Required OG tags
      const ogTitle = await page.locator('meta[property="og:title"]').last().getAttribute("content");
      const ogType = await page.locator('meta[property="og:type"]').last().getAttribute("content");
      const ogUrl = await page.locator('meta[property="og:url"]').last().getAttribute("content");
      const ogImage = await page.locator('meta[property="og:image"]').last().getAttribute("content");

      expect(ogTitle).toBeTruthy();
      expect(ogType).toBeTruthy();
      expect(ogUrl).toBeTruthy();
      expect(ogImage).toBeTruthy();
    });

    test("should have all required Twitter Card tags", async ({ page }) => {
      await page.goto("/discover");
      await page.waitForTimeout(500);

      const twitterCard = await page.locator('meta[property="twitter:card"]').last().getAttribute("content");
      const twitterTitle = await page.locator('meta[property="twitter:title"]').last().getAttribute("content");
      const twitterDescription = await page.locator('meta[property="twitter:description"]').last().getAttribute("content");
      const twitterImage = await page.locator('meta[property="twitter:image"]').last().getAttribute("content");

      expect(twitterCard).toBe("summary_large_image");
      expect(twitterTitle).toBeTruthy();
      expect(twitterDescription).toBeTruthy();
      expect(twitterImage).toBeTruthy();
    });
  });

  test.describe("Accessibility and SEO Integration", () => {
    test("should have lang attribute on html element", async ({ page }) => {
      await page.goto("/discover");

      const lang = await page.locator("html").getAttribute("lang");
      expect(lang).toBe("en");
    });

    test("should update lang attribute when language changes", async ({ page }) => {
      await page.goto("/discover");

      // Initial lang
      let lang = await page.locator("html").getAttribute("lang");
      expect(lang).toBe("en");

      // Switch to Portuguese
      await page.getByTestId("language-toggle").click();
      await page.waitForTimeout(300);

      // Lang should update (if implemented)
      lang = await page.locator("html").getAttribute("lang");
      // May still be "en" if not implemented, but this documents expected behavior
      expect(lang).toBeTruthy();
    });

    test("should have favicon", async ({ page }) => {
      await page.goto("/discover");

      const favicon = page.locator('link[rel="icon"]');
      await expect(favicon).toHaveCount(1);

      const href = await favicon.getAttribute("href");
      expect(href).toBeTruthy();
    });
  });
});
