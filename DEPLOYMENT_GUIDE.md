# Transcript Intelligence — Complete Deployment Guide

Everything you need to go from the downloaded archive to a live, publicly accessible app on Render with persistent PostgreSQL storage.

---

## Prerequisites

Before you begin, make sure you have these accounts and tools ready.

**Accounts you'll need:**

A **Groq account** for the AI API (completely free). Go to console.groq.com, sign up with Google or email, then go to API Keys and click "Create API Key." Copy it somewhere safe — you'll need it during Render setup. This powers all the AI analysis using Llama 3.3 70B. The free tier gives you 30 requests per minute, which is more than enough. No credit card or billing setup required.

A **GitHub account** at github.com. Render deploys from Git repositories, so your code needs to be hosted on GitHub. A free account works perfectly.

A **Render account** at render.com. Sign up using your GitHub account for the smoothest experience — this lets Render access your repos directly. The free tier includes a web service and a PostgreSQL database, which is all you need.

**Tools to install on your computer:**

Git (version control) — download from git-scm.com if you don't have it. On Mac you can also install it via `xcode-select --install`. On Windows, the Git installer from git-scm.com includes Git Bash.

Node.js version 18 or higher — download from nodejs.org (LTS version recommended). This is needed if you want to test locally before deploying. Verify with `node --version` in your terminal.

---

## Step 1 — Unzip the Archive

Download the `transcript-intelligence.tar.gz` file from Claude's response. Then open a terminal and navigate to your preferred project directory.

```bash
# Navigate to where you want the project
cd ~/Projects

# Extract the archive
tar -xzf ~/Downloads/transcript-intelligence.tar.gz -C transcript-intelligence

# If the above gives errors on Windows, use 7-Zip or run in Git Bash
# Alternatively, rename to .tar.gz and extract with your OS's built-in tool

# Enter the project directory
cd transcript-intelligence
```

After extraction, your folder structure should look like this:

```
transcript-intelligence/
├── client/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── App.js
│   │   └── index.js
│   ├── build/          ← Pre-built frontend (ready to deploy)
│   └── package.json
├── server/
│   ├── index.js        ← Express server with PostgreSQL
│   └── db.js           ← Database connection and initialization
├── package.json        ← Root dependencies
├── render.yaml         ← Render deployment blueprint
├── .env.example        ← Environment variable template
├── .gitignore
└── README.md
```

---

## Step 2 — Create a GitHub Repository

You need to push this code to GitHub so Render can deploy it.

**Option A — Using the GitHub website and terminal:**

Go to github.com and click the "+" button in the top-right, then "New repository." Name it `transcript-intelligence` (or whatever you prefer). Leave it set to Public (or Private — both work with Render). Do NOT initialize with a README since we already have one. Click "Create repository."

GitHub will show you setup instructions. Back in your terminal, inside the project folder, run:

```bash
# Initialize git in your project
git init

# Add all files
git add .

# Create first commit
git commit -m "Initial commit: Transcript Intelligence Dashboard"

# Connect to your GitHub repo (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/transcript-intelligence.git

# Push to GitHub
git branch -M main
git push -u origin main
```

If prompted for credentials, enter your GitHub username and a Personal Access Token (not your password). You can create a token at github.com → Settings → Developer Settings → Personal Access Tokens → Tokens (classic). Give it "repo" scope.

**Option B — Using GitHub CLI (if installed):**

```bash
cd transcript-intelligence
git init
git add .
git commit -m "Initial commit: Transcript Intelligence Dashboard"
gh repo create transcript-intelligence --public --source=. --push
```

Verify your code is on GitHub by visiting `https://github.com/YOUR_USERNAME/transcript-intelligence` in your browser. You should see all the files listed.

---

## Step 3 — Set Up Render (Database + Web Service)

Now we'll deploy on Render. The `render.yaml` file in your repo automates most of the setup.

### 3a — Connect Render to GitHub

Go to dashboard.render.com and log in (use your GitHub account if you signed up that way).

If this is your first time, Render will ask to connect your GitHub account. Click "Configure" and grant access to either all repositories or specifically select `transcript-intelligence`.

### 3b — Deploy Using Blueprint

Click the **"New"** button in the top navigation bar, then select **"Blueprint"** from the dropdown.

Render will show your connected GitHub repos. Find and select `transcript-intelligence`, then click **"Apply."**

Render reads your `render.yaml` and will show you a plan to create two resources:
- **transcript-intel-db** — a free PostgreSQL database
- **transcript-intelligence** — a free web service

You'll see a field asking for the `GROQ_API_KEY` value. Paste your Groq API key here (the one you created in the prerequisites — it starts with `gsk_`).

Click **"Apply"** to start the deployment.

### 3c — Wait for Deployment

Render will now:
1. Create the PostgreSQL database (takes about 1-2 minutes)
2. Clone your GitHub repo
3. Run the build command: `npm install && npm run build` (installs dependencies and compiles the React frontend)
4. Start the server with `npm start`

The whole process takes about 3-5 minutes on the free tier. You can watch the logs in real-time by clicking on the web service name.

**What to look for in the logs:**

```
==> Build successful
==> Starting service
Database tables initialized successfully
Server running on port 10000
```

If you see "Database tables initialized successfully," everything is working.

### 3d — Access Your Live App

Once deployment is complete, Render shows a green "Live" badge. Your app URL will be something like:

