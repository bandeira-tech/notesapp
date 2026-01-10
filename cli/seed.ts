#!/usr/bin/env tsx
/**
 * Seed script - generates test data for Firecat Notes
 * Creates multiple users, notebooks, and posts with diverse content
 */

// Load environment variables
import { config } from "dotenv";
config();

import { signup, login } from "./lib/b3nd-client.js";
import { createNotebook } from "./commands/create-notebook.js";
import { createPost } from "./commands/create-post.js";

// Test users configuration
const USERS = [
  { username: "alice", password: "alice-password-123", name: "Alice Chen" },
  { username: "bob", password: "bob-password-123", name: "Bob Martinez" },
  { username: "charlie", password: "charlie-password-123", name: "Charlie Taylor" },
  { username: "diana", password: "diana-password-123", name: "Diana Kumar" },
];

// Notebook templates with diverse subjects
const NOTEBOOKS = [
  {
    user: "alice",
    title: "Machine Learning Explorations",
    description: "Deep dives into neural networks, transformers, and AI research",
    posts: [
      "Just implemented a transformer from scratch. The attention mechanism is fascinating - it's like the model learns what to focus on!",
      "Reading 'Attention Is All You Need' for the 3rd time. Every read reveals new insights about the architecture.",
      "Experimenting with LoRA fine-tuning on Llama 3. Memory efficiency is incredible compared to full fine-tuning.",
      "Key insight: Layer normalization placement (pre vs post) significantly affects training stability in transformers.",
      "Built a simple autoencoder for anomaly detection. Surprisingly effective on time series data.",
    ],
  },
  {
    user: "alice",
    title: "Coffee & Code",
    description: "Daily musings about programming, productivity, and good coffee",
    posts: [
      "Morning ritual: V60 pour-over while reviewing yesterday's code. The slow process helps me think through problems.",
      "Switched to Obsidian for notes. The graph view is perfect for connecting scattered thoughts across projects.",
      "Hot take: Premature optimization is the root of all evil, but premature abstraction is worse.",
      "Finally set up proper logging in prod. Why did I wait so long? Debugging is 10x easier now.",
      "Weekend project: built a CLI tool in Rust. The type system caught so many bugs before runtime!",
    ],
  },
  {
    user: "bob",
    title: "Decentralized Systems Research",
    description: "Notes on distributed consensus, blockchain, and P2P protocols",
    posts: [
      "Byzantine fault tolerance is more nuanced than I thought. The assumptions matter hugely for practical systems.",
      "Comparing CRDTs vs OT for collaborative editing. CRDTs win on simplicity, OT on bandwidth efficiency.",
      "IPFS content addressing is elegant: hash as address means immutability by design. No need for versioning logic.",
      "Reading Satoshi's whitepaper again. The elegance of proof-of-work as a voting mechanism is underappreciated.",
      "DHT routing in Kademlia: XOR distance metric is genius. Why XOR? It satisfies the triangle inequality!",
    ],
  },
  {
    user: "bob",
    title: "Home Lab Adventures",
    description: "Self-hosting experiments, k8s mishaps, and server room tales",
    posts: [
      "Migrated my services to k3s. Much lighter than full k8s but still powerful enough for homelab needs.",
      "TIL: Always set resource limits in k8s. Learned this the hard way when OOMKiller took down the whole cluster.",
      "Set up Tailscale for remote access. WireGuard under the hood makes it fast and secure.",
      "Power bill after adding 3 more nodes: 📈 Maybe I should look into ARM-based servers...",
      "Automated backups with restic to B2. Sleep better knowing my data is safe and encrypted.",
    ],
  },
  {
    user: "charlie",
    title: "Photography Journal",
    description: "Thoughts on composition, light, and the art of seeing",
    posts: [
      "Golden hour at the coast. The way light interacts with water never gets old. Shot 200 frames, kept 3.",
      "Switched to shooting fully manual. Slows me down but makes me more intentional about each shot.",
      "Black and white photography forces you to see in shapes and textures rather than colors. Different mindset.",
      "Street photography ethics: always respect people's privacy. If they notice you and seem uncomfortable, delete it.",
      "Learned about the zone system from Ansel Adams. Pre-visualization is key - see the final image before pressing shutter.",
    ],
  },
  {
    user: "charlie",
    title: "Urban Exploration",
    description: "Discovering hidden gems in city architecture and culture",
    posts: [
      "Found an abandoned railway station today. The decay and graffiti tell stories of the city's evolution.",
      "Urban planning shapes behavior. Wide sidewalks and benches invite people to linger and socialize.",
      "The best cafes are tucked in narrow side streets. Mainstream locations optimize for throughput, not atmosphere.",
      "Night photography in the city: long exposures turn car lights into rivers of color.",
      "Old industrial districts being gentrified. Mixed feelings - progress vs preserving character.",
    ],
  },
  {
    user: "diana",
    title: "Sustainable Living",
    description: "Practical steps toward a lower-impact lifestyle",
    posts: [
      "Month 3 of zero-waste: biggest challenge is finding package-free options. Second biggest: explaining it to friends.",
      "Started composting. It's amazing how much kitchen waste never reaches the landfill now.",
      "Repair culture > consumption culture. Fixed my old backpack instead of buying new. Works better than ever.",
      "Local farmers market has become my primary grocery source. Fresher food, less packaging, support local economy.",
      "Energy audit of my apartment: biggest savings from LED bulbs and fixing air leaks. Small changes, big impact.",
    ],
  },
  {
    user: "diana",
    title: "Philosophy & Ethics",
    description: "Reflections on how we should live and treat each other",
    posts: [
      "Re-reading Meditations by Marcus Aurelius. Stoicism's focus on what we can control is freeing in anxious times.",
      "The trolley problem isn't about the 'right' answer. It reveals how we think about moral responsibility.",
      "Effective altruism appeals to my engineering brain: maximize good per unit effort. But is everything measurable?",
      "Kant's categorical imperative: act only according to rules you'd want universalized. Simple but powerful test.",
      "Justice vs mercy: both are necessary. Pure justice without mercy is cold; pure mercy without justice enables harm.",
    ],
  },
];

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function ensureUser(username: string, password: string) {
  console.log(`\n👤 Setting up user: ${username}`);
  try {
    // Try login first
    await login(username, password);
    console.log(`  ✓ Logged in as ${username}`);
  } catch {
    // If login fails, signup
    try {
      await signup(username, password);
      console.log(`  ✓ Created new user ${username}`);
    } catch (error) {
      console.error(`  ✗ Failed to setup user ${username}:`, error);
      throw error;
    }
  }
}

