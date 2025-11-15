# 🚀 Deployment Instructions for Navigator Demos

## 📦 Apps to Deploy

### 1. **Cognitive Showcase** (MAIN DEMO) - Priority #1
**Purpose**: The mind-blowing AI/cognitive demo that should be the main "Launch Live Demo" link

**Vercel Settings**:
- **Project Name**: `navigator-cognitive-showcase`
- **Framework Preset**: Vite
- **Root Directory**: `apps/cognitive-showcase`
- **Build Command**: `pnpm build`
- **Output Directory**: `dist`
- **Install Command**: `pnpm install`
- **Node Version**: 18.x or higher

**Recommended URL**: 
- Primary: `cognitive-showcase.vercel.app`
- Or use custom domain: `demo.navigator.menu`

**After Deploy**:
- Update landing page link from `navigator-demo.vercel.app` → new Vercel URL

---

### 2. **PDK Demo** (Secondary) - Priority #2
**Purpose**: Interactive SDK features showcase

**Vercel Settings**:
- **Project Name**: `navigator-pdk-demo`
- **Framework Preset**: Vite
- **Root Directory**: `apps/pdk-demo`
- **Build Command**: `pnpm build`
- **Output Directory**: `dist`
- **Install Command**: `pnpm install`
- **Node Version**: 18.x or higher

**Recommended URL**:
- Primary: `pdk-demo.vercel.app`
- Or use custom domain: `pdk.navigator.menu`

**After Deploy**:
- Optionally add as second CTA button on landing page

---

### 3. **Landing Page** - Priority #3
**Purpose**: Main navigator.menu website

**Vercel Settings**:
- **Project Name**: `navigator-landing`
- **Framework Preset**: Astro
- **Root Directory**: `apps/landing-page`
- **Build Command**: `pnpm build`
- **Output Directory**: `dist`
- **Install Command**: `pnpm install`
- **Node Version**: 18.x or higher

**Custom Domain**: `navigator.menu`

---

## 📝 Step-by-Step Deployment

### Step 1: Deploy Cognitive Showcase

```bash
# Option A: Via Vercel CLI
cd apps/cognitive-showcase
vercel --prod

# Option B: Via Vercel Dashboard
# 1. Go to vercel.com/new
# 2. Import from GitHub: fabriziosalmi/navigator
# 3. Set Root Directory: apps/cognitive-showcase
# 4. Click Deploy
```

### Step 2: Update Landing Page Link

Once cognitive-showcase is deployed, update the link:

```astro
<!-- In apps/landing-page/src/pages/index.astro -->
<a 
  href="https://YOUR-NEW-URL.vercel.app"  <!-- UPDATE THIS -->
  target="_blank"
  class="group relative px-8 py-4 bg-gradient-to-r from-orange-600 to-blue-600..."
>
  🚀 Launch Live Demo
</a>
```

### Step 3: Deploy PDK Demo (Optional)

```bash
cd apps/demo
vercel --prod
```

### Step 4: Deploy Landing Page

```bash
cd apps/landing-page
vercel --prod
```

---

## 🔗 Current vs New Architecture

**BEFORE** (Current):
```
navigator.menu (landing page)
  └─> "Launch Live Demo" → navigator-demo.vercel.app (OLD graph demo ❌)
```

**AFTER** (Recommended):
```
navigator.menu (landing page)
  ├─> "🚀 Launch Live Demo" → cognitive-showcase.vercel.app ✨
  └─> "📦 View SDK Demo" → pdk-demo.vercel.app (optional)
```

---

## ⚠️ Important Notes

1. **Workspace Configuration**: Vercel needs to install from the monorepo root
   - Make sure `pnpm-workspace.yaml` is present
   - All workspace dependencies will be resolved

2. **Build Performance**:
   - Cognitive Showcase: ~330ms build time ✅
   - PDK Demo: ~62ms build time ✅
   - Landing Page: ~2-3s build time ✅

3. **Environment Variables**: 
   - None needed! All demos are 100% client-side

4. **Custom Domains** (If you have navigator.menu):
   ```
   demo.navigator.menu     → Cognitive Showcase
   pdk.navigator.menu      → PDK Demo  
   navigator.menu          → Landing Page
   ```

---

## 🎯 Quick Deploy Checklist

- [ ] Deploy cognitive-showcase to Vercel
- [ ] Get the new Vercel URL
- [ ] Update link in landing-page/src/pages/index.astro
- [ ] Deploy landing-page with updated link
- [ ] Test the "Launch Live Demo" button
- [ ] (Optional) Deploy PDK demo
- [ ] (Optional) Add second CTA for PDK demo
- [ ] Update README.md with live demo links

---

## 🆘 Troubleshooting

**Build fails with "Cannot find module"**:
- Check that root `package.json` has all workspace dependencies
- Run `pnpm install` in the monorepo root

**Deploy succeeds but page is blank**:
- Check browser console for errors
- Verify `dist/index.html` exists after build
- Check that base path in vite.config is correct

**Slow initial load**:
- Verify Vercel is serving compressed assets
- Check bundle size (should be ~66KB gzipped)

---

Ready to deploy! 🚀
