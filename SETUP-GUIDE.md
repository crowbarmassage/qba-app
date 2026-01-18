# MWBL App Setup Guide

## What You're Building
A mobile-friendly web app for the Muslim Women's Basketball League that lets players view schedules, standings, vote for Player of the Week, and lets admins enter scores and update game times.

## What You'll Need
- A computer (Mac or Windows)
- An internet connection
- About 30-45 minutes

## Overview of Steps
1. Install Node.js (one-time setup)
2. Create a free Supabase database
3. Set up the app files
4. Deploy to Vercel (free hosting)
5. Share the link with players!

---

# STEP 1: Install Node.js

Node.js is the software that runs the app. You only need to do this once.

### On Mac:
1. Go to https://nodejs.org
2. Click the big green button that says **"LTS"** (recommended)
3. Open the downloaded file and follow the installer
4. When done, open **Terminal** (press `Cmd + Space`, type "Terminal", hit Enter)
5. Type `node --version` and press Enter
6. You should see something like `v20.x.x` — this means it worked!

### On Windows:
1. Go to https://nodejs.org
2. Click the big green button that says **"LTS"** (recommended)
3. Run the downloaded `.msi` file and follow the installer
4. When done, open **Command Prompt** (press `Windows key`, type "cmd", hit Enter)
5. Type `node --version` and press Enter
6. You should see something like `v20.x.x` — this means it worked!

---

# STEP 2: Create Your Supabase Database

Supabase is a free database that stores all your league data (teams, games, scores, etc).

