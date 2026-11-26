# Reminder server

A tiny Cloudflare Worker that sends your daily Lithuanian reminder to your iPhone as a
real push notification, even when the app is closed. The free plan is enough.

Why it exists: iOS cannot schedule notifications from a web app. Timers stop as soon as
the app is in the background, and `new Notification()` does not exist on iOS. A push sent
by a server is the only thing that works (iOS 16.4+, app added to the Home Screen).

What it does, every 15 minutes:

- At your reminder time (default 19:00, your phone's time zone): "Laikas mokytis!" with
  your streak and how many words are due. Skipped if you already practised today.
- At your nudge time (default 21:30): "Paskutinė proga!" if your streak would end at
  midnight. Skipped if you practised, or if there is no streak to lose.

What it stores per phone: the push subscription, time zone, the two reminder times, the
last day you practised, your streak, the number of due words, and how many streak freezes
you can afford. Nothing else leaves the phone.

## One-time setup (uses the same Cloudflare account as Tracker)

GitHub deploys the server for you (`.github/workflows/push-server.yml`). It creates its
own storage and signing keys in your Cloudflare account, separate from Tracker's.

1. In this repo: **Settings**, **Secrets and variables**, **Actions**, add two
   repository secrets with the same values you used for Tracker:
   - `CLOUDFLARE_ACCOUNT_ID`
   - `CLOUDFLARE_API_TOKEN` (if you no longer have it, create a new one: Cloudflare,
     My Profile, API Tokens, Create Token, template **Edit Cloudflare Workers**)
2. **Actions** tab, **Deploy push server**, **Run workflow**. The run summary shows the
   server address, for example `https://lithuanian-push.<you>.workers.dev`.

Later changes to `push-worker/` deploy automatically when merged to `main`.

If the app is not hosted at `https://oluwafemi02.github.io/...`, change `ALLOWED_ORIGIN`
in `wrangler.toml`.

## Connect your iPhone

1. In Safari open the app, tap **Share**, **Add to Home Screen**.
2. Open it from the Home Screen, go to **Profile**, **Reminders on this phone**.
3. Paste the server address and tap **Turn on reminders**, then **Allow**.
4. Tap **Send test reminder** and lock the phone. It should arrive within seconds.

If you delete and re-add the app to the Home Screen, turn reminders on again (iOS gives
the new install a new subscription).

## By hand instead (Node.js 20+)

```bash
cd push-worker && npm install && npx wrangler login
npx wrangler kv namespace create DEVICES   # put the id in wrangler.toml
npm run keys                               # then paste each when asked:
npx wrangler secret put VAPID_PUBLIC_KEY
npx wrangler secret put VAPID_PRIVATE_JWK
npm run deploy
```

`npm test` runs the encryption and reminder-timing tests. `npm run logs` streams live logs.

## Routes

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/vapid` | Public key for subscribing |
| POST | `/register` | Save a phone's push subscription |
| POST | `/sync` | Update reminder times and progress |
| POST | `/test` | Send a test push now |
| DELETE | `/device` | Forget this phone |

POST and DELETE need `Authorization: Bearer <secret>`; the app creates the secret.
