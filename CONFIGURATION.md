# Firecat Notes - Configuration Guide

## Environment Variables

Firecat Notes uses environment variables to configure B3nd node connections. This allows you to easily switch between local development, staging, and production environments.

## Quick Setup

1. **Copy the example file:**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` with your settings:**
   ```bash
   nano .env  # or use your preferred editor
   ```

3. **Restart the dev server:**
   ```bash
   npm run dev
   ```

## Available Variables

### Local Development (DEV Mode)

These are used when running `npm run dev`:

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_B3ND_BACKEND` | `http://localhost:9942` | B3nd data node URL |
| `VITE_B3ND_WALLET` | `http://localhost:9943` | B3nd wallet node URL |
| `VITE_B3ND_APP` | `http://localhost:9944` | B3nd app URL |

### Production (BUILD Mode)

These are used when running `npm run build`:

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_FIRECAT_BACKEND` | `https://testnet-evergreen.fire.cat` | Firecat data backend |
| `VITE_FIRECAT_WALLET` | `https://testnet-wallet.fire.cat` | Firecat wallet service |
| `VITE_FIRECAT_APP` | `https://testnet-app.fire.cat` | Firecat app service |

## Configuration Modes

### Mode 1: Default (No .env file)

If you don't create a `.env` file, the app uses these defaults:

**Development:**
- Data: `http://localhost:9942`
- Wallet: `http://localhost:9943`
- App: `http://localhost:9944`

**Production:**
- Firecat testnet endpoints

### Mode 2: Custom Local Ports

If your B3nd nodes run on different ports, create `.env`:

```bash
VITE_B3ND_BACKEND=http://localhost:8000
VITE_B3ND_WALLET=http://localhost:8001
VITE_B3ND_APP=http://localhost:8002
```

### Mode 3: Remote Development Server

To connect to a remote B3nd instance:

```bash
VITE_B3ND_BACKEND=https://dev.myserver.com:9942
VITE_B3ND_WALLET=https://dev.myserver.com:9943
VITE_B3ND_APP=https://dev.myserver.com:9944
```

### Mode 4: Custom Production Endpoints

Override production endpoints:

```bash
VITE_FIRECAT_BACKEND=https://mainnet.fire.cat
VITE_FIRECAT_WALLET=https://wallet.fire.cat
VITE_FIRECAT_APP=https://app.fire.cat
```

## Starting B3nd Nodes

### Default Ports (9942/9943)

```bash
# Terminal 1 - Data node
b3nd-data-node start --port 9942

# Terminal 2 - Wallet node
b3nd-wallet-node start --port 9943
```

### Custom Ports

```bash
# Terminal 1 - Data node on custom port
b3nd-data-node start --port 8000

# Terminal 2 - Wallet node on custom port
b3nd-wallet-node start --port 8001

# Update .env to match
echo "VITE_B3ND_BACKEND=http://localhost:8000" > .env
echo "VITE_B3ND_WALLET=http://localhost:8001" >> .env
```

## Testing Configuration

### Check Active Configuration

The app logs the active configuration on startup. Check the browser console:

```javascript
console.log('B3nd Backend:', config.backend)
console.log('B3nd Wallet:', config.wallet)
```

### Test Backend Connection

```bash
# Test data node
curl http://localhost:9942/api/v1/health

# Test wallet node
curl http://localhost:9943/api/v1/health
```

Expected response:
```json
{
  "status": "healthy",
  "version": "x.x.x"
}
```

## Troubleshooting

### Issue: "Connection Refused"

**Cause:** B3nd nodes not running or wrong port

**Solution:**
1. Check nodes are running: `ps aux | grep b3nd`
2. Verify ports: `lsof -i :9942` and `lsof -i :9943`
3. Check `.env` matches running ports
4. Restart dev server after changing `.env`

### Issue: "CORS Error"

**Cause:** B3nd nodes not configured for CORS

**Solution:**
```bash
# Start nodes with CORS enabled
b3nd-data-node start --port 9942 --cors-origin http://localhost:5555
b3nd-wallet-node start --port 9943 --cors-origin http://localhost:5555
```

### Issue: Changes Not Taking Effect

**Cause:** Vite doesn't reload env changes automatically

**Solution:**
1. Stop dev server (Ctrl+C)
2. Edit `.env`
3. Restart: `npm run dev`

### Issue: Production Build Uses Wrong URLs

**Cause:** Environment variables not set during build

**Solution:**
```bash
# Set production env vars before building
export VITE_FIRECAT_BACKEND=https://your-backend.com
npm run build

# Or use .env.production file
echo "VITE_FIRECAT_BACKEND=https://your-backend.com" > .env.production
npm run build
```

## Docker Configuration

If running B3nd nodes in Docker:

```yaml
# docker-compose.yml
services:
  b3nd-data:
    image: b3nd/data-node
    ports:
      - "9942:9942"

  b3nd-wallet:
    image: b3nd/wallet-node
    ports:
      - "9943:9943"
```

Then use default ports in `.env`:
```bash
VITE_B3ND_BACKEND=http://localhost:9942
VITE_B3ND_WALLET=http://localhost:9943
```

## Environment Files Priority

Vite loads environment files in this order (later overrides earlier):

1. `.env` - Loaded in all cases
2. `.env.local` - Loaded in all cases, ignored by git
3. `.env.[mode]` - Only loaded in specified mode (e.g., `.env.production`)
4. `.env.[mode].local` - Only loaded in specified mode, ignored by git

## Security Notes

- ⚠️ Never commit `.env` files with sensitive data
- ✅ Use `.env.example` to document required variables
- ✅ Use `.env.local` for local overrides (gitignored)
- ⚠️ `VITE_` prefix makes variables public in client bundle
- ⚠️ Don't put secrets in VITE_ variables (they're exposed to client)

## Advanced: Multiple Environments

Create environment-specific files:

```bash
# .env.development
VITE_B3ND_BACKEND=http://localhost:9942

# .env.staging
VITE_B3ND_BACKEND=https://staging.fire.cat

# .env.production
VITE_B3ND_BACKEND=https://mainnet.fire.cat
```

Build for specific environment:
```bash
npm run build -- --mode staging
```

---

**For more information, see:**
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [B3nd Documentation](https://github.com/bandeira-tech/b3nd)
