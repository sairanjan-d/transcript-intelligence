const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const Groq = require('groq-sdk');
const multer = require('multer');
const { pool, initDB } = require('./db');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// File upload config
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const allowed = ['.txt', '.csv', '.md', '.text', '.log', '.vtt', '.srt'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext) || file.mimetype.startsWith('text/')) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${ext}. Use .txt, .csv, .md, .vtt, or .srt`));
    }
  }
});

// Serve static frontend
app.use(express.static(path.join(__dirname, '..', 'client', 'build')));

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// HyperVerge context for the AI
const HYPERVERGE_CONTEXT = `
HyperVerge provides AI Agents for Small Business Underwriting. Key product modules:
1. Application Intake - Email parsing, document classification, PDF extraction, CRM syncing (97% automation, ~30 sec)
2. Cash Flow Analysis - Bank statement analysis, fraud detection, revenue/alt lender identification (98% accuracy, <5 sec)
3. CLEAR/TLO/LexisNexis Review - Risk intelligence, UCCs, liens, criminal records extraction (~15 sec, 80% auto-approved)
4. Industry Classification - AI-based SIC/NAICS prediction from multi-source data (80% top-1 accuracy, ~30-75 sec)

Key value propositions:
- Cuts time-to-offer from hours to minutes
- 1B+ customers onboarded, 450+ enterprise clients
- ISO certified, NIST FRVT #3, DHS S&T benchmarks
- Modular architecture (use entire journey or 1 module)
- No-code workflows via HyperVerge One platform
- Competitive pricing, fastest go-live
- Clients include Kapitus, Expansion Capital Group, Fundkite, HSBC, Revolut

Target personas: Operations, Underwriting, Risk, Product teams at small business lenders/MCA companies.
Common pain points in the market: Manual underwriting TAT, inconsistent formats, scanned PDF parsing, fraud risk, subjective industry tagging, multiple vendor management.
`;

const ANALYSIS_PROMPT = `You are an expert sales intelligence analyst for a B2B SaaS company in fintech/lending automation. Analyze the following sales call transcript and extract structured intelligence.

${HYPERVERGE_CONTEXT}

Return a JSON object with EXACTLY this structure. Return ONLY valid JSON — no markdown, no code fences, no commentary before or after:
{
  "summary": "2-3 sentence summary of the conversation",
  "prospect": {
    "name": "Company or person name if mentioned",
    "role": "Role/title if mentioned",
    "company_size": "Size indicator if mentioned",
    "industry_segment": "Their specific segment within lending/fintech"
  },
  "key_phrases": [
    {"phrase": "exact or near-exact quote", "context": "why this matters", "sentiment": "positive|negative|neutral"}
  ],
  "objections": [
    {
      "category": "One of: Pricing|Already Automated|Competitor Features|Competitor Pricing|Fear of Automation|Integration Concerns|Data Security|Timeline|Other",
      "detail": "Specific objection stated",
      "severity": "high|medium|low",
      "suggested_response": "How to counter this objection",
      "quote": "Relevant quote from transcript if available"
    }
  ],
  "opportunities": [
    {
      "category": "One of: Pain Point|Module Interest|Expansion Potential|Urgency Signal|Budget Signal|Champion Identified|Other",
      "detail": "Specific opportunity identified",
      "strength": "high|medium|low",
      "modules_relevant": ["Which HyperVerge modules address this"],
      "quote": "Relevant quote from transcript if available"
    }
  ],
  "modules_discussed": [
    {
      "module": "Module name",
      "interest_level": "high|medium|low|mentioned",
      "context": "How it came up"
    }
  ],
  "messaging_themes": [
    {
      "theme": "Core messaging theme derived from this conversation",
      "rationale": "Why this theme resonates based on conversation signals",
      "target_emotion": "What emotion/need this addresses",
      "priority": "high|medium|low"
    }
  ],
  "marketing_suggestions": [
    {
      "type": "One of: Case Study|Blog Post|Email Sequence|One-Pager|Video|Webinar|ROI Calculator|Comparison Sheet|Social Post|Landing Page",
      "title": "Suggested title/topic",
      "description": "What it should cover and why",
      "addresses": "Which objection or opportunity this solves",
      "priority": "high|medium|low",
      "outline": "Brief 3-5 point outline of the content"
    }
  ],
  "next_steps": ["Recommended follow-up actions"],
  "deal_signals": {
    "buying_stage": "One of: Awareness|Consideration|Decision|Negotiation|Closed",
    "urgency": "high|medium|low",
    "confidence_score": 0.0-1.0,
    "blockers": ["Key blockers to closing"]
  }
}

