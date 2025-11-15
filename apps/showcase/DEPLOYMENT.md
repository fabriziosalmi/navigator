# 🚀 Deployment Guide - Cognitive Showcase

## Deploy to Vercel

### Step 1: Create Vercel Project

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. **Framework Preset**: Vite
5. **Root Directory**: `apps/cognitive-showcase`
6. **Build Command**: `pnpm build`
7. **Output Directory**: `dist`
8. Click **Deploy**

### Step 2: Configure Build Settings

Vercel should auto-detect Vite, but verify these settings:

```json
{
  "buildCommand": "pnpm build",
  "outputDirectory": "dist",
  "installCommand": "pnpm install",
  "framework": "vite"
}
```

### Step 3: Environment Variables

No environment variables needed! This demo is 100% client-side.

### Step 4: Get Your URL

After deployment, you'll get a URL like:
```
https://cognitive-showcase.vercel.app
```

or

```
https://cognitive-showcase-[your-username].vercel.app
```

---

## Update Landing Page

Once deployed, update the main landing page at `navigator.menu`:

1. Open your landing page repository
2. Find the "Launch Live Demo" button
3. Update the `href` to point to your new Vercel URL:

```html
<a href="https://cognitive-showcase.vercel.app" class="demo-button">
  🚀 Launch Live Demo
</a>
```

---

## Continuous Deployment

Every push to `main` will automatically trigger a new deployment on Vercel!

To deploy from a different branch:
1. Go to Vercel Dashboard → Project Settings
2. Click "Git" tab
3. Add production/preview branch names

---

## Performance Tips

The demo is already optimized, but for best results:

1. **Enable Compression**: Vercel does this automatically
2. **Image Optimization**: Using Unsplash CDN (already optimized)
3. **Code Splitting**: Vite handles this automatically
4. **Caching**: Vercel sets optimal cache headers

Expected performance:
- **Lighthouse Score**: 95+ (Performance)
- **First Contentful Paint**: <1.5s
- **Time to Interactive**: <2s

---

## Custom Domain (Optional)

To use a custom domain:

1. Go to Project Settings → Domains
2. Add your domain (e.g., `demo.navigator.menu`)
3. Follow DNS configuration instructions
4. Wait for DNS propagation (up to 48 hours)

Suggested domains:
- `demo.navigator.menu`
- `cognitive.navigator.menu`
- `showcase.navigator.menu`

---

## Troubleshooting

### Build Fails

```bash
# Test locally first
cd apps/cognitive-showcase
pnpm build

# If successful, the issue is in Vercel config
```

### Missing Dependencies

Vercel uses pnpm workspace by default. Ensure:
- `pnpm-workspace.yaml` is in the root
- All workspace dependencies are properly linked

### Slow Loading

Check:
1. Network tab for large assets
2. Unsplash image sizes (should be ~800px wide)
3. Bundle size (should be <500KB)

---

## Analytics (Optional)

Add Vercel Analytics for free:

1. Go to Project Settings → Analytics
2. Enable "Vercel Analytics"
3. No code changes needed!

Track:
- Page views
- User interactions
- Performance metrics
- Geographic distribution

---

## Next Steps

After deployment:

1. ✅ Test the live demo thoroughly
2. ✅ Share the URL on Twitter, LinkedIn, GitHub
3. ✅ Update your README with the live demo link
4. ✅ Create the promotional video with `pnpm test:record`
5. ✅ Submit to Product Hunt, Hacker News, dev.to

🎉 **You now have the most impressive JavaScript SDK demo on the internet!**
