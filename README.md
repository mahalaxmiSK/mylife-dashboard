# MyLife Dashboard

A personal dashboard for routines, emotions, habits, reading, and challenges.

**Live:** https://mahalaxmisk.github.io/mylife-dashboard/

## Where your data lives

In your browser, in IndexedDB. There is no server and no account — nothing you
type ever leaves your device.

The tradeoff is that **your laptop and your phone hold separate data**. They do
not sync. Use the backup controls at the bottom of the home screen to move
history between devices:

- **Download backup** saves a `.json` file with everything.
- **Restore** loads that file back. It *replaces* what is on the device, so
  restore onto the device you want to overwrite, not the one holding good data.

Clearing your browsing data for this site erases everything. Take a backup
first. Worth doing occasionally regardless.

## Deploying

Pushing to `master` builds and publishes automatically. One-time setup:

**Settings → Pages → Build and deployment → Source: GitHub Actions**

Then watch the **Actions** tab.

## Running locally

```bash
cd mylife-app
npm install
npm start        # http://localhost:4200
```

Local and deployed versions keep separate data — different origins, different
IndexedDB stores.

## Adding sync later

The six data services in `mylife-app/src/app/core/services/` are the only files
that touch storage, and each exposes the same methods regardless of backend.
Swapping to a hosted database means rewriting those six against a client
library; nothing in the components changes.
