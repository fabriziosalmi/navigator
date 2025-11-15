# Navigator SDK Documentation - Vercel Deployment

## Automatic Deployment

This documentation is automatically deployed to Vercel when changes are pushed to the `main` branch.

### Setup Instructions

1. **Import to Vercel**
   - Go to [Vercel Dashboard](https://vercel.com/new)
   - Import your GitHub repository: `fabriziosalmi/navigator`
   - Select the `apps/docs` directory as the root
   
2. **Configure Build Settings**
   - Framework Preset: **VitePress**
   - Build Command: `pnpm build`
   - Output Directory: `.vitepress/dist`
   - Install Command: `pnpm install`
   - Root Directory: `apps/docs`

3. **Environment Variables** (if needed)
   - None required for basic setup

4. **Deploy**
   - Click "Deploy"
   - Your site will be live at `https://your-project.vercel.app`

### Custom Domain (Optional)

1. Go to Project Settings → Domains
2. Add your custom domain (e.g., `docs.navigator-sdk.com`)
3. Follow Vercel's DNS configuration instructions

## Automatic Sync Script

Per mantenere `apps/docs` aggiornato con `docs/docs`, puoi usare questo script:

```bash
#!/bin/bash
# scripts/sync-docs.sh

echo "Syncing documentation from docs/docs to apps/docs..."

# Files to sync
cp docs/docs/GETTING_STARTED.md apps/docs/getting-started.md
cp docs/docs/ARCHITECTURE.md apps/docs/architecture.md
cp docs/docs/FEATURES.md apps/docs/features.md
cp docs/docs/COOKBOOK.md apps/docs/cookbook.md
cp docs/docs/CONFIGURATION.md apps/docs/configuration.md
cp docs/docs/PLUGIN_ARCHITECTURE.md apps/docs/plugin-architecture.md
cp docs/docs/COGNITIVE_INTELLIGENCE_SYSTEM.md apps/docs/cognitive-intelligence.md
cp docs/docs/OPTIMIZATION_GUIDE.md apps/docs/optimization-guide.md
cp docs/docs/DUAL_HUD_LAYOUT.md apps/docs/dual-hud-layout.md
cp docs/docs/MONOCHROME_DESIGN.md apps/docs/monochrome-design.md
cp docs/docs/CSS_MODULARIZATION.md apps/docs/css-modularization.md
cp docs/docs/BRANCH_PROTECTION_GUIDE.md apps/docs/branch-protection.md

# Directories to sync
cp -r docs/docs/testing/* apps/docs/testing/
cp -r docs/docs/security/* apps/docs/security/

echo "✅ Documentation synced successfully!"
```

### GitHub Action for Auto-Sync

Crea `.github/workflows/sync-docs.yml`:

```yaml
name: Sync Documentation

on:
  push:
    branches:
      - main
    paths:
      - 'docs/docs/**'

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Sync docs
        run: |
          chmod +x scripts/sync-docs.sh
          ./scripts/sync-docs.sh
      
      - name: Commit changes
        run: |
          git config --local user.email "github-actions[bot]@users.noreply.github.com"
          git config --local user.name "github-actions[bot]"
          git add apps/docs/
          git diff --quiet && git diff --staged --quiet || git commit -m "docs: sync documentation"
          git push
```

## Manual Updates

Se preferisci aggiornare manualmente:

```bash
cd apps/docs
pnpm dev     # Preview changes at http://localhost:5173
pnpm build   # Build for production
```

## Vercel CLI (Alternative)

Puoi anche deployare manualmente con Vercel CLI:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd apps/docs
vercel --prod
```

## Troubleshooting

### Build Fails

Check:
1. `pnpm install` runs successfully
2. All markdown files are valid
3. `.vitepress/config.ts` has no errors

### Links Broken

Ensure all internal links use relative paths:
- ✅ `[Link](/getting-started)`
- ❌ `[Link](https://example.com/getting-started)`

### Images Not Loading

Place images in `public/` directory:
- ✅ `![Logo](/logo.svg)`
- ❌ `![Logo](./logo.svg)`
