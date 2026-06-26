# Social login setup (Google & Apple)

The "Continue with Google" and "Continue with Apple" buttons appear on the
login and sign-up screens. The app works fully **without** configuring them —
they just show a short note until you add credentials. Here's how to enable
each.

---

## Google sign-in (free, ~5 minutes)

You need one **OAuth Client ID** from Google. No paid account required.

1. Go to <https://console.cloud.google.com/apis/credentials>.
2. Create a project (or pick one). If asked, configure the **OAuth consent
   screen**: User type **External**, add an app name and your email, save.
3. **Create Credentials → OAuth client ID → Application type: Web application**.
4. Under **Authorized JavaScript origins**, add the URLs the app runs on:
   - `http://localhost:5173` (local dev)
   - your Vercel URL, e.g. `https://your-app.vercel.app` (after deploying)
5. Click **Create** and copy the **Client ID** (looks like
   `1234567890-abc...apps.googleusercontent.com`).

Now put that same Client ID in **two** places:

**Client** — `client/.env`:
```ini
VITE_GOOGLE_CLIENT_ID=1234567890-abc...apps.googleusercontent.com
```

**Server** — `server/.env`:
```ini
GOOGLE_CLIENT_ID=1234567890-abc...apps.googleusercontent.com
```

Restart both (`npm run dev`). The Google button now signs people in. New users
are created with the role selected on the page (patient/doctor), already
verified, and logged straight in.

> On your deployed site, set `VITE_GOOGLE_CLIENT_ID` in **Vercel** and
> `GOOGLE_CLIENT_ID` in **Render**, and make sure your Vercel URL is in the
> Authorized JavaScript origins list above.

### How it works (security)

The browser receives a signed Google **ID token** and sends it to the API. The
server verifies that token with Google's library before trusting the email —
the client never asserts who you are on its own.

---

## Apple sign-in (requires a paid Apple Developer account)

Apple sign-in is more involved and needs the **Apple Developer Program**
($99/year) plus a verified domain. At a high level you would:

1. In the Apple Developer portal, create an **App ID** and a **Services ID**.
2. Enable **Sign in with Apple** and register your domain + return URLs.
3. Create a **private key** for Sign in with Apple and note the Key ID + Team ID.
4. Implement the OAuth redirect flow and verify Apple's identity token on the
   server (similar to the Google flow).

Because it can't be tested without that account, the Apple button currently
shows a short note when tapped. If you get an Apple Developer account, this is
the place to wire it up — the server already has a pattern to copy from in
`controllers/authController.js` (`googleAuth`).
