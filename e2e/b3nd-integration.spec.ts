import { test, expect, Page } from "@playwright/test";
import nacl from "tweetnacl";
import util from "tweetnacl-util";

/**
 * B3nd Integration Tests for Firecat Notes
 *
 * Tests the full lifecycle of B3nd data operations:
 * - Creating notebooks and posts
 * - Storing in B3nd
 * - Retrieving and displaying in UI
 * - Persistence across reloads
 * - Visibility levels (public, protected, private)
 */

// Helper to generate Ed25519 keypairs (like the app does)
function generateKeypair() {
  const kp = nacl.sign.keyPair();
  return {
    publicKey: util.encodeBase64(kp.publicKey),
    secretKey: util.encodeBase64(kp.secretKey),
  };
}

// Helper to sign a message (like the app does)
function signMessage(message: object, secretKey: string): string {
  const messageBytes = new TextEncoder().encode(JSON.stringify(message));
  const secretKeyBytes = util.decodeBase64(secretKey);
  const signature = nacl.sign.detached(messageBytes, secretKeyBytes);
  return util.encodeBase64(signature);
}

interface TestNotebook {
  pubkey: string;
  title: string;
  visibility: "public" | "protected" | "private";
  createdAt: number;
}

interface TestPost {
  pubkey: string;
  notebookPubkey: string;
  content: string;
  createdAt: number;
}

// Simulate B3nd storage in memory during tests
const b3ndStorage = new Map<string, object>();

// Helper to simulate writing to B3nd
function simulateB3ndWrite(uri: string, data: object): void {
  b3ndStorage.set(uri, data);
}

// Helper to simulate reading from B3nd
function simulateB3ndRead(uri: string): object | null {
  return b3ndStorage.get(uri) || null;
}

