# Personal Finance Tracker

A clean browser app for tracking daily costs, earnings, and savings. The app is designed for simple personal use: enter the amount, date, category, and description, then review monthly totals, all-time savings, category statistics, and transaction history.

## What This App Does

- Records costs and earnings as separate entry types.
- Uses categories such as accommodation, transport, internet, food, restaurant, entertainment, travel, and other.
- Shows monthly total costs, total earnings, and monthly savings.
- Shows current all-time savings in the left sidebar.
- Lets a finished month be submitted as a monthly report.
- Locks submitted months so their transactions cannot be added, edited, or deleted.
- Uses a dialog window for add and edit actions.
- Supports light and dark mode.
- Changes the month banner design for seasonal months such as March, September, and December.
- Supports month navigation, date filters, type filters, and category filters.
- Gives general statistics with a category pie chart, top category values, KPI cards, and recommendations.
- Opens detailed cost analysis and profit analysis in separate windows.
- Shows seasonal month banners with lightweight animated effects, including summer sun movement and rainy months.
- Automatically adapts to mobile screens with bottom navigation, card-style transaction rows, and phone-sized dialogs.
- Includes a Personalized AI Advisor page with common questions, a Hugging Face backend proxy, model fallback support, and a local fallback recommendation engine.
- Supports Firebase-ready login, registration, email activation, profile view, and cloud database sync.

## Secure AI Advisor Backend

The browser app does not contain an API key. The AI Advisor calls a Vercel serverless endpoint at `api/advisor.js`.

Set these environment variables in Vercel:

- `HF_TOKEN` - Hugging Face token with Inference Providers permission
- `HF_MODEL` - primary model, for example `meta-llama/Llama-3.3-70B-Instruct`
- `HF_FALLBACK_MODEL` - smaller fallback model, for example `mistralai/Mistral-7B-Instruct-v0.3`
- `ALLOWED_ORIGIN` - `https://turgudvaliyev2002.github.io`
- `OPENAI_API_KEY` - optional only if OpenAI fallback is wanted
- `OPENAI_MODEL` - optional OpenAI fallback model, for example `gpt-4.1-mini`
- `OPENAI_FALLBACK` - set to `true` only if OpenAI should be tried after Hugging Face

The backend tries Hugging Face first using the primary model, then the Hugging Face fallback model. If both hosted models fail, the browser keeps the app useful by showing the local finance recommendation fallback. Do not commit real API keys or tokens to this repository.
- Saves data in the browser using `localStorage`.
- Exports JSON backups and CSV transaction files.
- Imports JSON backups when moving to another browser or computer.

## Firebase Login And Database Setup

The app is prepared for Firebase Authentication and Firestore. Passwords are never stored in this repository or in browser `localStorage`.

1. Open the Firebase Console.
2. Create a project.
3. Add a Web app.
4. Copy the Firebase web config.
5. Replace `firebase-config.js` with your real config:

```js
window.FINANCE_FIREBASE_CONFIG = {
  apiKey: "YOUR_FIREBASE_WEB_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  appId: "YOUR_FIREBASE_WEB_APP_ID"
};
```

6. In Firebase Authentication, enable Email/Password sign-in.
7. In Firestore, create a database.
8. Use these Firestore security rules:

```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      match /finance/{document=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

After setup, each user gets their own private `users/{uid}` profile document and `users/{uid}/finance/default` finance document.

## Important Privacy Note

This first version is made for GitHub Pages. It does not use a backend database. Your financial entries stay in your browser and are not saved inside the GitHub repository.

Because browser storage can be cleared, export a JSON backup regularly. The JSON backup is the safest way to move or restore your data.

## Files

- `index.html` - app layout
- `styles.css` - visual design and responsive layout
- `app.js` - transaction logic, totals, filters, charts, import/export
- `manifest.webmanifest` - installable web app metadata
- `service-worker.js` - offline cache when hosted through HTTPS
- `assets/icon.svg` - app icon

## How To Use Locally

Open `index.html` in a browser. The app will work without installing dependencies.

## How To Host Permanently With GitHub Pages

1. Create a GitHub repository.
2. Push these files to the repository.
3. Go to repository `Settings`.
4. Open `Pages`.
5. Select `Deploy from a branch`.
6. Choose branch `main` and folder `/root`.
7. Open the GitHub Pages URL.

After that, the app is always available as a web page. The app files are hosted by GitHub, but the money entries are still stored privately in the browser where you use the app.

## Future Improvements

- Optional cloud sync with Supabase or Firebase.
- Password-protected encrypted local backup.
- Custom categories.
- Budget targets per month and per category.
- Multi-currency support.
