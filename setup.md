# 🚀 Running Resona — Step by Step

## Prerequisites

- PHP 8.1+ with extensions:
  - `pdo`
  - `pdo_mysql`
  - `json`
  - `openssl`
  - `curl`
- A TiDB Cloud account (free tier) or local MySQL
- A Spotify for Developers account (free)
- Node.js for local frontend server (or any static file server)

---

# Step 1: Set up the Database

### 1a. Create a TiDB Cloud Cluster

Go to **TiDB Cloud**: https://tidbcloud.com

Create a **Free Serverless Tier** cluster.

### 1b. Get Your Connection Details

Obtain your:

- Host
- Port
- User
- Password

### 1c. Initialize the Database

```bash
# Navigate to the project
cd v1/database/src

# Run the init script
mysql -h <host>.tidbcloud.com -P 4000 -u <user> -p < init.sql
```

### 1d. Configure Environment Variables

Rename `.env.example` to `.env` and update it with your values:

```env
DB_HOST=<host>.tidbcloud.com
DB_PORT=4000
DB_NAME=resona
DB_USER=<user>
DB_PASSWORD=<password>
```

---

# Step 2: Set up Spotify API

### 2a. Open the Spotify Developer Dashboard

https://developer.spotify.com/dashboard/

### 2b. Create an App

Click **Create App**

**Name:** `Resona`

### 2c. Add Redirect URI

```
http://localhost:8000/api/auth/spotify/callback
```

### 2d. Save Credentials

Copy your:

- Client ID
- Client Secret

### 2e. Configure Backend Environment

Copy:

```
backend/.env.example
```

to

```
backend/.env
```

Then fill in:

```env
SPOTIFY_CLIENT_ID=your-client-id
SPOTIFY_CLIENT_SECRET=your-client-secret
SPOTIFY_REDIRECT_URI=http://localhost:8000/api/auth/spotify/callback

JWT_SECRET=any-random-string-at-least-32-chars
JWT_ACCESS_EXPIRY=900
JWT_REFRESH_EXPIRY=604800

APP_ENV=development
APP_URL=http://localhost:3000
CORS_ALLOWED_ORIGIN=http://localhost:3000
```

---

# Step 3: Start the Backend (PHP)

All backend files are located in:

```
forge/output/v1/backend/
```

or

```
v1/backend/
```

Navigate to the backend source:

```bash
cd v1/backend/src
```

Start PHP's built-in development server:

```bash
php -S localhost:8000 index.php
```

✅ Backend running at:

```
http://localhost:8000
```

Test it:

```bash
curl http://localhost:8000/api/user/profile
```

Expected result:

```
401 (no auth token)
```

This means the backend is working.

---

# Step 4: Start the Frontend

All frontend files are in:

```
forge/output/v1/frontend/
```

## Option A — Using PHP (Simplest)

```bash
# In a new terminal
cd v1/frontend/src

php -S localhost:3000
```

## Option B — Using Node.js

```bash
npx serve v1/frontend/src -l 3000
```

✅ Frontend running at:

```
http://localhost:3000
```

> **Important:** `script.js` already handles API base URL switching. It automatically uses `localhost:8000` when accessed from `localhost` or `127.0.0.1`.

---

# Step 5: Open the App

Navigate to:

```
http://localhost:3000
```

1. You'll see the Login page with a **Connect with Spotify** button.
2. Click it.
3. You'll be redirected to Spotify's authorization page.
4. Authorize the application.
5. You'll be redirected back with tokens.
6. You'll land on the Feed page (empty initially—add friends!).
7. Navigate using the bottom navigation:

```
Feed | Friends | Messages | Stats
```

---

# Step 6: Set up the Sync Cron Job

For playback polling to work, trigger it manually or schedule it.

## Manual Test

```bash
curl http://localhost:8000/api/internal/sync/poll
```

## Production (Render)

Add a cron job in the Render dashboard.

**URL**

```
https://your-app.onrender.com/api/internal/sync/poll
```

**Schedule**

```
Every 2 minutes
```