Important: If a category has no items, return an empty array. Always return valid JSON. Be thorough but accurate - don't fabricate information not present in the transcript.

TRANSCRIPT:
`;

// Helper to call Groq
async function callLLM(prompt, jsonMode = true) {
  const options = {
    messages: [{ role: 'user', content: prompt }],
    model: 'llama-3.3-70b-versatile',
    temperature: 0.3,
    max_tokens: 4096,
  };
  if (jsonMode) options.response_format = { type: 'json_object' };
  const completion = await groq.chat.completions.create(options);
  return completion.choices[0].message.content;
}

// ─── CHUNKING LOGIC ───
// Groq free tier has a ~6000 token context window budget for input after the prompt.
// We split large transcripts into chunks and merge results.

function splitTranscript(text, maxChars = 12000) {
  if (text.length <= maxChars) return [text];

  const chunks = [];
  const lines = text.split('\n');
  let current = '';

  for (const line of lines) {
    if (current.length + line.length + 1 > maxChars && current.length > 0) {
      chunks.push(current.trim());
      current = '';
    }
    current += line + '\n';
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

function mergeAnalyses(results) {
  if (results.length === 1) return results[0];

  const merged = {
    summary: results.map(r => r.summary).filter(Boolean).join(' '),
    prospect: results[0].prospect || {},
    key_phrases: [],
    objections: [],
    opportunities: [],
    modules_discussed: [],
    messaging_themes: [],
    marketing_suggestions: [],
    next_steps: [],
    deal_signals: results[results.length - 1].deal_signals || results[0].deal_signals || null,
  };

  // Fill prospect from first chunk that has data
  for (const r of results) {
    if (r.prospect?.name && !merged.prospect.name) merged.prospect = { ...merged.prospect, ...r.prospect };
  }

  // Concatenate arrays, dedup by detail/phrase/theme text
  const seen = new Set();
  for (const r of results) {
    for (const kp of (r.key_phrases || [])) {
      const key = kp.phrase?.toLowerCase();
      if (key && !seen.has(key)) { seen.add(key); merged.key_phrases.push(kp); }
    }
    for (const obj of (r.objections || [])) {
      const key = obj.detail?.toLowerCase();
      if (key && !seen.has(key)) { seen.add(key); merged.objections.push(obj); }
    }
    for (const opp of (r.opportunities || [])) {
      const key = opp.detail?.toLowerCase();
      if (key && !seen.has(key)) { seen.add(key); merged.opportunities.push(opp); }
    }
    for (const mod of (r.modules_discussed || [])) {
      const key = mod.module?.toLowerCase();
      if (key && !seen.has(key)) { seen.add(key); merged.modules_discussed.push(mod); }
    }
    for (const t of (r.messaging_themes || [])) {
      const key = t.theme?.toLowerCase()?.substring(0, 40);
      if (key && !seen.has(key)) { seen.add(key); merged.messaging_themes.push(t); }
    }
    for (const s of (r.marketing_suggestions || [])) {
      const key = s.title?.toLowerCase();
      if (key && !seen.has(key)) { seen.add(key); merged.marketing_suggestions.push(s); }
    }
    for (const step of (r.next_steps || [])) {
      const key = step?.toLowerCase()?.substring(0, 40);
      if (key && !seen.has(key)) { seen.add(key); merged.next_steps.push(step); }
    }
  }

  return merged;
}

async function analyzeTranscript(transcript) {
  const chunks = splitTranscript(transcript);
  console.log(`Processing transcript: ${transcript.length} chars, ${chunks.length} chunk(s)`);

  const results = [];
  for (let i = 0; i < chunks.length; i++) {
    const chunkNote = chunks.length > 1
      ? `\n\n[NOTE: This is part ${i + 1} of ${chunks.length} of a long transcript. Analyze this section thoroughly.]\n\n`
      : '';
    const responseText = await callLLM(ANALYSIS_PROMPT + chunkNote + chunks[i]);

    let parsed;
    try {
      const cleaned = responseText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : cleaned);
    } catch (parseErr) {
      console.error(`Chunk ${i + 1} parse error:`, parseErr);
      console.error('Raw:', responseText.substring(0, 300));
      continue; // skip failed chunks
    }
    results.push(parsed);

    // Rate limit pause between chunks (Groq free: 30 RPM)
    if (i < chunks.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2500));
    }
  }

  if (results.length === 0) throw new Error('All chunks failed to parse. Try a shorter transcript.');
  return mergeAnalyses(results);
}

// ─── ROUTES ───

// Health check
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'healthy', db: 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'unhealthy', db: 'disconnected', error: err.message });
  }
});

// File upload endpoint
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    let text = req.file.buffer.toString('utf-8');

    // Clean up CSV format: if it looks like CSV with columns, extract text column
    if (req.file.originalname.endsWith('.csv')) {
      const lines = text.split('\n');
      // If first line looks like headers, try to extract conversation text
      if (lines.length > 1 && lines[0].includes(',')) {
        const headers = lines[0].toLowerCase();
        // Common transcript CSV patterns: just join non-header lines
        text = lines.slice(1).join('\n');
      }
    }

    // Clean up VTT/SRT subtitle formats
    if (req.file.originalname.endsWith('.vtt') || req.file.originalname.endsWith('.srt')) {
      text = text
        .replace(/^WEBVTT.*$/m, '')
        .replace(/^\d+$/gm, '')
        .replace(/\d{2}:\d{2}:\d{2}[.,]\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}[.,]\d{3}/g, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    }

    res.json({
      text: text.trim(),
      filename: req.file.originalname,
      size: req.file.size,
      characters: text.trim().length,
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: err.message || 'File upload failed' });
  }
});

// Analyze a transcript (now with chunking)
app.post('/api/analyze', async (req, res) => {
  const client = await pool.connect();
  try {
    const { transcript, source = 'manual', title = '' } = req.body;

    if (!transcript || transcript.trim().length < 50) {
      return res.status(400).json({ error: 'Transcript must be at least 50 characters' });
    }

    const id = uuidv4();
    const finalTitle = title || `Transcript ${Date.now()}`;

    // Insert transcript
    await client.query(
      `INSERT INTO transcripts (id, title, transcript, source, status) VALUES ($1, $2, $3, $4, 'analyzing')`,
      [id, finalTitle, transcript, source]
    );

    // Analyze with chunking support
    const analysis = await analyzeTranscript(transcript);

    // Insert analysis
    await client.query(
      `INSERT INTO analyses (id, title, source, summary, prospect, key_phrases, objections, opportunities, modules_discussed, messaging_themes, marketing_suggestions, next_steps, deal_signals)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        id, finalTitle, source,
        analysis.summary || '',
        JSON.stringify(analysis.prospect || {}),
        JSON.stringify(analysis.key_phrases || []),
        JSON.stringify(analysis.objections || []),
        JSON.stringify(analysis.opportunities || []),
        JSON.stringify(analysis.modules_discussed || []),
        JSON.stringify(analysis.messaging_themes || []),
        JSON.stringify(analysis.marketing_suggestions || []),
        JSON.stringify(analysis.next_steps || []),
        JSON.stringify(analysis.deal_signals || null)
      ]
    );

    await client.query(`UPDATE transcripts SET status = 'complete' WHERE id = $1`, [id]);

    const row = await client.query(`SELECT * FROM analyses WHERE id = $1`, [id]);
    const result = formatAnalysisRow(row.rows[0]);

    res.json({ id, analysis: result });
  } catch (err) {
    console.error('Analysis error:', err);
    res.status(500).json({ error: 'Analysis failed: ' + err.message });
  } finally {
    client.release();
  }
});

