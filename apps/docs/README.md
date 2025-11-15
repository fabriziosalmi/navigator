# Navigator SDK Documentation

Official documentation site for Navigator SDK, built with VitePress and deployed on Vercel.

## Development

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

## Deployment

This site is automatically deployed to Vercel when changes are pushed to the main branch.

### Manual Deployment

```bash
# Build the site
pnpm build

# The output will be in .vitepress/dist
```

## Structure

```
apps/docs/
├── .vitepress/          # VitePress configuration
│   └── config.ts        # Site config, theme, nav, sidebar
├── index.md             # Home page
├── getting-started.md   # Getting started guide
├── architecture.md      # Architecture overview
├── unidirectional-flow.md # Unidirectional flow pattern
├── features.md          # Feature documentation
├── cookbook.md          # Code examples
└── ...                  # Other documentation pages
```

## Contributing

Documentation is auto-generated from the main `docs/` directory. To update:

1. Edit files in `docs/docs/`
2. Changes are synced to `apps/docs/`
3. Deploy automatically via Vercel

## Links

- [Live Site](https://navigator-docs.vercel.app) (coming soon)
- [GitHub Repository](https://github.com/fabriziosalmi/navigator)
- [Main Documentation](../../docs/docs/)
