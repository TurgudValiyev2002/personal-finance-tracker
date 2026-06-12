# Personal Finance Tracker

A clean browser app for tracking daily costs, earnings, and savings. The app is designed for simple personal use: enter the amount, date, category, and description, then review monthly totals, all-time savings, category statistics, and transaction history.

## What This App Does

- Records costs and earnings as separate entry types.
- Uses categories such as accommodation, transport, internet, food, restaurant, entertainment, travel, and other.
- Shows monthly total costs, total earnings, and monthly savings.
- Shows current all-time savings in the left sidebar.
- Supports month navigation, date filters, type filters, and category filters.
- Gives statistics with daily activity, category spending, and savings trend charts.
- Saves data in the browser using `localStorage`.
- Exports JSON backups and CSV transaction files.
- Imports JSON backups when moving to another browser or computer.

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
