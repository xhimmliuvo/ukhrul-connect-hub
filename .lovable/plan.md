

# Fix GitHub Pages Deployment for Discover Ukhrul

## Problem
Your Vite React app shows a blank white screen on GitHub Pages because:
1. No build process is configured - GitHub Pages is serving source files, not built assets
2. Missing base path configuration for asset loading
3. No SPA (Single Page Application) routing support

---

## Solution Overview

| Issue | Fix |
|-------|-----|
| No build process | Add GitHub Actions workflow to build and deploy |
| Missing base path | Configure `base` in vite.config.ts |
| SPA routing fails | Add 404.html redirect for client-side routing |

---

## Files to Create/Modify

### 1. Update `vite.config.ts`
Add the `base` configuration so assets load correctly:

```typescript
export default defineConfig(({ mode }) => ({
  base: '/', // For custom domain
  // ... rest of config
}));
```

### 2. Create GitHub Actions Workflow
Create `.github/workflows/deploy.yml` to automatically build and deploy when you push to main:

- Installs Node.js and dependencies
- Runs `npm run build`
- Deploys the `dist` folder to GitHub Pages

### 3. Add SPA Support
Create `public/404.html` - a redirect page that handles client-side routing. When users navigate to `/profile` or any route, GitHub Pages will serve this file which redirects to the main app with the route preserved.

### 4. Update `index.html`
Add a small script to handle the redirect from 404.html, ensuring routes like `/profile`, `/businesses`, etc. work correctly.

---

## How It Works

```text
+------------------+     +------------------+     +------------------+
|  Push to GitHub  | --> | GitHub Actions   | --> | GitHub Pages     |
|  (main branch)   |     | builds app       |     | serves /dist     |
+------------------+     +------------------+     +------------------+
                                                         |
                                                         v
                                               +------------------+
                                               | Your custom      |
                                               | domain works!    |
                                               +------------------+
```

---

## Technical Details

### GitHub Actions Workflow Structure

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

### SPA Redirect Script (in 404.html)

This script preserves the URL path when redirecting:
- User visits `discoverukhrul.site/profile`
- GitHub Pages serves 404.html (because /profile doesn't exist as a file)
- Script redirects to `/?p=/profile`
- Main app reads the parameter and navigates to `/profile`

---

## After Implementation

1. Push changes to GitHub
2. Go to your repo Settings > Pages
3. Ensure source is set to "gh-pages" branch (created by the workflow)
4. Your site will be live at `discoverukhrul.site`

---

## Summary of Changes

| File | Action | Purpose |
|------|--------|---------|
| `vite.config.ts` | Modify | Add base path configuration |
| `.github/workflows/deploy.yml` | Create | Automate build and deploy |
| `public/404.html` | Create | Handle SPA routing on GitHub Pages |
| `index.html` | Modify | Add redirect handler script |

