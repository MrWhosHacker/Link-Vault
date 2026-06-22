# Deploy Link Vault (from GitHub — no Netlify)

Your code is on GitHub. Users need a **live URL** to sign up, log in, and share profiles.

## Option A — One link for everything (recommended)

**Render** hosts the full app (website + accounts API) and auto-deploys when you push to GitHub.

1. Go to [render.com](https://render.com) and sign up (free).
2. **New → Blueprint** → connect **MrWhosHacker/Link-Vault**.
3. Render reads `render.yaml` and deploys.
4. Your live link will look like: `https://link-vault-xxxx.onrender.com`
5. Share that link — users can create accounts, activate, and use the app.

Optional: Render → your service → **Environment** → add `ADMIN_RESET_SECRET`.

Every `git push` to `main` redeploys automatically.

---

## Option B — Site on GitHub Pages

Live URL: **https://mrwhoshacker.github.io/Link-Vault/**

1. GitHub repo → **Settings → Pages**
2. **Build and deployment → Source:** GitHub Actions
3. Push to `main` (workflow `.github/workflows/deploy-pages.yml` runs)
4. Accounts still need an API host — deploy **Option A on Render** first, then:
   - Repo **Settings → Secrets and variables → Actions**
   - New secret: `VITE_API_URL` = your Render URL (e.g. `https://link-vault-xxxx.onrender.com`)

---

## Push updates

```bash
git add .
git commit -m "Your change"
git push
```

---

## What GitHub alone does

GitHub stores **source code**. It does not run your Node API by itself. Pages or Render (above) turns it into a site users can open in a browser.
