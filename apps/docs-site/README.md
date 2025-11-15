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

Documentation is maintained in this directory (`apps/docs-site/`). To update:

1. Edit markdown files directly in this directory
2. Test locally with `pnpm dev`
3. Commit and push - deploys automatically via Vercel

## Links

- [Live Site](https://navigator-docs.vercel.app) (coming soon)
- [GitHub Repository](https://github.com/fabriziosalmi/navigator)
- [Project Docs](https://github.com/fabriziosalmi/navigator/tree/main/project-docs) (internal on GitHub)
