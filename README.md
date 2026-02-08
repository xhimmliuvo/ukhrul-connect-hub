# Discover Ukhrul

This is a React application built with Vite.

## Development

To run the application locally:

```bash
npm install
npm run dev
```

## Deployment

To deploy this application, you must **build** it first.

**Do not deploy the source code directly.** Browsers cannot execute `.tsx` files directly, and static hosting services will often serve them with incorrect MIME types (`application/octet-stream`), causing "Failed to load module script" errors and a white screen.

### Building for Production

```bash
npm run build
```

This will create a `dist` folder containing the compiled assets (HTML, JS, CSS).

### Deploying to GitHub Pages

This repository is configured to deploy to GitHub Pages using GitHub Actions.

1. Go to **Settings > Pages** in your GitHub repository.
2. Under **Build and deployment**, select **GitHub Actions** as the source.
3. The included `.github/workflows/deploy.yml` will handle the build and deployment automatically when you push to the `main` branch.

**Note:** If you choose "Deploy from a branch" and select `main`, the deployment will fail because it will serve the source code.

### Custom Domain

The `CNAME` file is located in `public/CNAME`. This ensures it is copied to the `dist` folder during build.
