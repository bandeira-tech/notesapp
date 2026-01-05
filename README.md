# 🔥 Firecat Notes

A beautiful, decentralized notebook and microblogging application built on the B3nd/Firecat network. Share your thoughts, create notebooks, and connect with others in a trustworthy, decentralized way.

## ✨ Features

- **🔐 Decentralized Authentication** - Sign up and login using B3nd wallet
- **📓 Smart Notebooks** - Create notebooks with three visibility levels:
  - 🌍 **Public** - Discoverable by anyone
  - 🛡️ **Protected** - Password-protected access
  - 🔒 **Private** - Only you can access
- **📝 Microblogging** - Post thoughts, images, and updates in descending timeline
- **💬 Rich Reactions** - Like and comment with text, emoji, or images
- **🔗 Post Linking** - Reference and cross-post between notebooks
- **🌐 Public Discovery** - Explore public notebooks from the community
- **📱 Shareable Links** - Share individual posts with direct links
- **🎨 Beautiful Design** - Peaceful, customizable interface

## 🏗️ Architecture

### Technology Stack

- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite 7
- **Styling**: Tailwind CSS with custom peaceful theme
- **State Management**: Zustand with persistence
- **Data Fetching**: React Query (TanStack Query)
- **Routing**: React Router v7
- **Backend**: B3nd SDK (@bandeira-tech/b3nd-web)
- **Crypto**: TweetNaCl for encryption
- **Icons**: Lucide React

### B3nd URI Schema

```
Public notebooks:     mutable://open/notebooks/{notebookId}
Public posts:         mutable://open/notebooks/{notebookId}/posts/{postId}
Public reactions:     mutable://open/notebooks/{notebookId}/posts/{postId}/reactions/{reactionId}
Public index:         mutable://open/notebooks/index

User notebooks:       mutable://accounts/{pubkey}/notebooks/{notebookId}
User posts:           mutable://accounts/{pubkey}/notebooks/{notebookId}/posts/{postId}
User reactions:       mutable://accounts/{pubkey}/reactions/{reactionId}
User profile:         mutable://accounts/{pubkey}/profile
User notebook list:   mutable://accounts/{pubkey}/notebooks
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ or Bun
- B3nd nodes running (local or remote)
  - Data node on port 9942 (default)
  - Wallet node on port 9943 (default)

### Installation

```bash
# Install dependencies
npm install
# or
bun install
```

### ⚠️ Required Configuration

**The application will NOT start without proper configuration.**

1. **Copy the environment template:**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` with your B3nd node URLs:**

   For **local development**:
   ```bash
   VITE_B3ND_BACKEND=http://localhost:9942
   VITE_B3ND_WALLET=http://localhost:9943
   VITE_B3ND_APP=http://localhost:9944
   ```

   For **production builds**, add:
   ```bash
   VITE_FIRECAT_BACKEND=https://testnet-evergreen.fire.cat
   VITE_FIRECAT_WALLET=https://testnet-wallet.fire.cat
   VITE_FIRECAT_APP=https://testnet-app.fire.cat
   ```

3. **Start your B3nd nodes** (for local development):
   ```bash
   # Terminal 1
   b3nd-data-node start --port 9942

   # Terminal 2
   b3nd-wallet-node start --port 9943
   ```

**Why is this required?**
- Prevents accidental use of memory/mock clients
- Ensures explicit backend configuration
- Avoids silent failures with wrong endpoints

See `CONFIGURATION.md` for detailed setup instructions.

### Running Locally

```bash
# Start development server
npm run dev
# or
bun run dev
```

The app will be available at `http://localhost:5555`.

### Building for Production

```bash
# Build the application
npm run build
# or
bun run build

# Preview production build
npm run preview
# or
bun run preview
```

## 📖 Usage Guide

### Creating Your First Notebook

1. Sign up or log in using B3nd wallet
2. Click "New Notebook" on the home page
3. Choose a title, description, and cover image
4. Select visibility:
   - **Public**: Everyone can find and read
   - **Protected**: Requires password to view
   - **Private**: Only you can access
5. Click "Create Notebook"

### Posting Content

1. Open a notebook
2. Use the post form at the top of the timeline
3. Write your content
4. Optionally add images
5. Click "Post" to publish

### Reactions

- **Like**: Click the heart icon on any post
- **Comment**: Click the comment icon to open the reaction modal
- Add text, emoji, or images to your reactions

### Discovering Content

1. Navigate to the "Discover" page
2. Browse public notebooks from the community
3. Click on any notebook to view its timeline
4. React and engage with posts

### Sharing Posts

1. Click the share icon on any post
2. The link is copied to your clipboard
3. Share the link with anyone
4. They can view the post in context or standalone

## 🔒 Security & Privacy

- **Client-side Encryption**: Protected notebooks use PBKDF2 key derivation
- **Wallet Authentication**: Secure B3nd wallet-based auth
- **Decentralized Storage**: Data stored on Firecat network
- **No Central Server**: True peer-to-peer architecture

## 🎨 Design Philosophy

Firecat Notes embraces a **peaceful, focused** aesthetic:

- Soft, calming color palette (cream, sage, lavender, peach, sky)
- Clean typography with Playfair Display for headings
- Smooth animations and transitions
- Distraction-free writing environment
- Customizable themes (coming soon)

## 🛣️ Roadmap

- [ ] Dark mode support
- [ ] Rich text editor with markdown
- [ ] @mentions and notifications
- [ ] Hashtag support and search
- [ ] CLI tool for power users
- [ ] Browser extension for quick notes
- [ ] Export to PDF/Markdown
- [ ] Collaborative notebooks
- [ ] Custom themes and styling
- [ ] Mobile app (React Native)

## 🔧 Development

### Project Structure

```
src/
├── components/       # React components
│   ├── auth/        # Authentication components
│   ├── layout/      # Layout components (Navbar, etc.)
│   ├── notebooks/   # Notebook-related components
│   ├── posts/       # Post components
│   ├── reactions/   # Reaction components
│   └── ui/          # Reusable UI components
├── config/          # Configuration files
├── hooks/           # React Query hooks
├── lib/             # Core libraries (B3nd client, auth)
├── pages/           # Page components
├── stores/          # Zustand stores
├── types/           # TypeScript types
└── utils/           # Utility functions
```

### Key Concepts

- **Zustand Stores**: Global state management with persistence
- **React Query**: Server state caching and synchronization
- **B3nd Client**: Wrapper for HTTP and Wallet clients
- **URI Helpers**: Functions to construct B3nd URIs
- **Crypto Utils**: Encryption/decryption for protected content

## 📜 License

Open source under the MIT License. Built with ❤️ for the Firecat community.

## 🙏 Credits

- Built on [B3nd SDK](https://github.com/bandeira-tech/b3nd)
- Part of the [Firecat Network](https://fire.cat)
- Designed with [Tailwind CSS](https://tailwindcss.com)
- Icons by [Lucide](https://lucide.dev)

---

**Firecat Notes** - Beautiful, peaceful notetaking on the decentralized web. 🔥📝
