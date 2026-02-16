# GitHub Actions Setup

This directory contains GitHub Actions workflows for automated deployment.

## Setup Instructions

To enable automatic deployment when pushing to the `main` branch:

### 1. Create a Cloudflare API Token

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens)
2. Click "Create Token"
3. Use the "Edit Cloudflare Workers" template
4. Configure permissions:
   - **Account** → Cloudflare Workers → Edit
   - **Account** → Account Settings → Read
   - **Zone** → Workers Routes → Edit (if using custom domains)
5. Set "Account Resources" to include your account
6. Create the token and copy it

### 2. Add Token to GitHub Secrets

1. Go to your GitHub repository
2. Navigate to Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Name: `CLOUDFLARE_API_TOKEN`
5. Value: Paste your Cloudflare API token
6. Click "Add secret"

### 3. Verify Deployment

Once the secret is added:

1. Push to the `main` branch
2. Go to the "Actions" tab in your GitHub repository
3. Watch the deployment workflow run
4. On success, your changes will be live at your Worker URL

## Workflows

### deploy.yml

Triggers on every push to `main`:
- Installs dependencies
- Builds the frontend (`npm run build`)
- Deploys to Cloudflare Workers using Wrangler

## Troubleshooting

### "Authentication error" during deployment

- Verify your `CLOUDFLARE_API_TOKEN` secret is set correctly
- Check that the token has the required permissions
- Token may have expired - create a new one

### Build fails in CI

- Run `npm run build` locally to reproduce
- Check Node.js version matches (workflow uses Node 20)
- Ensure all dependencies are in `package.json`

### Deployment succeeds but site doesn't update

- Check worker name in `wrangler.toml` matches your Cloudflare worker
- View deployment logs in Cloudflare Dashboard → Workers & Pages
- May need to hard refresh browser (Ctrl+Shift+R / Cmd+Shift+R)

## Local Deployment

To deploy manually from your machine:

```bash
# Authenticate (first time only)
npx wrangler login

# Deploy
npm run deploy
```
