# Firebase setup for phone-laptop synchronization

1. Create a project at https://console.firebase.google.com/.
2. Add a Web app and copy its Firebase configuration into `assets/js/firebase-config.js`.
3. In **Authentication > Sign-in method**, enable **Google**.
4. In **Authentication > Settings > Authorized domains**, add your GitHub Pages domain, for example `USERNAME.github.io`.
5. Create **Cloud Firestore** in production mode.
6. Publish these Firestore rules:

```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

7. Upload the updated files to GitHub Pages. Sign into the same Google account on phone and laptop, then press **Đồng bộ**.

Synced data includes history, saved progress and Auto Mix usage. Each Firebase UID can read and write only its own records under the rules above.
