# Transcript Intelligence Dashboard

AI-powered sales transcript analyzer that extracts objections, opportunities, messaging themes, and generates marketing collateral recommendations. Built for HyperVerge's sales team but works with any sales call transcript.

## What It Does

1. **Transcript Ingestion** — Paste transcripts from Oliv AI, Gong, Chorus, Fireflies, or any text format
2. **AI-Powered Analysis** — Extracts key phrases, sentiment, deal signals using Claude AI
3. **Objection Flagging** — Identifies and categorizes: Pricing, Already Automated, Competitor Features/Pricing, Fear of Automation, Integration Concerns, Data Security, Timeline
4. **Opportunity Detection** — Finds: Pain Points, Module Interest, Expansion Potential, Urgency/Budget Signals, Champion Identification
5. **Messaging Themes** — Derives broad marketing themes with priority ranking
6. **Marketing Suggestions** — Recommends specific collateral (case studies, blog posts, one-pagers, etc.) with the ability to generate full content
7. **Aggregated Dashboard** — Cross-transcript intelligence showing patterns across all conversations

## Tech Stack

- **Backend**: Node.js + Express
- **Frontend**: React 18
- **AI**: Anthropic Groq API (Sonnet 4)
- **Deployment**: Render (free tier compatible)

## Quick Start (Local)

```bash
# 1. Clone and install
git clone <your-repo-url>
cd transcript-intelligence
npm install

# 2. Set up environment
cp .env.example .env
# Edit .env and add your Groq API key

# 3. Build the frontend
npm run build

# 4. Start the server
npm start
# Open http://localhost:3001
```

## Deploy to Render

### Option A: One-Click (with render.yaml)

1. Push this repo to GitHub
2. Go to [Render Dashboard](https://dashboard.render.com)
3. Click **New** → **Blueprint**
4. Connect your GitHub repo
5. Render will detect `render.yaml` and set up everything
6. Add your `GROQ_API_KEY` in the Environment Variables section
7. Deploy!

### Option B: Manual Setup

1. Push this repo to GitHub
2. Go to [Render Dashboard](https://dashboard.render.com)
3. Click **New** → **Web Service**
4. Connect your GitHub repo
5. Configure:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Environment Variables**: Add `GROQ_API_KEY` = your key
6. Deploy!

Your app will be live at `https://your-app-name.onrender.com`

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/analyze` | POST | Analyze a transcript (body: `{transcript, title?, source?}`) |
| `/api/analyses` | GET | List all analyses |
| `/api/analysis/:id` | GET | Get single analysis |
| `/api/analysis/:id` | DELETE | Delete an analysis |
| `/api/aggregate` | GET | Aggregated insights across all transcripts |
| `/api/generate-collateral` | POST | Generate marketing content for a suggestion |

## HyperVerge Context

The analyzer is pre-configured with HyperVerge's product context:
- Application Intake module
- Cash Flow Analysis module
- CLEAR/TLO/LexisNexis Review module
- Industry Classification module
- HyperVerge One platform

This context helps the AI generate more relevant objection counters, opportunity mapping, and marketing suggestions tied to specific product modules.

## Extending

- **Add a database**: Replace the in-memory `Map()` store with PostgreSQL/MongoDB for persistence
- **User auth**: Add authentication for team-specific dashboards
- **Webhook integration**: Connect to Oliv AI / Gong webhooks for automatic transcript ingestion
- **Export**: Add CSV/PDF export for reports
- **Slack notifications**: Alert the team when high-priority objections or opportunities are detected
