# Deploying Doc-Connect

Three pieces work together:

| Part      | Hosted on            | URL you'll get           |
| --------- | -------------------- | ------------------------ |
| Database  | MongoDB Atlas        | (your existing cluster)  |
| Backend   | Render (web service) | `https://...onrender.com`|
| Frontend  | Vercel (static site) | `https://...vercel.app`  |

> **Do it in this order:** push to GitHub → deploy the **backend first** (you need
> its URL) → deploy the **frontend** → finally point the backend back at the
> frontend URL. The steps below follow that order.

---

## 1. Push to GitHub

From the project root (the `doc-connect` folder that contains `client/` and `server/`):

```bash
git init
git add .
git commit -m "Doc-Connect"
git branch -M main
```

Create an **empty** repo on github.com (no README/.gitignore — you already have one),
copy its URL, then:

```bash
git remote add origin https://github.com/YOUR_USERNAME/doc-connect.git
git push -u origin main
```

Your `.env` files are already git-ignored, so no secrets get pushed. Good.

---

## 2. MongoDB Atlas — allow Render to connect

Render's servers need access to your cluster. In Atlas → **Network Access**, make
sure `0.0.0.0/0` is on the allowlist (you already added this for local dev — it
covers Render too).

Keep your Atlas connection string handy:

```
mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/docconnect?appName=Cluster0
```

---

## 3. Deploy the backend to Render

1. Go to [render.com](https://render.com) → sign in with GitHub.
2. **New +** → **Blueprint** → pick your repo. Render reads `render.yaml` and
   sets up the `doc-connect-api` service automatically.
   - (If you prefer manual: **New +** → **Web Service** → repo →
     **Root Directory:** `server`, **Build:** `npm install`, **Start:** `npm start`.)
3. When prompted, fill in the environment variables:
   - `MONGO_URI` → your Atlas string above
   - `CLIENT_URL` → leave as a placeholder for now (e.g. `http://localhost:5173`);
     you'll update it in step 5
   - `EMAIL_HOST` `smtp.gmail.com`, `EMAIL_USER`, `EMAIL_PASS` (Gmail App Password),
     `EMAIL_FROM` → only if you want real verification emails (recommended for a live
     site). Leave blank to fall back to Ethereal preview links in the Render logs.
   - `JWT_SECRET` is generated for you.
4. Click **Apply / Create**. First build takes a few minutes.
5. When it's live, copy the service URL, e.g. `https://doc-connect-api.onrender.com`.
   Open it in a browser — you should see `{"success":true,"service":"Doc-Connect API"...}`.

### Seed demo accounts on Render (optional)

To create the demo admin/doctor/patient accounts in your production database, open
the service's **Shell** tab in Render and run:

```bash
npm run seed
```

---

## 4. Deploy the frontend to Vercel

1. Go to [vercel.com](https://vercel.com) → sign in with GitHub → **Add New** → **Project** → import your repo.
2. **Root Directory:** click **Edit** and choose **`client`**. (Important — the React app lives there.)
3. Framework preset auto-detects **Vite**. Build command `npm run build`, output `dist` (defaults are fine).
4. Expand **Environment Variables** and add:
   - **Name:** `VITE_API_URL`
   - **Value:** your Render URL from step 3, e.g. `https://doc-connect-api.onrender.com`
     (no trailing slash, no `/api`).
5. **Deploy.** When it finishes, copy your site URL, e.g. `https://doc-connect.vercel.app`.

The included `client/vercel.json` makes deep links (like `/verify-email`) work by
routing all paths to the app.

---

## 5. Connect the backend to the frontend (final step)

Now tell the API which origin is allowed and where verification links should point:

1. In **Render** → your service → **Environment** → set **`CLIENT_URL`** to your
   Vercel URL (e.g. `https://doc-connect.vercel.app`, no trailing slash).
2. Save — Render redeploys automatically.

That's it. Open your Vercel URL and sign in.

---

## Things to know about the free tiers

- **Render free services sleep** after ~15 minutes of inactivity. The first request
  after that takes ~50 seconds while it wakes up — so the first login on a cold site
  can feel slow. It's normal.
- **Uploaded avatars are temporary on Render.** Render's disk resets on each deploy/
  restart, so profile photos won't persist long-term. Everything else lives in Atlas
  and is permanent. For persistent images later, switch avatar storage to a service
  like Cloudinary or S3.
- **Emails:** for verification links to reach real inboxes, set the `EMAIL_*` vars on
  Render (Gmail App Password). Without them, the link only appears in Render's logs.

---

## Updating after the first deploy

Both platforms auto-deploy on every push to `main`:

```bash
git add .
git commit -m "your change"
git push
```

Render rebuilds the API and Vercel rebuilds the site automatically.