### 2.1 Create an Account
1. Go to https://supabase.com
2. Click **"Start your project"**
3. Sign up with your GitHub account (or create one at github.com first — it's free)

### 2.2 Create a New Project
1. Click **"New Project"**
2. Fill in:
   - **Name:** `mwbl` (or whatever you want)
   - **Database Password:** Create a strong password and **save it somewhere**
   - **Region:** Choose the closest to you (e.g., "East US" if you're on the East Coast)
3. Click **"Create new project"**
4. Wait 1-2 minutes while it sets up

### 2.3 Set Up the Database Tables
1. In your Supabase project, click **"SQL Editor"** in the left sidebar
2. Click **"New query"**
3. Open the `supabase-schema.sql` file from the zip (use Notepad or TextEdit)
4. Copy ALL the text from that file
5. Paste it into the SQL Editor
6. Click **"Run"** (or press Cmd+Enter / Ctrl+Enter)
7. You should see "Success" — your database is ready!

### 2.4 Get Your API Keys
1. Click **"Project Settings"** (gear icon) in the left sidebar
2. Click **"API"** in the settings menu
3. You'll see two important values — **copy these somewhere safe:**
   - **Project URL:** looks like `https://abc123xyz.supabase.co`
   - **anon public key:** a long string starting with `eyJ...`

---

# STEP 3: Set Up the App Files

### 3.1 Unzip the Download
1. Find the `mwbl-pwa-v2.zip` file you downloaded
2. Double-click to unzip it (or right-click → "Extract All" on Windows)
3. You should see a folder with files like `package.json`, `src/`, etc.

### 3.2 Open Terminal/Command Prompt in the Folder

**On Mac:**
1. Open **Terminal**
2. Type `cd ` (with a space after it)
3. Drag the unzipped folder into the Terminal window
4. Press Enter

**On Windows:**
1. Open the unzipped folder in File Explorer
2. Click in the address bar at the top
3. Type `cmd` and press Enter
4. A Command Prompt will open in that folder

### 3.3 Install Dependencies
In Terminal/Command Prompt, type:
```
npm install
```
Press Enter and wait (this downloads all the code libraries — may take 1-2 minutes).

### 3.4 Create Your Environment File
1. In the app folder, create a new file called `.env`
2. Open it in a text editor (Notepad, TextEdit, or VS Code)
3. Add these two lines, replacing with YOUR values from Step 2.4:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

4. Save the file

### 3.5 Test Locally (Optional but Recommended)
In Terminal/Command Prompt, type:
```
npm run dev
```
Then open http://localhost:5173 in your browser. You should see the app!

Press `Ctrl + C` to stop the local server when done testing.

---

# STEP 4: Deploy to Vercel (Free Hosting)

Vercel will host your app on the internet for free.

### 4.1 Create a GitHub Repository
1. Go to https://github.com and sign in (or create an account)
2. Click the **"+"** in the top right → **"New repository"**
3. Name it `mwbl-app` (or whatever you want)
4. Keep it **Public** (required for free Vercel hosting)
5. Click **"Create repository"**

### 4.2 Upload Your Code to GitHub

**Option A: Using GitHub Desktop (Easier)**
1. Download GitHub Desktop from https://desktop.github.com
2. Sign in with your GitHub account
3. Click **"Add"** → **"Add Existing Repository"**
4. Select your app folder
5. It will ask to create a repository — click **"Create Repository"**
6. Click **"Publish repository"**

**Option B: Using Terminal (If comfortable)**
```
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/mwbl-app.git
git push -u origin main
```

### 4.3 Deploy to Vercel
1. Go to https://vercel.com
2. Click **"Sign Up"** and use your GitHub account
3. Click **"Add New..."** → **"Project"**
4. Find your `mwbl-app` repository and click **"Import"**
5. **Important:** Before deploying, click **"Environment Variables"**
6. Add these two variables:
   - Name: `VITE_SUPABASE_URL` → Value: your Supabase URL
   - Name: `VITE_SUPABASE_ANON_KEY` → Value: your Supabase anon key
7. Click **"Deploy"**
8. Wait 1-2 minutes...
9. 🎉 **You'll get a URL like `mwbl-app.vercel.app` — this is your live app!**

---

# STEP 5: Customize Your League

### 5.1 Change Team Names
1. Go to your Supabase project
2. Click **"Table Editor"** in the left sidebar
3. Click on the **"teams"** table
4. Double-click any team name to edit it
5. Change the names, colors, and mottos to match your league

### 5.2 Add Players
1. In Table Editor, click on the **"players"** table
2. Click **"Insert"** → **"Insert row"**
3. Fill in:
   - `name`: Player's name
   - `team_id`: 1-6 (matching the team)
   - `jersey_number`: Their number
   - `is_captain`: true or false
   - `position`: guard, forward, or center
4. Repeat for all players

### 5.3 Change the Admin PIN
The default admin PIN is `1234`. To change it:
1. Open `src/App.jsx` in a text editor
2. Find the line that says `if (pin === '1234')`
3. Change `1234` to your desired PIN
4. Save the file
5. Push to GitHub (changes will auto-deploy to Vercel)

---

# STEP 6: Share With Your League!

### For Players (iPhone):
1. Send them the Vercel URL
2. Open in **Safari** (not Chrome!)
3. Tap the Share button → **"Add to Home Screen"**
4. The app icon appears on their home screen

### For Players (Android):
1. Send them the Vercel URL
2. Open in Chrome
3. Tap the menu → **"Add to Home Screen"** or **"Install App"**

### For Admins:
1. Open the app
2. Tap the 🔐 lock icon in the header
3. Enter the admin PIN
4. You'll see the Admin tab appear in the bottom nav

---

# Quick Reference: Admin Features

| Tab | What It Does |
|-----|--------------|
| 📝 Scores | Enter game results |
| 📅 Schedule | Change game dates/times |
| ⭐ POTW | Announce Player of the Week |
| ℹ️ Info | View stats, open Supabase |

---

# Troubleshooting

### "npm: command not found"
Node.js isn't installed properly. Restart your Terminal and try again, or reinstall Node.js.

### App shows "No teams loaded"
Your Supabase connection isn't working. Double-check your `.env` file has the correct URL and key.

### Changes aren't showing up
After editing code, you need to push to GitHub. Vercel auto-deploys within 1 minute.

### Players can't install on iPhone
They must use Safari (not Chrome) and iOS 16.4 or later.

---

# Need Help?

If you get stuck:
1. Check that all environment variables are set in Vercel
2. Check the Supabase SQL ran without errors
3. Make sure team names in the database match what's in the code

---

# Summary

| Service | Purpose | Cost |
|---------|---------|------|
| Node.js | Runs the app locally | Free |
| Supabase | Database | Free tier |
| GitHub | Stores your code | Free |
| Vercel | Hosts the app | Free tier |

**Total cost: $0**

Your app URL will be something like: `https://mwbl-app.vercel.app`

Enjoy the season! 🏀