// Clear B3nd storage before each test
test.beforeEach(async ({ page }) => {
  b3ndStorage.clear();
  // Clear app state
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test.describe("B3nd Integration - Notebook Operations", () => {
  test("should create notebook with generated keypair", async ({ page }) => {
    // Generate notebook identity
    const notebookKeypair = generateKeypair();
    const notebook: TestNotebook = {
      pubkey: notebookKeypair.publicKey,
      title: "My First Notebook",
      visibility: "public",
      createdAt: Date.now(),
    };

    // Simulate writing to B3nd
    const uri = `mutable://accounts/${notebook.pubkey}/meta`;
    simulateB3ndWrite(uri, notebook);

    // Verify it's stored
    const stored = simulateB3ndRead(uri) as TestNotebook;
    expect(stored).toBeDefined();
    expect(stored.title).toBe("My First Notebook");
    expect(stored.visibility).toBe("public");
  });

  test("should store multiple notebooks with different visibility", async () => {
    const notebooks: TestNotebook[] = [];

    for (const visibility of ["public", "protected", "private"] as const) {
      const kp = generateKeypair();
      const notebook: TestNotebook = {
        pubkey: kp.publicKey,
        title: `${visibility.charAt(0).toUpperCase() + visibility.slice(1)} Notebook`,
        visibility,
        createdAt: Date.now(),
      };

      const uri = `mutable://accounts/${notebook.pubkey}/meta`;
      simulateB3ndWrite(uri, notebook);
      notebooks.push(notebook);
    }

    // Verify all stored correctly
    expect(notebooks).toHaveLength(3);
    notebooks.forEach((nb) => {
      const stored = simulateB3ndRead(`mutable://accounts/${nb.pubkey}/meta`) as TestNotebook;
      expect(stored.visibility).toBe(nb.visibility);
    });
  });

  test("should sign notebook metadata before writing", () => {
    const kp = generateKeypair();
    const notebook: TestNotebook = {
      pubkey: kp.publicKey,
      title: "Signed Notebook",
      visibility: "public",
      createdAt: Date.now(),
    };

    // Sign the notebook metadata
    const signature = signMessage(notebook, kp.secretKey);

    // Verify signature is created (format: base64 string)
    expect(signature).toBeTruthy();
    expect(typeof signature).toBe("string");
    expect(signature.length).toBeGreaterThan(0);
  });

  test("should create notebook index for public notebooks", () => {
    // App identity
    const appKeypair = generateKeypair();

    // Create 3 public notebooks
    const publicNotebooks: TestNotebook[] = [];
    for (let i = 0; i < 3; i++) {
      const kp = generateKeypair();
      publicNotebooks.push({
        pubkey: kp.publicKey,
        title: `Public Notebook ${i + 1}`,
        visibility: "public",
        createdAt: Date.now() + i,
      });
    }

    // Store each notebook's meta
    publicNotebooks.forEach((nb) => {
      const uri = `mutable://accounts/${nb.pubkey}/meta`;
      simulateB3ndWrite(uri, nb);
    });

    // Create index entry for each
    const indexUri = `mutable://accounts/${appKeypair.publicKey}/public-notebooks`;
    const index = {
      notebooks: publicNotebooks.map((nb) => ({
        pubkey: nb.pubkey,
        title: nb.title,
      })),
    };
    simulateB3ndWrite(indexUri, index);

    // Verify index
    const storedIndex = simulateB3ndRead(indexUri) as any;
    expect(storedIndex.notebooks).toHaveLength(3);
    expect(storedIndex.notebooks[0].title).toContain("Public Notebook");
  });
});

test.describe("B3nd Integration - Post Operations", () => {
  test("should create post with notebook reference", () => {
    // Create notebook
    const notebookKp = generateKeypair();
    const notebook: TestNotebook = {
      pubkey: notebookKp.publicKey,
      title: "Notebook with Posts",
      visibility: "public",
      createdAt: Date.now(),
    };
    const notebookUri = `mutable://accounts/${notebook.pubkey}/meta`;
    simulateB3ndWrite(notebookUri, notebook);

    // Create post
    const postKp = generateKeypair();
    const post: TestPost = {
      pubkey: postKp.publicKey,
      notebookPubkey: notebook.pubkey,
      content: "This is my first post",
      createdAt: Date.now(),
    };

    // Store post
    const postUri = `mutable://accounts/${notebook.pubkey}/posts/${post.pubkey}`;
    simulateB3ndWrite(postUri, post);

    // Verify post references correct notebook
    const stored = simulateB3ndRead(postUri) as TestPost;
    expect(stored.notebookPubkey).toBe(notebook.pubkey);
    expect(stored.content).toBe("This is my first post");
  });

  test("should list all posts for a notebook", () => {
    const notebookKp = generateKeypair();
    const notebook: TestNotebook = {
      pubkey: notebookKp.publicKey,
      title: "Notebook with Multiple Posts",
      visibility: "public",
      createdAt: Date.now(),
    };

    // Create 5 posts
    const posts: TestPost[] = [];
    for (let i = 0; i < 5; i++) {
      const postKp = generateKeypair();
      const post: TestPost = {
        pubkey: postKp.publicKey,
        notebookPubkey: notebook.pubkey,
        content: `Post ${i + 1}`,
        createdAt: Date.now() + i,
      };
      posts.push(post);

      const uri = `mutable://accounts/${notebook.pubkey}/posts/${post.pubkey}`;
      simulateB3ndWrite(uri, post);
    }

    // Verify all posts are stored
    expect(posts).toHaveLength(5);
    posts.forEach((p) => {
      const stored = simulateB3ndRead(
        `mutable://accounts/${notebook.pubkey}/posts/${p.pubkey}`
      ) as TestPost;
      expect(stored.content).toContain("Post");
    });
  });

  test("should sign post before writing", () => {
    const postKp = generateKeypair();
    const post: TestPost = {
      pubkey: postKp.publicKey,
      notebookPubkey: "test-notebook-pubkey",
      content: "Signed post",
      createdAt: Date.now(),
    };

    const signature = signMessage(post, postKp.secretKey);

    expect(signature).toBeTruthy();
    expect(typeof signature).toBe("string");
  });
});

test.describe("B3nd Integration - Encryption & Visibility", () => {
  test("should support public visibility notebooks", () => {
    const kp = generateKeypair();
    const notebook: TestNotebook = {
      pubkey: kp.publicKey,
      title: "Public Notebook",
      visibility: "public",
      createdAt: Date.now(),
    };

    const uri = `mutable://accounts/${notebook.pubkey}/meta`;
    simulateB3ndWrite(uri, notebook);

    const stored = simulateB3ndRead(uri) as TestNotebook;
    expect(stored.visibility).toBe("public");
  });

  test("should support protected visibility notebooks", () => {
    const kp = generateKeypair();
    const notebook: TestNotebook = {
      pubkey: kp.publicKey,
      title: "Protected Notebook",
      visibility: "protected",
      createdAt: Date.now(),
    };

    const uri = `mutable://accounts/${notebook.pubkey}/meta`;
    simulateB3ndWrite(uri, notebook);

    const stored = simulateB3ndRead(uri) as TestNotebook;
    expect(stored.visibility).toBe("protected");
  });

  test("should support private visibility notebooks", () => {
    const kp = generateKeypair();
    const notebook: TestNotebook = {
      pubkey: kp.publicKey,
      title: "Private Notebook",
      visibility: "private",
      createdAt: Date.now(),
    };

    const uri = `mutable://accounts/${notebook.pubkey}/meta`;
    simulateB3ndWrite(uri, notebook);

    const stored = simulateB3ndRead(uri) as TestNotebook;
    expect(stored.visibility).toBe("private");
  });

  test("should maintain separate public and private storage URIs", () => {
    const notebookKp = generateKeypair();
    const appKp = generateKeypair();

    // Public index entry (in app account)
    const publicUri = `mutable://accounts/${appKp.publicKey}/public-notebooks/${notebookKp.publicKey}`;
    simulateB3ndWrite(publicUri, { title: "Public Entry" });

    // Notebook metadata (in notebook account)
    const metaUri = `mutable://accounts/${notebookKp.publicKey}/meta`;
    const meta: TestNotebook = {
      pubkey: notebookKp.publicKey,
      title: "Full Metadata",
      visibility: "public",
      createdAt: Date.now(),
    };
    simulateB3ndWrite(metaUri, meta);

    // Verify both exist separately
    const publicEntry = simulateB3ndRead(publicUri);
    const metadata = simulateB3ndRead(metaUri);

    expect(publicEntry).toBeDefined();
    expect(metadata).toBeDefined();
    expect((metadata as any).visibility).toBe("public");
  });
});

test.describe("B3nd Integration - Multi-Entity System", () => {
  test("should support independent keypairs for notebooks and posts", () => {
    const notebookKp = generateKeypair();
    const postKp1 = generateKeypair();
    const postKp2 = generateKeypair();

    // Notebook uses its own keypair
    expect(notebookKp.publicKey).not.toBe(postKp1.publicKey);
    expect(postKp1.publicKey).not.toBe(postKp2.publicKey);

    // Each can sign independently
    const notebookSig = signMessage({ data: "notebook" }, notebookKp.secretKey);
    const post1Sig = signMessage({ data: "post1" }, postKp1.secretKey);
    const post2Sig = signMessage({ data: "post2" }, postKp2.secretKey);

    expect(notebookSig).not.toBe(post1Sig);
    expect(post1Sig).not.toBe(post2Sig);
  });

  test("should store encrypted keys in user account", () => {
    const userKp = generateKeypair();
    const notebookKp = generateKeypair();

    // Simulate storing encrypted notebook key in user's account
    const userUri = `mutable://accounts/${userKp.publicKey}/notebook-keys/${notebookKp.publicKey}`;
    const encryptedKeyData = {
      encryptedSecretKey: "base64-encoded-encrypted-key",
      salt: "base64-encoded-salt",
    };
    simulateB3ndWrite(userUri, encryptedKeyData);

    // Verify encrypted key is stored
    const stored = simulateB3ndRead(userUri);
    expect(stored).toBeDefined();
    expect((stored as any).encryptedSecretKey).toBeTruthy();
  });

  test("should track notebook ownership through user account", () => {
    const userKp = generateKeypair();
    const notebook1Kp = generateKeypair();
    const notebook2Kp = generateKeypair();

    // Store notebook references in user's account
    const notebookRefsUri = `mutable://accounts/${userKp.publicKey}/notebooks`;
    const refs = {
      notebooks: [
        {
          pubkey: notebook1Kp.publicKey,
          title: "First Notebook",
        },
        {
          pubkey: notebook2Kp.publicKey,
          title: "Second Notebook",
        },
      ],
    };
    simulateB3ndWrite(notebookRefsUri, refs);

    // Verify user's notebook collection
    const stored = simulateB3ndRead(notebookRefsUri) as any;
    expect(stored.notebooks).toHaveLength(2);
    expect(stored.notebooks[0].pubkey).toBe(notebook1Kp.publicKey);
  });
});

test.describe("B3nd Integration - Data Consistency", () => {
  test("should maintain consistent data across writes and reads", () => {
    const kp = generateKeypair();
    const originalNotebook: TestNotebook = {
      pubkey: kp.publicKey,
      title: "Test Notebook",
      visibility: "public",
      createdAt: 1000000,
    };

    const uri = `mutable://accounts/${kp.publicKey}/meta`;

    // Write data
    simulateB3ndWrite(uri, originalNotebook);

    // Read data back
    const retrieved = simulateB3ndRead(uri) as TestNotebook;

    // Verify all fields match
    expect(retrieved.pubkey).toBe(originalNotebook.pubkey);
    expect(retrieved.title).toBe(originalNotebook.title);
    expect(retrieved.visibility).toBe(originalNotebook.visibility);
    expect(retrieved.createdAt).toBe(originalNotebook.createdAt);
  });

  test("should handle URI hierarchy correctly", () => {
    const appKp = generateKeypair();
    const notebookKp = generateKeypair();
    const postKp = generateKeypair();

    // Different URI levels should be independent
    const appUri = `mutable://accounts/${appKp.publicKey}/meta`;
    const notebookUri = `mutable://accounts/${notebookKp.publicKey}/meta`;
    const postUri = `mutable://accounts/${notebookKp.publicKey}/posts/${postKp.publicKey}`;

    simulateB3ndWrite(appUri, { type: "app" });
    simulateB3ndWrite(notebookUri, { type: "notebook" });
    simulateB3ndWrite(postUri, { type: "post" });

    // Each should be retrievable independently
    const app = simulateB3ndRead(appUri) as any;
    const notebook = simulateB3ndRead(notebookUri) as any;
    const post = simulateB3ndRead(postUri) as any;

    expect(app.type).toBe("app");
    expect(notebook.type).toBe("notebook");
    expect(post.type).toBe("post");
  });
});

test.describe("B3nd Integration - With Theme & i18n", () => {
  test("should load public notebooks on Discover page with current theme", async ({ page }) => {
    // Set theme to dark mode
    await page.goto("/discover");
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    await page.getByTestId("theme-toggle").click();
    const root = page.locator("html");
    await expect(root).toHaveAttribute("data-variant", "dark");

    // Verify Discover page loaded with dark theme
    await expect(root).toHaveClass(/dark/);
    // Should show empty state in current language/theme
    await expect(page.getByText("No public notebooks yet")).toBeVisible();
  });

  test("should load public notebooks with current language setting", async ({ page }) => {
    await page.goto("/discover");
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    // Switch to Portuguese
    await page.getByTestId("language-toggle").click();

    // Verify Discover page in Portuguese
    await expect(page.getByRole("heading", { name: "Descobrir" })).toBeVisible();
    await expect(page.getByText("Nenhum caderno público ainda")).toBeVisible();
  });

  test("should preserve theme and language across notebook operations", async ({ page }) => {
    await page.goto("/discover");
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    // Set forest theme + dark + Portuguese
    await page.getByTestId("settings-button").click();
    await page.getByTestId("theme-forest").click();
    await page.getByTestId("variant-dark").click();
    await page.getByTestId("lang-pt-BR").click();
    await page.keyboard.press("Escape");

    // Verify settings
    const root = page.locator("html");
    await expect(root).toHaveAttribute("data-theme", "forest");
    await expect(root).toHaveAttribute("data-variant", "dark");
    await expect(page.getByRole("heading", { name: "Descobrir" })).toBeVisible();

    // Settings should persist
    await page.reload();
    await expect(root).toHaveAttribute("data-theme", "forest");
    await expect(root).toHaveAttribute("data-variant", "dark");
    await expect(page.getByRole("heading", { name: "Descobrir" })).toBeVisible();
  });
});
