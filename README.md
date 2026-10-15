# Kainan – Restaurant Manager (Vue 3, Vite, Express, SQLite)

## Run it
```bash
npm install
npm run dev       # starts the Express API and Vite frontend
npm run build     # production frontend build in /dist
npm run server    # serve the production build and API after building
```
Open the URL Vite prints (usually http://localhost:5173). The menu API is proxied to the Express server on port 3001.

Menu items and inventory are stored in SQLite at `server/kainan.sqlite` and are created/seeded automatically on first server start. The file is kept out of version control. The API validates menu data and stock changes; order submission and cancellation update stock transactionally. Orders remain saved in the browser's local storage.

Requires Node.js 22+ for better-sqlite3.
