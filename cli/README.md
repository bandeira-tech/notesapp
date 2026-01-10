# Firecat Notes CLI

Command-line tool for automating Firecat Notes operations - creating users, notebooks, and posts.

## Purpose

- Generate reproducible test data for development
- Automate bulk content creation
- Test B3nd SDK integration outside the webapp

## Structure

```
cli/
├── lib/
│   ├── b3nd-client.ts    # B3nd SDK wrapper with auth
│   ├── types.ts          # Shared types
│   └── uris.ts           # URI helpers
├── commands/
│   ├── create-notebook.ts  # Notebook creation
│   └── create-post.ts      # Post creation
└── seed.ts               # Test data generator
```

## Usage

### Generate Test Data

```bash
npm run seed
```

This creates:
- 4 test users (alice, bob, charlie, diana)
- 8 public notebooks with diverse subjects:
  - Machine Learning Explorations
  - Coffee & Code
  - Decentralized Systems Research
  - Home Lab Adventures
  - Photography Journal
  - Urban Exploration
  - Sustainable Living
  - Philosophy & Ethics
- 40 posts across all notebooks (5 per notebook)

### Custom Commands

```bash
# Run any CLI command
npm run cli cli/commands/create-notebook.ts
```

## Current Status

⚠️ **Known Issue**: Session creation is failing when posting to `immutable://inbox`.

The error occurs at:
```typescript
const inboxUri = `immutable://inbox/${appPubkey}/sessions/${sessionPubkey}`;
await httpClient.write(inboxUri, sessionRequest);
// ^ Fails with "Failed to post session request to inbox"
```

This might be because:
1. The immutable://inbox protocol doesn't support this write pattern from Node.js
2. Authentication/signing differs between browser and Node environments
3. The B3nd SDK needs additional configuration for CLI usage

## Next Steps

To fix the CLI:

1. **Option A**: Use a different auth flow that doesn't require inbox posting
2. **Option B**: Investigate why inbox writes fail from Node.js (crypto API differences?)
3. **Option C**: Use the webapp's existing session and export credentials for CLI use

## Test Data Content

The seed script generates realistic, diverse content across multiple subjects:

- **Technical**: ML, distributed systems, homelab
- **Creative**: Photography, urban exploration
- **Philosophical**: Ethics, sustainable living
- **Personal**: Coffee, coding, daily musings

All content is public and designed to showcase the app's features.

## Development

The CLI uses:
- **tsx**: Run TypeScript directly without compilation
- **@bandeira-tech/b3nd-web**: Same SDK as the webapp
- **Node.js crypto**: For key generation and signing

Type checking:
```bash
tsc --noEmit -p cli/tsconfig.json
```