async function seedData() {
  console.log("🌱 Starting seed script for Firecat Notes");
  console.log("=" .repeat(60));

  for (const notebookTemplate of NOTEBOOKS) {
    try {
      // Find user config
      const userConfig = USERS.find((u) => u.username === notebookTemplate.user);
      if (!userConfig) {
        console.error(`User ${notebookTemplate.user} not found in config`);
        continue;
      }

      // Ensure user exists and login
      await ensureUser(userConfig.username, userConfig.password);

      // Create notebook
      console.log(`\n📚 Creating notebook: "${notebookTemplate.title}"`);
      const { notebook, identity } = await createNotebook({
        title: notebookTemplate.title,
        description: notebookTemplate.description,
        visibility: "public",
      });

      // Create posts
      console.log(`\n📝 Creating ${notebookTemplate.posts.length} posts...`);
      for (let i = 0; i < notebookTemplate.posts.length; i++) {
        const content = notebookTemplate.posts[i];
        await createPost({
          notebookPubkey: notebook.pubkey,
          content,
        });

        // Small delay between posts to avoid rate limiting
        await delay(500);
      }

      console.log(`\n✅ Completed: ${notebookTemplate.title}`);
      console.log(`   ${notebookTemplate.posts.length} posts created`);

      // Delay between notebooks
      await delay(1000);
    } catch (error) {
      console.error(`\n❌ Error processing ${notebookTemplate.title}:`, error);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("🎉 Seed script complete!");
  console.log(`\nCreated:`);
  console.log(`  • ${USERS.length} users`);
  console.log(`  • ${NOTEBOOKS.length} notebooks`);
  console.log(`  • ${NOTEBOOKS.reduce((sum, n) => sum + n.posts.length, 0)} posts`);
  console.log(`\n👉 Visit the app to see the generated content!`);
}

// Run seed
seedData().catch((error) => {
  console.error("\n💥 Seed script failed:", error);
  process.exit(1);
});
