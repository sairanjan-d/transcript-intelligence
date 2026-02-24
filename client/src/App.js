import React, { useState, useEffect, useCallback } from 'react';

const API = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3001';

/* ─── STYLES ─── */
const injectStyles = () => {
  const css = `
    :root {
      --bg: #0a0b0f;
      --surface: #12131a;
      --surface2: #1a1b25;
      --surface3: #22232f;
      --border: #2a2b3a;
      --text: #e8e9ed;
      --text2: #9a9bb0;
      --text3: #6b6c80;
      --accent: #7c5cfc;
      --accent2: #a78bfa;
      --accent-glow: rgba(124, 92, 252, 0.15);
      --green: #34d399;
      --green-bg: rgba(52, 211, 153, 0.1);
      --red: #f87171;
      --red-bg: rgba(248, 113, 113, 0.1);
      --amber: #fbbf24;
      --amber-bg: rgba(251, 191, 36, 0.1);
      --blue: #60a5fa;
      --blue-bg: rgba(96, 165, 250, 0.1);
      --pink: #f472b6;
      --pink-bg: rgba(244, 114, 182, 0.1);
      --radius: 12px;
      --radius-sm: 8px;
      --font: 'DM Sans', -apple-system, sans-serif;
      --mono: 'JetBrains Mono', monospace;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      background: var(--bg); color: var(--text); font-family: var(--font);
      -webkit-font-smoothing: antialiased;
    }
    ::selection { background: var(--accent); color: white; }
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
    
    .app { min-height: 100vh; }
    
    /* Header */
    .header {
      padding: 20px 32px;
      border-bottom: 1px solid var(--border);
      display: flex; align-items: center; justify-content: space-between;
      backdrop-filter: blur(20px);
      background: rgba(10, 11, 15, 0.8);
      position: sticky; top: 0; z-index: 100;
    }
    .logo { display: flex; align-items: center; gap: 12px; }
    .logo-icon {
      width: 36px; height: 36px; border-radius: 10px;
      background: linear-gradient(135deg, var(--accent), #a78bfa);
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 14px; color: white;
    }
    .logo-text { font-size: 18px; font-weight: 600; letter-spacing: -0.3px; }
    .logo-sub { font-size: 12px; color: var(--text3); margin-top: 1px; }
    
    /* Nav tabs */
    .nav { display: flex; gap: 4px; background: var(--surface); padding: 4px; border-radius: 10px; }
    .nav-btn {
      padding: 8px 20px; border: none; border-radius: 8px; cursor: pointer;
      font-family: var(--font); font-size: 13px; font-weight: 500;
      background: transparent; color: var(--text2); transition: all 0.2s;
    }
    .nav-btn:hover { color: var(--text); background: var(--surface2); }
    .nav-btn.active { background: var(--accent); color: white; }
    
    /* Main content */
    .main { max-width: 1400px; margin: 0 auto; padding: 32px; }
    
    /* Cards */
    .card {
      background: var(--surface); border: 1px solid var(--border);
      border-radius: var(--radius); padding: 24px; margin-bottom: 20px;
    }
    .card-header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 16px;
    }
    .card-title { font-size: 15px; font-weight: 600; letter-spacing: -0.2px; }
    .card-badge {
      font-size: 11px; padding: 4px 10px; border-radius: 20px;
      font-weight: 500; font-family: var(--mono);
    }
    
    /* Grid layouts */
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; }
    .grid-4 { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 16px; }
    @media (max-width: 900px) { .grid-2, .grid-3, .grid-4 { grid-template-columns: 1fr; } }
    
    /* Stat cards */
    .stat-card {
      background: var(--surface); border: 1px solid var(--border);
      border-radius: var(--radius); padding: 20px;
    }
    .stat-label { font-size: 12px; color: var(--text3); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
    .stat-value { font-size: 28px; font-weight: 700; letter-spacing: -1px; }
    .stat-sub { font-size: 12px; color: var(--text2); margin-top: 4px; }
    
    /* Textarea */
    .textarea-wrap { position: relative; }
    .textarea {
      width: 100%; min-height: 200px; padding: 16px; border-radius: var(--radius);
      border: 1px solid var(--border); background: var(--surface2); color: var(--text);
      font-family: var(--mono); font-size: 13px; line-height: 1.6; resize: vertical;
      transition: border-color 0.2s;
    }
    .textarea:focus { outline: none; border-color: var(--accent); }
    .textarea::placeholder { color: var(--text3); }
    
    /* Input */
    .input {
      width: 100%; padding: 10px 14px; border-radius: var(--radius-sm);
      border: 1px solid var(--border); background: var(--surface2); color: var(--text);
      font-family: var(--font); font-size: 14px;
    }
    .input:focus { outline: none; border-color: var(--accent); }
    
    /* Buttons */
    .btn {
      padding: 10px 24px; border: none; border-radius: var(--radius-sm);
      font-family: var(--font); font-size: 14px; font-weight: 600;
      cursor: pointer; transition: all 0.2s; display: inline-flex;
      align-items: center; gap: 8px;
    }
    .btn-primary { background: var(--accent); color: white; }
    .btn-primary:hover { background: #6b4fdb; transform: translateY(-1px); }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
    .btn-ghost { background: transparent; color: var(--text2); border: 1px solid var(--border); }
    .btn-ghost:hover { color: var(--text); border-color: var(--text3); }
    .btn-sm { padding: 6px 14px; font-size: 12px; }
    .btn-danger { background: var(--red-bg); color: var(--red); border: 1px solid rgba(248,113,113,0.2); }
    
    /* Tags / Badges */
    .tag {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 500;
    }
    .tag-high { background: var(--red-bg); color: var(--red); }
    .tag-medium { background: var(--amber-bg); color: var(--amber); }
    .tag-low { background: var(--green-bg); color: var(--green); }
    .tag-accent { background: var(--accent-glow); color: var(--accent2); }
    .tag-blue { background: var(--blue-bg); color: var(--blue); }
    .tag-pink { background: var(--pink-bg); color: var(--pink); }
    
    /* Objection/Opportunity cards */
    .insight-item {
      padding: 16px; border-radius: var(--radius-sm);
      border: 1px solid var(--border); background: var(--surface2);
      margin-bottom: 12px; transition: border-color 0.2s;
    }
    .insight-item:hover { border-color: var(--accent); }
    .insight-category { font-size: 13px; font-weight: 600; margin-bottom: 6px; }
    .insight-detail { font-size: 13px; color: var(--text2); line-height: 1.5; }
    .insight-quote {
      margin-top: 8px; padding: 8px 12px; border-left: 2px solid var(--accent);
      font-style: italic; font-size: 12px; color: var(--text3);
      background: rgba(124, 92, 252, 0.05); border-radius: 0 6px 6px 0;
    }
    .insight-meta { display: flex; gap: 8px; margin-top: 8px; flex-wrap: wrap; }
    
    /* Progress bar */
    .bar-wrap { height: 8px; background: var(--surface3); border-radius: 4px; overflow: hidden; margin-top: 8px; }
    .bar-fill { height: 100%; border-radius: 4px; transition: width 0.6s ease; }
    
    /* Transcript list */
    .transcript-item {
      display: flex; align-items: center; justify-content: space-between;
      padding: 14px 16px; border-radius: var(--radius-sm);
      border: 1px solid var(--border); margin-bottom: 8px;
      cursor: pointer; transition: all 0.2s;
    }
    .transcript-item:hover { background: var(--surface2); border-color: var(--accent); }
    .transcript-item.active { border-color: var(--accent); background: var(--accent-glow); }
    .transcript-title { font-size: 14px; font-weight: 500; }
    .transcript-meta { font-size: 11px; color: var(--text3); margin-top: 2px; }
    
    /* Marketing suggestion card */
    .suggestion-card {
      padding: 20px; border-radius: var(--radius);
      border: 1px solid var(--border); background: var(--surface2);
      transition: all 0.3s;
    }
    .suggestion-card:hover { border-color: var(--accent); transform: translateY(-2px); }
    .suggestion-type {
      font-size: 10px; text-transform: uppercase; letter-spacing: 1px;
      color: var(--accent2); font-weight: 600; margin-bottom: 8px;
    }
    .suggestion-title { font-size: 15px; font-weight: 600; margin-bottom: 8px; }
    .suggestion-desc { font-size: 13px; color: var(--text2); line-height: 1.5; }
    
    /* Loader */
    .loader { display: flex; align-items: center; gap: 12px; padding: 40px; justify-content: center; }
    .spinner {
      width: 24px; height: 24px; border: 3px solid var(--border);
      border-top-color: var(--accent); border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    
    /* Empty state */
    .empty {
      text-align: center; padding: 60px 20px; color: var(--text3);
    }
    .empty-icon { font-size: 48px; margin-bottom: 16px; opacity: 0.5; }
    .empty-title { font-size: 18px; font-weight: 600; color: var(--text2); margin-bottom: 8px; }
    
    /* Collateral modal */
    .modal-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.7);
      display: flex; align-items: center; justify-content: center;
      z-index: 200; backdrop-filter: blur(4px);
    }
    .modal {
      background: var(--surface); border: 1px solid var(--border);
      border-radius: var(--radius); max-width: 800px; width: 90%;
      max-height: 80vh; overflow-y: auto; padding: 32px;
    }
    .modal-title { font-size: 20px; font-weight: 700; margin-bottom: 4px; }
    .modal-sub { font-size: 13px; color: var(--text3); margin-bottom: 20px; }
    .modal-content { 
      font-size: 14px; line-height: 1.7; color: var(--text2);
      white-space: pre-wrap; font-family: var(--font);
    }
    .modal-content h1, .modal-content h2, .modal-content h3 {
      color: var(--text); margin-top: 20px; margin-bottom: 8px;
    }
    
    /* Fade in animation */
    .fade-in { animation: fadeIn 0.3s ease; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
    
    /* Aggregate bar chart */
    .agg-bar {
      display: flex; align-items: center; gap: 12px; padding: 10px 0;
      border-bottom: 1px solid var(--border);
    }
    .agg-bar:last-child { border-bottom: none; }
    .agg-bar-label { font-size: 13px; font-weight: 500; width: 180px; flex-shrink: 0; }
    .agg-bar-track { flex: 1; height: 24px; background: var(--surface3); border-radius: 6px; overflow: hidden; position: relative; }
    .agg-bar-fill { height: 100%; border-radius: 6px; display: flex; align-items: center; padding-left: 8px; font-size: 11px; font-weight: 600; color: white; min-width: 30px; }
    .agg-bar-count { font-size: 13px; font-weight: 600; width: 40px; text-align: right; font-family: var(--mono); }
    
    .section-title { font-size: 20px; font-weight: 700; margin-bottom: 20px; letter-spacing: -0.5px; }
    .section-sub { font-size: 13px; color: var(--text3); margin-bottom: 24px; margin-top: -14px; }
    
    /* Responsive */
    @media (max-width: 768px) {
      .header { padding: 16px; flex-direction: column; gap: 12px; }
      .main { padding: 16px; }
      .grid-2, .grid-3, .grid-4 { grid-template-columns: 1fr; }
    }
  `;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
};