```
https://transcript-intelligence.onrender.com
```

Click the URL to open your dashboard. You should see the Transcript Intelligence interface with the Upload tab ready to go.

---

## Step 4 — Test Your Deployment

Open your live URL in a browser. Here's how to verify everything works:

**Test 1 — Load the sample transcript.** On the Upload page, click "Load sample transcript." This fills in a pre-written sales conversation about Apex Funding. Click "Analyze Transcript" and wait 10-20 seconds for the AI to process it. You should see the Analysis view with objections, opportunities, deal signals, and marketing suggestions.

**Test 2 — Check persistence.** Refresh your browser page. Navigate to the Upload tab — your previous analysis should still appear under "Previous Analyses." This confirms PostgreSQL is storing data correctly.

**Test 3 — Check the aggregated dashboard.** Click the "Dashboard" tab. You should see aggregated stats from your analyzed transcript(s) — objection frequency charts, opportunity breakdowns, module interest, and messaging themes.

**Test 4 — Generate marketing collateral.** On any analysis, scroll down to "Recommended Marketing Collateral" and click "Generate Content" on any suggestion card. A modal should appear with AI-generated content within 10-15 seconds.

---

## Troubleshooting

Here are the most common issues and how to fix them.

**"Analysis failed" or API errors when analyzing a transcript:**
This almost always means the Groq API key is missing or invalid. In Render, go to your web service → Environment → check that `GROQ_API_KEY` is set and starts with `gsk_`. If you need to update it, paste the new key and Render will automatically restart the service.

**"Application error" or blank page when visiting the URL:**
Check the Render logs (web service → Logs tab). If you see "Cannot find module" errors, the build may have failed. Try triggering a manual deploy: go to your web service → Settings → scroll to "Manual Deploy" → click "Deploy latest commit."

**Database connection errors in logs:**
Verify the `DATABASE_URL` environment variable is set. In Render, go to your web service → Environment. You should see `DATABASE_URL` automatically populated (linked to your database). If it's missing, go to your database resource, copy the "Internal Connection String," and add it as `DATABASE_URL` in your web service's environment variables.

**Free tier cold starts (app is slow to load after inactivity):**
Render's free tier spins down your service after 15 minutes of no traffic. The first request after that takes 30-60 seconds while it spins back up. This is normal for the free tier. To avoid this, upgrade to Render's paid tier ($7/month) which keeps your service always running.

**Build fails with "react-scripts: not found":**
This means the client dependencies didn't install. In your terminal, make sure the `client/package.json` file exists and contains `react-scripts` in its dependencies. Push any fixes to GitHub and Render will automatically redeploy.

**"Free PostgreSQL databases expire after 90 days" notice:**
Render's free PostgreSQL has a 90-day lifespan. Before it expires, you'll need to either create a new free database and migrate, or upgrade to a paid database ($7/month for the Starter tier). Render sends email reminders before expiration.

---

## Optional: Running Locally

If you want to develop or test locally before deploying:

**Install PostgreSQL locally.** On Mac: `brew install postgresql@16 && brew services start postgresql@16`. On Ubuntu: `sudo apt install postgresql`. On Windows: download from postgresql.org.

Create a local database:

```bash
# Create the database
createdb transcript_intel

# Verify it works
psql -d transcript_intel -c "SELECT 1;"
```

Set up your environment:

```bash
# Copy the environment template
cp .env.example .env

# Edit .env and add your values:
# GROQ_API_KEY=gsk_your-key-here
# DATABASE_URL=postgresql://localhost:5432/transcript_intel
# PORT=3001
```

Install dependencies and run:

```bash
# Install server dependencies
npm install

# Build the React frontend
npm run build

# Start the server
npm start
```

Open `http://localhost:3001` in your browser.

---

## Optional: Custom Domain

If you want your app at a custom domain like `transcripts.yourdomain.com`:

In Render, go to your web service → Settings → Custom Domains. Click "Add Custom Domain" and enter your domain. Render will give you a CNAME record to add to your DNS provider. Add the CNAME record in your domain registrar (e.g., Namecheap, Cloudflare, GoDaddy). Wait for DNS propagation (usually 5-30 minutes). Render automatically provisions an SSL certificate.

---

## Updating the App

Whenever you push changes to your GitHub repo's `main` branch, Render automatically redeploys. The workflow is:

```bash
# Make your changes locally
# ...

# Commit and push
git add .
git commit -m "Description of changes"
git push origin main

# Render detects the push and redeploys automatically (takes 2-3 minutes)
```

---

## Architecture Summary

Here's how all the pieces fit together:

```
User's Browser
     │
     ▼
Render Web Service (Node.js + Express)
  ├── Serves React frontend (static files from client/build/)
  ├── /api/analyze → Calls Groq API → Stores results in PostgreSQL
  ├── /api/analyses → Reads all analyses from PostgreSQL
  ├── /api/aggregate → Computes cross-transcript insights from PostgreSQL
  └── /api/generate-collateral → Calls Groq API for marketing content
     │
     ▼
Render PostgreSQL
  ├── transcripts table (raw transcript text)
  └── analyses table (structured JSON analysis results)
     │
     ▼
Google Groq API (external, free tier)
  └── Processes transcripts and generates analysis/content
```

Data persists in PostgreSQL across server restarts, deployments, and service cold starts. The database is automatically backed up by Render daily.
