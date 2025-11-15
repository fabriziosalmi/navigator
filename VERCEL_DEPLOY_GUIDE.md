# 🚀 Vercel Deployment Guide for Navigator Monorepo

## ⚠️ IMPORTANT: Deploy via Dashboard, NOT CLI

The monorepo structure requires specific configuration that works best through Vercel Dashboard.

---

## 📋 Step-by-Step Deployment

### 1. Go to Vercel Dashboard
👉 https://vercel.com/new

### 2. Import Git Repository
- Click **"Import Git Repository"**
- Search for: `fabriziosalmi/navigator`
- Click **Import**

### 3. Configure Project Settings

**Important Settings:**

| Setting | Value |
|---------|-------|
| **Project Name** | `navigator-cognitive-showcase` |
| **Framework Preset** | `Vite` |
| **Root Directory** | `apps/cognitive-showcase` ← CRITICAL! |
| **Build Command** | Leave as detected (`pnpm build`) |
| **Output Directory** | Leave as detected (`dist`) |
| **Install Command** | Leave as detected |

**Screenshot of correct configuration:**
```
Root Directory: apps/cognitive-showcase
Framework: Vite
Build Command: pnpm build
Output Directory: dist
Install Command: pnpm install
```

### 4. Click Deploy! 🎉

Vercel will:
1. Clone the repo
2. Navigate to `apps/cognitive-showcase`
3. Install all workspace dependencies
4. Build the app
5. Deploy to production

### 5. Get Your URL

After deployment (2-3 minutes), you'll get a URL like:
```
https://navigator-cognitive-showcase.vercel.app
```

OR with your custom domain:
```
https://demo.navigator.menu
```

---

## 🔧 Troubleshooting

### Error: "No matching version found for @navigator.menu/core"

**Problem**: Vercel can't resolve workspace dependencies

**Solution**: Make sure **Root Directory** is set to `apps/cognitive-showcase`, not `.` or empty

### Error: "Command pnpm install exited with 1"

**Problem**: Monorepo workspace not detected

**Solution**: 
1. Delete the failed project on Vercel
2. Re-import with correct Root Directory setting
3. Vercel auto-detects `pnpm-workspace.yaml` from the repo root

### Build succeeds but shows blank page

**Problem**: Wrong output directory

**Solution**: Verify `Output Directory` is set to `dist` (relative to Root Directory)

---

## 🎯 What You Should Get

**Production URL**: 
```
https://navigator-cognitive-showcase-xxx.vercel.app
```

**Build Output**:
```
✓ 62.90 kB dist/index.html
✓ 182.47 kB dist/assets/index-[hash].js
```

**Build Time**: ~30-40 seconds

---

## 📝 After Successful Deployment

1. Copy the production URL
2. Update landing page link in `apps/landing-page/src/pages/index.astro`
3. Deploy landing page (optional if using custom domain)

---

## 🌐 Custom Domain (Optional)

If you own `navigator.menu`:

1. Go to project Settings → Domains
2. Add domain: `demo.navigator.menu`
3. Configure DNS:
   ```
   Type: CNAME
   Name: demo
   Value: cname.vercel-dns.com
   ```

---

## ✅ Success Checklist

- [ ] Deployed from dashboard (not CLI)
- [ ] Root Directory: `apps/cognitive-showcase`
- [ ] Framework detected as Vite
- [ ] Build succeeds with no errors
- [ ] URL loads the cognitive showcase demo
- [ ] Tutorial starts when clicking carousel
- [ ] Metrics update in real-time
- [ ] Charts animate on interactions

---

**Ready to deploy? Go to:** https://vercel.com/new

Good luck! 🚀