/* ─── SAMPLE TRANSCRIPT ─── */
const SAMPLE_TRANSCRIPT = `Sales Rep: Hey Mark, thanks for taking the time today. I know you mentioned your team at Apex Funding is drowning in manual underwriting work. Can you walk me through what that looks like day to day?

Mark (VP Operations, Apex Funding): Yeah absolutely. So we're processing about 200 MCA applications a day. The biggest bottleneck is the bank statement analysis — our underwriters are spending 15-20 minutes per application just on cash flow review. And then the Clear reports take another 10-15 minutes each because the criminal records and liens are buried deep in these 50-page PDFs.

Sales Rep: That's significant. At 200 apps per day, that's essentially... over 100 hours of manual review daily just on those two steps.

Mark: Exactly. And we're losing deals because of it. Our time to offer is sitting at about 4 hours right now. We've had prospects tell us they went with a competitor because they got an offer in 30 minutes. It's killing our take rate.

Sales Rep: I hear that a lot from lenders your size. What solutions have you looked at so far?

Mark: Well, we evaluated Ocrolus for the bank statement piece about six months ago. Their accuracy was decent but the pricing was steep — they wanted $3 per page and at our volume that adds up fast. We also looked at building something in-house but our engineering team is stretched thin with the CRM migration.

Sales Rep: Makes sense. So pricing and engineering bandwidth are both factors. With HyperVerge, the bank statement analysis runs in under 5 seconds with 98% accuracy, and the pricing is significantly more competitive than Ocrolus since we charge per document, not per page.

Mark: That's interesting. What about the fraud detection piece? We've seen a spike in tampered statements recently and our current process is basically eyeballing it.

Sales Rep: That's actually one of our strongest areas — we run 10+ fraud checks automatically on every statement. We can detect font inconsistencies, metadata tampering, transaction pattern anomalies. One of our clients, Kapitus, saw their fraud catch rate improve by 40% after implementation.

Mark: We'd definitely want to pilot the cash flow module first. But I'm worried about integration — we're on Salesforce and every new vendor integration has been a nightmare. Last time it took 3 months just to get data flowing properly.

Sales Rep: Totally understand that concern. We designed HyperVerge to work with existing CRMs through our API. Most clients are fully live within 2-3 weeks, not months. And for the Clear report analysis, we extract UCCs, liens, criminal records, and judgments automatically — cuts that 15-minute manual review down to about 15 seconds.

Mark: 15 seconds? That seems aggressive. What's the accuracy like on the Clear report parsing?

Sales Rep: About 80% of cases get auto-approved without any human review needed. For the remaining 20%, we surface a structured summary so your underwriters are reviewing a clean dashboard instead of scrolling through 50 pages.

Mark: Okay, that's compelling. My concern is honestly just the fear of handing over critical underwriting decisions to AI. Our chief credit officer is old school — he's going to want to see that every decision is explainable and auditable.

Sales Rep: That's a completely valid concern and we hear it often. Everything HyperVerge produces comes with full explainability — confidence scores at the field level, audit trails, and the ability to set custom thresholds. Your CCO can set it so that any case below a 95% confidence automatically goes to manual review.

Mark: What would a pilot look like? And what's the ballpark on pricing for our volume?

Sales Rep: For a pilot, we'd typically start with the cash flow module on a subset — say 50 applications over 2 weeks. Pricing for your volume would be roughly 60-70% less than what you were quoted by Ocrolus. I can put together a detailed proposal this week.

Mark: Yeah, let's do that. Can you also include the industry classification module? We're spending way too much time on SIC code tagging — it's completely manual right now and honestly pretty inconsistent across our team.

Sales Rep: Absolutely. The industry classification module uses multi-source intelligence — websites, Google Maps data, bank transaction patterns — to predict SIC/NAICS codes with about 80% top-1 accuracy. It would slot right into your workflow alongside the other modules.

Mark: Alright, send over the proposal. I'll loop in our CTO and CCO for a technical review next week. If the pilot goes well, we'd want to expand to the Clear report module too. Budget shouldn't be an issue if we can prove the ROI — our board has been pushing us to automate for the last year.`;

