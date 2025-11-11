# ⚠️ Archived Documentation

> **Note**: This Docusaurus setup is no longer actively maintained.

## Current Documentation

The **active documentation** for Navigator.Menu SDK is now located in:

- 📚 **Main Documentation**: `/docs/docs/` (Markdown files)
- 🧑‍🍳 **Cookbook**: `/docs/docs/COOKBOOK.md` (Practical recipes)
- 🚀 **Quick Start**: `/README.md` (Getting started guide)

## About This Archive

This directory contains an earlier Docusaurus-based documentation site. The project has moved to a simpler, more maintainable structure that better aligns with the "Navigator Way" philosophy.

**Last Updated**: November 2025

---

<details>
<summary>Original Docusaurus Setup Instructions (Archived)</summary>

# Website

This website is built using [Docusaurus](https://docusaurus.io/), a modern static website generator.

## Installation

```bash
yarn
```

## Local Development

```bash
yarn start
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

## Build

```bash
yarn build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.

## Deployment

Using SSH:

```bash
USE_SSH=true yarn deploy
```

Not using SSH:

```bash
GIT_USER=<Your GitHub username> yarn deploy
```

If you are using GitHub pages for hosting, this command is a convenient way to build the website and push to the `gh-pages` branch.
