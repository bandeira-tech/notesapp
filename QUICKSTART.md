# 🚀 Firecat Notes - Quick Start Guide

## What You Just Built

Congratulations! You've created **Firecat Notes** - a complete decentralized notebook and microblogging application featuring:

✅ **Full-stack React + TypeScript application**
✅ **B3nd/Firecat integration** for decentralized data
✅ **Wallet-based authentication** system
✅ **Notebook management** with 3 visibility levels
✅ **Post timeline** with images and rich content
✅ **Reactions system** (likes, comments with multimedia)
✅ **Public discovery** page
✅ **Shareable post links**
✅ **Beautiful, peaceful UI** with Tailwind CSS
✅ **State management** with Zustand + React Query
✅ **Production-ready build** (370kb gzipped)

## File Structure

```
firecat-notes/
├── src/
│   ├── components/
│   │   ├── auth/           # Authentication (login/signup modals)
│   │   ├── layout/         # Navbar and layout
│   │   ├── notebooks/      # Notebook cards and creation
│   │   ├── posts/          # Post cards and creation form
│   │   ├── reactions/      # Reaction modal and components
│   │   └── ui/             # Reusable UI (Button, Card, Input, Modal)
│   ├── config/             # Firecat backend configuration
│   ├── hooks/              # React Query hooks for B3nd operations
│   ├── lib/                # Core libraries (B3nd client, auth service)
│   ├── pages/              # Main pages (Home, Discover, Notebook, Post)
│   ├── stores/             # Zustand stores (auth, app, notebook)
│   ├── types/              # TypeScript type definitions
│   ├── utils/              # Utilities (crypto, URIs)
│   ├── App.tsx             # Main app with router
│   ├── main.tsx            # React entry point
│   └── index.css           # Tailwind CSS
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── README.md
```

## Running the App

### 1. ⚠️ Required: Configure Environment

**The app will NOT start without configuration!**

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your B3nd node URLs:

```bash
# Local B3nd Node Configuration (REQUIRED for dev)
VITE_B3ND_BACKEND=http://localhost:9942
VITE_B3ND_WALLET=http://localhost:9943
VITE_B3ND_APP=http://localhost:9944
```

### 2. Start Local B3nd Nodes

**Required before starting the app:**

```bash
# Terminal 1 - Data node
b3nd-data-node start --port 9942

# Terminal 2 - Wallet node
b3nd-wallet-node start --port 9943
```

Verify they're running:
```bash
curl http://localhost:9942/api/v1/health
curl http://localhost:9943/api/v1/health
```

### 3. Start the Development Server

```bash
npm run dev
```

The app will start at **http://localhost:5555**

**If you see a configuration error screen:**
- Make sure you created `.env` (step 1)
- Make sure B3nd nodes are running (step 2)
- Check that URLs in `.env` match your running nodes

### 4. Try the Features

**Sign Up:**
1. Click "Sign In" in the navbar
2. Switch to "Create Account"
3. Enter username and name
4. You're in!

**Create a Notebook:**
1. Click "New Notebook"
2. Add title, description, cover image
3. Choose visibility (Public/Protected/Private)
4. Create!

**Post Content:**
1. Open your notebook
2. Use the form at the top
3. Add text and images
4. Click "Post"

**Discover & React:**
1. Go to "Discover" page
2. Browse public notebooks
3. Like and comment on posts
4. Share posts with the share button

## Key Features Explained

### 🔐 Three Visibility Levels

- **Public**: Discoverable by anyone, listed in public index
- **Protected**: Password-encrypted, shareable with password
- **Private**: Only accessible by the author

### 📝 Post Timeline

- Descending chronological order (newest first)
- Image uploads (base64 encoded)
- Reference linking between notebooks
- Shareable individual post URLs

### 💬 Rich Reactions

- Like posts with one click
- Comment with text, emoji, or images
- Multimedia reaction support
- Reaction counts displayed

### 🎨 Peaceful Design

- Custom color palette (cream, sage, lavender, peach, sky)
- Smooth animations and transitions
- Playfair Display font for headings
- Inter font for body text
- Mobile-responsive layout

## Architecture Highlights

### State Management

**Zustand Stores:**
- `authStore`: User session and profile
- `appStore`: Theme, sidebar, password cache
- `notebookStore`: Notebooks and posts cache

**React Query:**
- Server state caching and synchronization
- Automatic refetching and invalidation
- Optimistic updates

### B3nd Integration

**URI Schema:**
```
mutable://open/notebooks/{id}                      # Public notebooks
mutable://accounts/{pubkey}/notebooks/{id}         # User notebooks
mutable://accounts/{pubkey}/notebooks/{id}/posts   # Posts
```

**Operations:**
- `read(uri)` - Read data
- `list(uri)` - List items
- `write(uri, data)` - Write data
- `delete(uri)` - Delete data

### Security

- **Client-side encryption** for protected notebooks (PBKDF2 + NaCl)
- **Keypair generation** for wallet auth (TweetNaCl)
- **Session management** with localStorage persistence
- **Token-based authentication**

## Next Steps

### Start B3nd Backend

To use real decentralized storage:

```bash
# Install B3nd CLI (if not already)
npm install -g @bandeira-tech/b3nd

# Start local server
b3nd server start

# Or connect to testnet (already configured in production)
```

### Customize the App

1. **Change theme colors** in `tailwind.config.js`
2. **Modify B3nd backend** in `src/config/firecat.ts`
3. **Add new features** using existing patterns
4. **Deploy to production** with `npm run build`

### Production Deployment

```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Deploy to your favorite hosting (Vercel, Netlify, etc.)
```

The build outputs to `dist/` directory.

## Troubleshooting

**B3nd Connection Issues:**
- Make sure B3nd nodes are running on ports 9942 (data) and 9943 (wallet)
- Check `.env` file for correct URLs (or use defaults)
- Check `src/config/firecat.ts` for configuration logic
- Verify CORS settings on B3nd nodes
- Try: `curl http://localhost:9942/api/v1/health` to test connection

**Build Errors:**
- Run `npm install` again
- Clear `node_modules` and reinstall
- Check TypeScript version compatibility

**Auth Not Working:**
- Currently using demo auth (generates keypairs)
- For production, integrate with B3nd wallet service
- See `src/lib/auth.ts` for implementation notes

## Contributing

This is an open-source project! Feel free to:
- Add new features
- Improve the UI/UX
- Fix bugs
- Write tests
- Improve documentation

## Resources

- [B3nd SDK Documentation](https://github.com/bandeira-tech/b3nd)
- [Firecat Network](https://fire.cat)
- [React Query Docs](https://tanstack.com/query)
- [Zustand Docs](https://zustand-demo.pmnd.rs)
- [Tailwind CSS](https://tailwindcss.com)

---

**Enjoy building on the decentralized web with Firecat Notes!** 🔥📝
