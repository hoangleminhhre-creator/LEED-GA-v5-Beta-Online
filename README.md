# LEED GA v5 Trainer Online

Static offline-capable LEED GA training application.

## Publish with GitHub Pages

1. Upload all files in this folder to the repository root.
2. In GitHub, open **Settings > Pages**.
3. Under **Build and deployment**, set **Source** to **GitHub Actions**.
4. Open **Actions > Deploy LEED GA Trainer to GitHub Pages** and run the workflow.
5. The public URL will normally be `https://YOUR-USERNAME.github.io/REPOSITORY/`.

## Update later

Replace only the changed files under `data/` or `assets/`, commit to `main`, and GitHub Pages will redeploy automatically.

## Privacy note

Attempts and history are stored in the visitor's browser localStorage. They are not uploaded to GitHub.

## Cross-device sync
Phone-laptop sync uses Firebase Authentication (Google) and Cloud Firestore. Configure `assets/js/firebase-config.js` and follow `FIREBASE_SETUP.md` before publishing.