/* ─── HELPER COMPONENTS ─── */
const SeverityTag = ({ level }) => (
  <span className={`tag tag-${level}`}>
    {level === 'high' ? '▲' : level === 'medium' ? '◆' : '▽'} {level}
  </span>
);

const BarChart = ({ items, maxVal, color = 'var(--accent)' }) => (
  <div>
    {items.map((item, i) => (
      <div key={i} className="agg-bar">
        <div className="agg-bar-label">{item.label}</div>
        <div className="agg-bar-track">
          <div className="agg-bar-fill" style={{
            width: `${Math.max((item.value / maxVal) * 100, 8)}%`,
            background: color
          }}>{item.value}</div>
        </div>
      </div>
    ))}
  </div>
);

/* ─── MAIN APP ─── */
export default function App() {
  const [view, setView] = useState('upload');
  const [transcript, setTranscript] = useState('');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [analyses, setAnalyses] = useState([]);
  const [selected, setSelected] = useState(null);
  const [aggregate, setAggregate] = useState(null);
  const [modal, setModal] = useState(null);
  const [collateralLoading, setCollateralLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { injectStyles(); }, []);

  const fetchAnalyses = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/analyses`);
      const data = await res.json();
      setAnalyses(data);
    } catch (e) { console.error(e); }
  }, []);

  const fetchAggregate = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/aggregate`);
      const data = await res.json();
      setAggregate(data);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    fetchAnalyses();
    fetchAggregate();
  }, [fetchAnalyses, fetchAggregate]);

  const handleAnalyze = async () => {
    if (!transcript.trim() || transcript.trim().length < 50) {
      setError('Please paste a transcript (at least 50 characters).');
      return;
    }
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript, title: title || undefined, source: 'manual' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSelected(data.analysis);
      setTranscript(''); setTitle('');
      setView('detail');
      fetchAnalyses();
      fetchAggregate();
    } catch (e) {
      setError(e.message || 'Analysis failed. Check your API key and try again.');
    } finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    await fetch(`${API}/api/analysis/${id}`, { method: 'DELETE' });
    if (selected?.id === id) setSelected(null);
    fetchAnalyses();
    fetchAggregate();
  };

  const generateCollateral = async (suggestion) => {
    setCollateralLoading(true);
    try {
      const res = await fetch(`${API}/api/generate-collateral`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suggestion, context: selected?.summary || '' })
      });
      const data = await res.json();
      setModal({ ...suggestion, generatedContent: data.content });
    } catch (e) {
      setError('Failed to generate collateral');
    } finally { setCollateralLoading(false); }
  };

  const loadSample = () => {
    setTranscript(SAMPLE_TRANSCRIPT);
    setTitle('Apex Funding — VP Ops Discovery Call');
  };

  /* ─── RENDER: UPLOAD VIEW ─── */
  const renderUpload = () => (
    <div className="fade-in">
      <h2 className="section-title">Analyze a Transcript</h2>
      <p className="section-sub">Paste any sales call transcript — Oliv AI, Gong, Chorus, Fireflies, or plain text</p>

      <div className="card">
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 6 }}>Transcript Title (optional)</label>
          <input className="input" placeholder="e.g., Apex Funding — Discovery Call" value={title} onChange={e => setTitle(e.target.value)} />
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 500 }}>Transcript Content</label>
            <button className="btn btn-ghost btn-sm" onClick={loadSample}>Load sample transcript</button>
          </div>
          <textarea className="textarea" style={{ minHeight: 300 }}
            placeholder={`Paste your sales call transcript here...\n\nSupported formats:\n• Oliv AI transcripts\n• Gong / Chorus exports\n• Fireflies.ai transcripts\n• Any speaker-labeled text\n• Raw meeting notes`}
            value={transcript} onChange={e => setTranscript(e.target.value)}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--text3)' }}>
              {transcript.length > 0 ? `${transcript.length.toLocaleString()} characters` : ''}
            </span>
          </div>
        </div>

        {error && <div style={{ padding: 12, background: 'var(--red-bg)', borderRadius: 8, color: 'var(--red)', fontSize: 13, marginBottom: 16 }}>{error}</div>}

        <button className="btn btn-primary" onClick={handleAnalyze} disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: 14 }}>
          {loading ? <><span className="spinner" style={{ width: 18, height: 18 }}/> Analyzing with AI...</> : '⚡ Analyze Transcript'}
        </button>
      </div>

      {analyses.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <h3 className="section-title">Previous Analyses</h3>
          {analyses.map(a => (
            <div key={a.id} className="transcript-item" onClick={() => { setSelected(a); setView('detail'); }}>
              <div>
                <div className="transcript-title">{a.title || 'Untitled'}</div>
                <div className="transcript-meta">
                  {new Date(a.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  {' · '}{(a.objections || []).length} objections · {(a.opportunities || []).length} opportunities
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {a.deal_signals && <span className="tag tag-accent">{a.deal_signals.buying_stage}</span>}
                <button className="btn btn-danger btn-sm" onClick={e => { e.stopPropagation(); handleDelete(a.id); }}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  /* ─── RENDER: DETAIL VIEW ─── */
  const renderDetail = () => {
    if (!selected) return <div className="empty"><div className="empty-icon">📋</div><div className="empty-title">No transcript selected</div><p>Upload and analyze a transcript first, or select one from your history.</p></div>;
    const a = selected;
    return (
      <div className="fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <h2 className="section-title" style={{ marginBottom: 4 }}>{a.title || 'Analysis'}</h2>
            <p style={{ fontSize: 13, color: 'var(--text3)' }}>
              {new Date(a.timestamp).toLocaleString()} · Source: {a.source}
            </p>
          </div>
        </div>

        {/* Summary & Deal Signals */}
        <div className="grid-2" style={{ marginBottom: 20 }}>
          <div className="card">
            <div className="card-header"><span className="card-title">Summary</span></div>
            <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.6 }}>{a.summary}</p>
            {a.prospect && (
              <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {a.prospect.name && <span className="tag tag-accent">{a.prospect.name}</span>}
                {a.prospect.role && <span className="tag tag-blue">{a.prospect.role}</span>}
                {a.prospect.industry_segment && <span className="tag tag-pink">{a.prospect.industry_segment}</span>}
              </div>
            )}
          </div>
          <div className="card">
            <div className="card-header"><span className="card-title">Deal Signals</span></div>
            {a.deal_signals ? (
              <>
                <div className="grid-2" style={{ gap: 12 }}>
                  <div>
                    <div className="stat-label">Buying Stage</div>
                    <div style={{ fontSize: 18, fontWeight: 600 }}>{a.deal_signals.buying_stage}</div>
                  </div>
                  <div>
                    <div className="stat-label">Confidence</div>
                    <div style={{ fontSize: 18, fontWeight: 600 }}>{Math.round((a.deal_signals.confidence_score || 0) * 100)}%</div>
                  </div>
                  <div>
                    <div className="stat-label">Urgency</div>
                    <SeverityTag level={a.deal_signals.urgency} />
                  </div>
                </div>
                {a.deal_signals.blockers?.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <div className="stat-label">Blockers</div>
                    {a.deal_signals.blockers.map((b, i) => <div key={i} style={{ fontSize: 13, color: 'var(--red)', marginTop: 4 }}>• {b}</div>)}
                  </div>
                )}
              </>
            ) : <p style={{ color: 'var(--text3)', fontSize: 13 }}>No deal signals detected</p>}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid-4" style={{ marginBottom: 20 }}>
          <div className="stat-card">
            <div className="stat-label">Objections</div>
            <div className="stat-value" style={{ color: 'var(--red)' }}>{(a.objections || []).length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Opportunities</div>
            <div className="stat-value" style={{ color: 'var(--green)' }}>{(a.opportunities || []).length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Modules Discussed</div>
            <div className="stat-value" style={{ color: 'var(--blue)' }}>{(a.modules_discussed || []).length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Key Phrases</div>
            <div className="stat-value" style={{ color: 'var(--amber)' }}>{(a.key_phrases || []).length}</div>
          </div>
        </div>

        {/* Objections */}
        <div className="grid-2">
          <div>
            <h3 className="section-title" style={{ fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: 'var(--red)' }}>◼</span> Objections Flagged
            </h3>
            {(a.objections || []).length === 0 ? <p style={{ color: 'var(--text3)', fontSize: 13 }}>No objections detected</p> :
              a.objections.map((obj, i) => (
                <div key={i} className="insight-item">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="insight-category">{obj.category}</div>
                    <SeverityTag level={obj.severity} />
                  </div>
                  <div className="insight-detail">{obj.detail}</div>
                  {obj.quote && <div className="insight-quote">"{obj.quote}"</div>}
                  {obj.suggested_response && (
                    <div style={{ marginTop: 8, padding: '8px 12px', background: 'var(--green-bg)', borderRadius: 6, fontSize: 12, color: 'var(--green)' }}>
                      💡 <strong>Counter:</strong> {obj.suggested_response}
                    </div>
                  )}
                </div>
              ))
            }
          </div>

          {/* Opportunities */}
          <div>
            <h3 className="section-title" style={{ fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: 'var(--green)' }}>◼</span> Opportunities Identified
            </h3>
            {(a.opportunities || []).length === 0 ? <p style={{ color: 'var(--text3)', fontSize: 13 }}>No opportunities detected</p> :
              a.opportunities.map((opp, i) => (
                <div key={i} className="insight-item">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="insight-category">{opp.category}</div>
                    <SeverityTag level={opp.strength} />
                  </div>
                  <div className="insight-detail">{opp.detail}</div>
                  {opp.quote && <div className="insight-quote">"{opp.quote}"</div>}
                  <div className="insight-meta">
                    {(opp.modules_relevant || []).map((m, j) => <span key={j} className="tag tag-accent">{m}</span>)}
                  </div>
                </div>
              ))
            }
          </div>
        </div>

        {/* Modules Interest */}
        {(a.modules_discussed || []).length > 0 && (
          <div className="card" style={{ marginTop: 20 }}>
            <div className="card-header"><span className="card-title">Module Interest Map</span></div>
            <div className="grid-4">
              {a.modules_discussed.map((m, i) => (
                <div key={i} style={{ padding: 16, background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>{m.module}</div>
                  <SeverityTag level={m.interest_level === 'high' ? 'high' : m.interest_level === 'medium' ? 'medium' : 'low'} />
                  <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 8 }}>{m.context}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Messaging Themes */}
        {(a.messaging_themes || []).length > 0 && (
          <div className="card" style={{ marginTop: 20 }}>
            <div className="card-header"><span className="card-title">Messaging Themes</span></div>
            {a.messaging_themes.map((t, i) => (
              <div key={i} style={{ padding: 14, background: 'var(--surface2)', borderRadius: 8, marginBottom: 10, borderLeft: `3px solid ${t.priority === 'high' ? 'var(--accent)' : t.priority === 'medium' ? 'var(--amber)' : 'var(--text3)'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{t.theme}</div>
                  <SeverityTag level={t.priority} />
                </div>
                <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>{t.rationale}</div>
                {t.target_emotion && <span className="tag tag-pink" style={{ marginTop: 6 }}>→ {t.target_emotion}</span>}
              </div>
            ))}
          </div>
        )}

        {/* Marketing Suggestions */}
        {(a.marketing_suggestions || []).length > 0 && (
          <div style={{ marginTop: 24 }}>
            <h3 className="section-title" style={{ fontSize: 16 }}>Recommended Marketing Collateral</h3>
            <div className="grid-3">
              {a.marketing_suggestions.map((s, i) => (
                <div key={i} className="suggestion-card">
                  <div className="suggestion-type">{s.type}</div>
                  <div className="suggestion-title">{s.title}</div>
                  <div className="suggestion-desc">{s.description}</div>
                  <div style={{ marginTop: 10 }}>
                    <span className="tag tag-blue" style={{ marginRight: 6 }}>Addresses: {s.addresses}</span>
                    <SeverityTag level={s.priority} />
                  </div>
                  <button className="btn btn-ghost btn-sm" style={{ marginTop: 12, width: '100%', justifyContent: 'center' }}
                    onClick={() => generateCollateral(s)} disabled={collateralLoading}>
                    {collateralLoading ? 'Generating...' : '✨ Generate Content'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Next Steps */}
        {(a.next_steps || []).length > 0 && (
          <div className="card" style={{ marginTop: 20 }}>
            <div className="card-header"><span className="card-title">Recommended Next Steps</span></div>
            {a.next_steps.map((step, i) => (
              <div key={i} style={{ padding: '8px 0', borderBottom: i < a.next_steps.length - 1 ? '1px solid var(--border)' : 'none', fontSize: 14, color: 'var(--text2)' }}>
                <span style={{ color: 'var(--accent)', fontWeight: 600, marginRight: 8 }}>{i + 1}.</span> {step}
              </div>
            ))}
          </div>
        )}

        {/* Key Phrases */}
        {(a.key_phrases || []).length > 0 && (
          <div className="card" style={{ marginTop: 20 }}>
            <div className="card-header"><span className="card-title">Key Phrases Extracted</span></div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {a.key_phrases.map((kp, i) => (
                <div key={i} title={kp.context} className={`tag ${kp.sentiment === 'positive' ? 'tag-low' : kp.sentiment === 'negative' ? 'tag-high' : 'tag-accent'}`}
                  style={{ cursor: 'help', fontSize: 12, padding: '6px 12px' }}>
                  "{kp.phrase}"
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  /* ─── RENDER: AGGREGATE VIEW ─── */
  const renderAggregate = () => {
    if (!aggregate || aggregate.empty) {
      return (
        <div className="empty fade-in">
          <div className="empty-icon">📊</div>
          <div className="empty-title">No aggregated data yet</div>
          <p style={{ maxWidth: 400, margin: '0 auto', lineHeight: 1.6 }}>
            Analyze at least one transcript to see aggregated insights across all your conversations.
          </p>
          <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={() => setView('upload')}>Upload a Transcript</button>
        </div>
      );
    }
    const ag = aggregate;
    const maxObj = Math.max(...(ag.objections || []).map(o => o.count), 1);
    const maxOpp = Math.max(...(ag.opportunities || []).map(o => o.count), 1);
    const maxMod = Math.max(...(ag.modules || []).map(m => m.mention_count), 1);

    return (
      <div className="fade-in">
        <h2 className="section-title">Aggregated Intelligence</h2>
        <p className="section-sub">Cross-transcript insights from {ag.total_transcripts} analyzed conversation{ag.total_transcripts !== 1 ? 's' : ''}</p>

        {/* Top-level stats */}
        <div className="grid-4" style={{ marginBottom: 24 }}>
          <div className="stat-card">
            <div className="stat-label">Total Transcripts</div>
            <div className="stat-value">{ag.total_transcripts}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Unique Objections</div>
            <div className="stat-value" style={{ color: 'var(--red)' }}>{(ag.objections || []).length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Opportunity Types</div>
            <div className="stat-value" style={{ color: 'var(--green)' }}>{(ag.opportunities || []).length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Avg Confidence</div>
            <div className="stat-value" style={{ color: 'var(--accent)' }}>{Math.round((ag.pipeline_overview?.avg_confidence || 0) * 100)}%</div>
          </div>
        </div>

        <div className="grid-2">
          {/* Objections */}
          <div className="card">
            <div className="card-header">
              <span className="card-title" style={{ color: 'var(--red)' }}>Top Objections (by frequency × severity)</span>
            </div>
            <BarChart
              items={(ag.objections || []).map(o => ({ label: o.category, value: o.count }))}
              maxVal={maxObj}
              color="var(--red)"
            />
            {(ag.objections || []).map((o, i) => (
              <details key={i} style={{ marginTop: 8 }}>
                <summary style={{ cursor: 'pointer', fontSize: 13, color: 'var(--text2)', padding: '4px 0' }}>
                  {o.category} — avg severity: {o.avg_severity}/3
                </summary>
                <div style={{ padding: '8px 16px', fontSize: 12, color: 'var(--text3)' }}>
                  {o.top_details.map((d, j) => <div key={j} style={{ marginBottom: 4 }}>• {d}</div>)}
                  {o.top_responses.length > 0 && (
                    <div style={{ marginTop: 8, padding: 8, background: 'var(--green-bg)', borderRadius: 6 }}>
                      <strong style={{ color: 'var(--green)' }}>Top counters:</strong>
                      {o.top_responses.map((r, j) => <div key={j} style={{ marginTop: 4, color: 'var(--green)' }}>→ {r}</div>)}
                    </div>
                  )}
                </div>
              </details>
            ))}
          </div>

          {/* Opportunities */}
          <div className="card">
            <div className="card-header">
              <span className="card-title" style={{ color: 'var(--green)' }}>Top Opportunities (by frequency × strength)</span>
            </div>
            <BarChart
              items={(ag.opportunities || []).map(o => ({ label: o.category, value: o.count }))}
              maxVal={maxOpp}
              color="var(--green)"
            />
            {(ag.opportunities || []).map((o, i) => (
              <details key={i} style={{ marginTop: 8 }}>
                <summary style={{ cursor: 'pointer', fontSize: 13, color: 'var(--text2)', padding: '4px 0' }}>
                  {o.category} — avg strength: {o.avg_strength}/3
                </summary>
                <div style={{ padding: '8px 16px', fontSize: 12, color: 'var(--text3)' }}>
                  {o.top_details.map((d, j) => <div key={j} style={{ marginBottom: 4 }}>• {d}</div>)}
                  {o.relevant_modules.length > 0 && (
                    <div style={{ marginTop: 6 }}>
                      Relevant modules: {o.relevant_modules.map((m, j) => <span key={j} className="tag tag-accent" style={{ marginRight: 4 }}>{m}</span>)}
                    </div>
                  )}
                </div>
              </details>
            ))}
          </div>
        </div>

        {/* Module Popularity */}
        {(ag.modules || []).length > 0 && (
          <div className="card" style={{ marginTop: 20 }}>
            <div className="card-header"><span className="card-title">Module Interest Across Conversations</span></div>
            <BarChart
              items={(ag.modules || []).map(m => ({ label: m.module, value: m.mention_count }))}
              maxVal={maxMod}
              color="var(--accent)"
            />
          </div>
        )}

        {/* Messaging Themes */}
        {(ag.messaging_themes || []).length > 0 && (
          <div className="card" style={{ marginTop: 20 }}>
            <div className="card-header"><span className="card-title">Recurring Messaging Themes</span></div>
            {ag.messaging_themes.slice(0, 10).map((t, i) => (
              <div key={i} style={{ padding: 14, background: 'var(--surface2)', borderRadius: 8, marginBottom: 10, borderLeft: `3px solid ${i < 3 ? 'var(--accent)' : 'var(--border)'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{t.theme}</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <span className="tag tag-accent">×{t.frequency}</span>
                    <span className="tag tag-blue">priority: {t.avg_priority}/3</span>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>
                  {t.emotions.join(', ')}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pipeline Overview */}
        {ag.pipeline_overview && Object.keys(ag.pipeline_overview.buying_stages || {}).length > 0 && (
          <div className="card" style={{ marginTop: 20 }}>
            <div className="card-header"><span className="card-title">Pipeline Stage Distribution</span></div>
            <div className="grid-4">
              {Object.entries(ag.pipeline_overview.buying_stages).map(([stage, count]) => (
                <div key={stage} className="stat-card" style={{ textAlign: 'center' }}>
                  <div className="stat-label">{stage}</div>
                  <div className="stat-value">{count}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Marketing Suggestions */}
        {(ag.marketing_suggestions || []).length > 0 && (
          <div style={{ marginTop: 24 }}>
            <h3 className="section-title" style={{ fontSize: 16 }}>Priority Marketing Collateral</h3>
            <p className="section-sub">Based on recurring patterns across all conversations</p>
            <div className="grid-3">
              {ag.marketing_suggestions.slice(0, 9).map((s, i) => (
                <div key={i} className="suggestion-card">
                  <div className="suggestion-type">{s.type} {s.frequency > 1 && `(×${s.frequency})`}</div>
                  <div className="suggestion-title">{s.title}</div>
                  <div className="suggestion-desc">{s.description}</div>
                  <div style={{ marginTop: 8 }}>
                    <SeverityTag level={s.priority} />
                  </div>
                  <button className="btn btn-ghost btn-sm" style={{ marginTop: 12, width: '100%', justifyContent: 'center' }}
                    onClick={() => generateCollateral(s)} disabled={collateralLoading}>
                    {collateralLoading ? 'Generating...' : '✨ Generate Content'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  /* ─── MAIN RENDER ─── */
  return (
    <div className="app">
      <header className="header">
        <div className="logo">
          <div className="logo-icon">TI</div>
          <div>
            <div className="logo-text">Transcript Intelligence</div>
            <div className="logo-sub">Sales Conversation Analyzer</div>
          </div>
        </div>
        <nav className="nav">
          <button className={`nav-btn ${view === 'upload' ? 'active' : ''}`} onClick={() => setView('upload')}>Upload</button>
          <button className={`nav-btn ${view === 'detail' ? 'active' : ''}`} onClick={() => setView('detail')}>Analysis</button>
          <button className={`nav-btn ${view === 'aggregate' ? 'active' : ''}`} onClick={() => { setView('aggregate'); fetchAggregate(); }}>Dashboard</button>
        </nav>
        <div style={{ fontSize: 12, color: 'var(--text3)' }}>
          {analyses.length} transcript{analyses.length !== 1 ? 's' : ''} analyzed
        </div>
      </header>

      <main className="main">
        {view === 'upload' && renderUpload()}
        {view === 'detail' && renderDetail()}
        {view === 'aggregate' && renderAggregate()}
      </main>

      {/* Collateral Modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div className="modal-title">{modal.title}</div>
                <div className="modal-sub">{modal.type} · {modal.addresses}</div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setModal(null)}>✕ Close</button>
            </div>
            <div className="modal-content" dangerouslySetInnerHTML={{
              __html: (modal.generatedContent || 'Generating...')
                .replace(/^### (.*$)/gm, '<h3>$1</h3>')
                .replace(/^## (.*$)/gm, '<h2>$1</h2>')
                .replace(/^# (.*$)/gm, '<h1>$1</h1>')
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\n/g, '<br/>')
            }} />
            <div style={{ marginTop: 20, display: 'flex', gap: 8 }}>
              <button className="btn btn-primary" onClick={() => { navigator.clipboard.writeText(modal.generatedContent || ''); }}>
                📋 Copy to Clipboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