// Get single analysis
app.get('/api/analysis/:id', async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM analyses WHERE id = $1`, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Analysis not found' });
    res.json(formatAnalysisRow(result.rows[0]));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all analyses
app.get('/api/analyses', async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM analyses ORDER BY created_at DESC`);
    res.json(result.rows.map(formatAnalysisRow));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Aggregated insights
app.get('/api/aggregate', async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM analyses ORDER BY created_at DESC`);
    const allAnalyses = result.rows.map(formatAnalysisRow);

    if (allAnalyses.length === 0) {
      return res.json({ empty: true, message: 'No analyses yet' });
    }

    const objectionMap = {};
    const opportunityMap = {};
    const moduleMap = {};
    const themeMap = {};
    const marketingSuggestions = [];
    const buyingStages = {};
    let totalConfidence = 0;

    allAnalyses.forEach(a => {
      (a.objections || []).forEach(obj => {
        if (!objectionMap[obj.category]) {
          objectionMap[obj.category] = { count: 0, severity_scores: [], details: [], suggested_responses: [] };
        }
        objectionMap[obj.category].count++;
        objectionMap[obj.category].severity_scores.push(obj.severity === 'high' ? 3 : obj.severity === 'medium' ? 2 : 1);
        objectionMap[obj.category].details.push(obj.detail);
        if (obj.suggested_response) objectionMap[obj.category].suggested_responses.push(obj.suggested_response);
      });

      (a.opportunities || []).forEach(opp => {
        if (!opportunityMap[opp.category]) {
          opportunityMap[opp.category] = { count: 0, strength_scores: [], details: [], modules: [] };
        }
        opportunityMap[opp.category].count++;
        opportunityMap[opp.category].strength_scores.push(opp.strength === 'high' ? 3 : opp.strength === 'medium' ? 2 : 1);
        opportunityMap[opp.category].details.push(opp.detail);
        (opp.modules_relevant || []).forEach(m => {
          if (!opportunityMap[opp.category].modules.includes(m)) opportunityMap[opp.category].modules.push(m);
        });
      });

      (a.modules_discussed || []).forEach(mod => {
        if (!moduleMap[mod.module]) moduleMap[mod.module] = { count: 0, interest_levels: [] };
        moduleMap[mod.module].count++;
        moduleMap[mod.module].interest_levels.push(mod.interest_level);
      });

      (a.messaging_themes || []).forEach(theme => {
        const key = theme.theme.toLowerCase().substring(0, 50);
        if (!themeMap[key]) {
          themeMap[key] = { theme: theme.theme, count: 0, priority_scores: [], rationales: [], emotions: [] };
        }
        themeMap[key].count++;
        themeMap[key].priority_scores.push(theme.priority === 'high' ? 3 : theme.priority === 'medium' ? 2 : 1);
        themeMap[key].rationales.push(theme.rationale);
        if (theme.target_emotion && !themeMap[key].emotions.includes(theme.target_emotion)) {
          themeMap[key].emotions.push(theme.target_emotion);
        }
      });

      (a.marketing_suggestions || []).forEach(s => marketingSuggestions.push(s));

      if (a.deal_signals) {
        const stage = a.deal_signals.buying_stage || 'Unknown';
        buyingStages[stage] = (buyingStages[stage] || 0) + 1;
        totalConfidence += (a.deal_signals.confidence_score || 0);
      }
    });

    const rankedObjections = Object.entries(objectionMap)
      .map(([category, data]) => ({
        category, count: data.count,
        avg_severity: (data.severity_scores.reduce((a, b) => a + b, 0) / data.severity_scores.length).toFixed(1),
        top_details: [...new Set(data.details)].slice(0, 5),
        top_responses: [...new Set(data.suggested_responses)].slice(0, 3),
        priority_score: data.count * (data.severity_scores.reduce((a, b) => a + b, 0) / data.severity_scores.length)
      }))
      .sort((a, b) => b.priority_score - a.priority_score);

    const rankedOpportunities = Object.entries(opportunityMap)
      .map(([category, data]) => ({
        category, count: data.count,
        avg_strength: (data.strength_scores.reduce((a, b) => a + b, 0) / data.strength_scores.length).toFixed(1),
        top_details: [...new Set(data.details)].slice(0, 5),
        relevant_modules: data.modules,
        priority_score: data.count * (data.strength_scores.reduce((a, b) => a + b, 0) / data.strength_scores.length)
      }))
      .sort((a, b) => b.priority_score - a.priority_score);

    const rankedModules = Object.entries(moduleMap)
      .map(([module, data]) => ({
        module, mention_count: data.count,
        interest_breakdown: data.interest_levels.reduce((acc, l) => { acc[l] = (acc[l] || 0) + 1; return acc; }, {})
      }))
      .sort((a, b) => b.mention_count - a.mention_count);

    const rankedThemes = Object.values(themeMap)
      .map(t => ({
        theme: t.theme, frequency: t.count,
        avg_priority: (t.priority_scores.reduce((a, b) => a + b, 0) / t.priority_scores.length).toFixed(1),
        rationales: [...new Set(t.rationales)].slice(0, 3),
        emotions: t.emotions,
        priority_score: t.count * (t.priority_scores.reduce((a, b) => a + b, 0) / t.priority_scores.length)
      }))
      .sort((a, b) => b.priority_score - a.priority_score);

    const suggestionTypeMap = {};
    marketingSuggestions.forEach(s => {
      const key = `${s.type}-${s.title}`.toLowerCase();
      if (!suggestionTypeMap[key]) suggestionTypeMap[key] = { ...s, frequency: 1 };
      else suggestionTypeMap[key].frequency++;
    });
    const rankedSuggestions = Object.values(suggestionTypeMap)
      .sort((a, b) => {
        const p = v => v === 'high' ? 3 : v === 'medium' ? 2 : 1;
        return (b.frequency * p(b.priority)) - (a.frequency * p(a.priority));
      })
      .slice(0, 15);

    res.json({
      total_transcripts: allAnalyses.length,
      objections: rankedObjections,
      opportunities: rankedOpportunities,
      modules: rankedModules,
      messaging_themes: rankedThemes,
      marketing_suggestions: rankedSuggestions,
      pipeline_overview: {
        buying_stages: buyingStages,
        avg_confidence: allAnalyses.length > 0 ? (totalConfidence / allAnalyses.length).toFixed(2) : 0
      },
      last_updated: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete analysis
app.delete('/api/analysis/:id', async (req, res) => {
  try {
    await pool.query(`DELETE FROM transcripts WHERE id = $1`, [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generate marketing collateral
app.post('/api/generate-collateral', async (req, res) => {
  try {
    const { suggestion, context } = req.body;

    const prompt = `You are a fintech B2B marketing expert. Generate detailed marketing collateral based on this brief.

${HYPERVERGE_CONTEXT}

COLLATERAL TYPE: ${suggestion.type}
TITLE: ${suggestion.title}
DESCRIPTION: ${suggestion.description}
ADDRESSES: ${suggestion.addresses}
OUTLINE: ${suggestion.outline || 'None provided'}
ADDITIONAL CONTEXT: ${context || 'None'}

Generate the full content for this marketing piece. Make it compelling, data-driven, and specific to the lending/MCA industry. Use concrete numbers from HyperVerge's capabilities where relevant. Format it in clean markdown.`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.5,
      max_tokens: 3000,
    });

    res.json({ content: completion.choices[0].message.content });
  } catch (err) {
    console.error('Collateral generation error:', err);
    res.status(500).json({ error: 'Failed to generate collateral' });
  }
});

// Catch-all: serve React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'build', 'index.html'));
});

// Helper
function formatAnalysisRow(row) {
  return {
    id: row.id,
    title: row.title,
    source: row.source,
    timestamp: row.created_at,
    summary: row.summary,
    prospect: row.prospect,
    key_phrases: row.key_phrases,
    objections: row.objections,
    opportunities: row.opportunities,
    modules_discussed: row.modules_discussed,
    messaging_themes: row.messaging_themes,
    marketing_suggestions: row.marketing_suggestions,
    next_steps: row.next_steps,
    deal_signals: row.deal_signals,
  };
}

// ─── START ───
async function start() {
  try {
    await initDB();
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (err) {
    console.error('Failed to start:', err);
    process.exit(1);
  }
}

start();
