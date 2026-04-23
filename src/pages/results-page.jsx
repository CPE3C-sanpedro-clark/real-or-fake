import { useSearchParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import UserLayout from '../assets/components/UserLayout';
import '../styles/results.css';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3006';

function ExternalLinkIcon({ className }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';

// Helper to get auth headers with session token
const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  const sessionToken = localStorage.getItem('sessionToken');
  
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  if (sessionToken) {
    headers['X-Session-Token'] = sessionToken;
  }
  
  return headers;
};

export default function ResultsPage() {
  const [searchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  const type = searchParams.get('type') || 'text';
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('sources');
  const [analysisId, setAnalysisId] = useState(null);
  const navigate = useNavigate();

  // Update verdict in database after results load
  const updateVerdict = async (verdict, query, fakeScore = null) => {
    const token = localStorage.getItem('authToken');
    const sessionToken = localStorage.getItem('sessionToken');
    
    if (!token) return;
    
    try {
      // First, save the check with session info
      await fetch(`${API_BASE}/api/checks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Session-Token': sessionToken || ''
        },
        body: JSON.stringify({ 
          query: query, 
          verdict, 
          check_type: type,
          fake_news_score: fakeScore,
          sources_checked: articles.length
        })
      });
      
      // Then update the verdict for this query
      await fetch(`${API_BASE}/api/checks/update-verdict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Session-Token': sessionToken || ''
        },
        body: JSON.stringify({ query: query, verdict })
      });
    } catch (err) {
      console.error('Failed to update verdict:', err);
    }
  };

  function mapRiskToVerdict(risk) {
    if (!risk) return 'mixed';
    const r = risk.toUpperCase();
    if (r === 'LOW' || r === 'HIGHLY_VERIFIED') return 'verified';
    if (r === 'MODERATE' || r === 'VERIFIED' || r === 'PARTIALLY_VERIFIED') return 'mixed';
    if (r === 'HIGH' || r === 'VERY_HIGH' || r === 'UNVERIFIED') return 'disputed';
    return 'mixed';
  }

  // Calculate overall verdict from all articles
  const getOverallVerdict = (articles) => {
    if (!articles.length) return 'mixed';
    const counts = { verified: 0, mixed: 0, disputed: 0 };
    articles.forEach(a => {
      const verdict = a.verdict || mapRiskToVerdict(a.riskLevel);
      counts[verdict] = (counts[verdict] || 0) + 1;
    });
    return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
  };

  // Calculate average fake score
  const getAverageFakeScore = (articles) => {
    if (!articles.length) return null;
    const scores = articles.filter(a => a.fakeScore).map(a => a.fakeScore);
    if (scores.length === 0) return null;
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  };

  useEffect(() => {
    if (!q) return;
    
    setLoading(true);
    setError(null);
    setAnalysisId(null);

    // Handle Guardian URL
    try {
      const maybeUrl = new URL(q);
      const hostname = maybeUrl.hostname.toLowerCase();
      if (hostname.includes('guardian') || hostname.includes('theguardian.com')) {
        const articleId = maybeUrl.pathname.replace(/^\//, '');
        
        axios.get(`${API_BASE}/api/news/guardian/article/${encodeURIComponent(articleId)}`, {
          headers: getAuthHeaders()
        })
          .then(res => {
            const article = res.data && res.data.data ? res.data.data : null;
            if (!article) { setArticles([]); setLoading(false); return; }
            
            axios.post(`${API_BASE}/api/news/analyze/fake-score`, {
              title: article.webTitle,
              description: article.trailText,
              bodyText: article.bodyText,
              link: article.webUrl,
              source: article.sectionName || 'The Guardian',
              byline: article.byline
            }, {
              headers: getAuthHeaders()
            })
              .then(scoreRes => {
                const scoreData = scoreRes.data && scoreRes.data.data ? scoreRes.data.data : null;
                const verdict = scoreData && scoreData.riskLevel ? mapRiskToVerdict(scoreData.riskLevel) : 'mixed';
                const fakeScore = scoreData?.fakeProbability || null;
                const result = [{
                  source: article.sectionName || 'The Guardian',
                  title: article.webTitle,
                  url: article.webUrl,
                  credibility: 90,
                  sentiment: article.sentiment || 'neutral',
                  date: article.publicationDate || article.pubDate || 'recent',
                  excerpt: article.trailText || '',
                  verdict,
                  fakeScore,
                  riskLevel: scoreData?.riskLevel,
                  flags: scoreData?.flags || [],
                  breakdown: scoreData?.breakdown
                }];
                setArticles(result);
                updateVerdict(verdict, q, fakeScore);
                setAnalysisId(Date.now()); // Trigger analysis tracking
              })
              .catch(err => {
                console.error('Score analysis error:', err);
                setArticles([{
                  source: article.sectionName || 'The Guardian',
                  title: article.webTitle,
                  url: article.webUrl,
                  credibility: 90,
                  sentiment: 'neutral',
                  date: article.publicationDate || 'recent',
                  excerpt: article.trailText || '',
                  verdict: 'mixed'
                }]);
                updateVerdict('mixed', q);
              })
              .finally(() => setLoading(false));
          })
          .catch(err => {
            setError(err.message || 'failed to fetch article');
            setLoading(false);
          });
        return;
      }
    } catch (e) {
      // not a URL, treat as search term
    }

    // Default search - this will automatically log activity in the backend
    const searchUrl = `${API_BASE}/api/news/guardian/search-with-analysis`;
    
    axios.get(searchUrl, { 
      params: { q, pageSize: 10 },
      headers: getAuthHeaders()
    })
      .then(res => {
        if (res.data && Array.isArray(res.data.data)) {
          const mapped = res.data.data.map(a => ({
            source: a.source || a.sectionName || a.byline || 'Guardian',
            title: a.webTitle || a.title || a.name,
            url: a.webUrl || a.url || '#',
            credibility: a.credibility || 80,
            sentiment: a.sentiment?.label || a.sentiment || 'neutral',
            date: a.webPublicationDate || a.pubDate || 'recent',
            excerpt: a.trailText || a.description || '',
            verdict: a.fakeNewsScore?.riskLevel
              ? mapRiskToVerdict(a.fakeNewsScore.riskLevel)
              : a.verdict || 'mixed',
            fakeScore: a.fakeNewsScore?.fakeProbability,
            riskLevel: a.fakeNewsScore?.riskLevel,
            flags: a.fakeNewsScore?.flags || [],
            breakdown: a.fakeNewsScore?.breakdown,
            factChecks: a.fakeNewsScore?.factChecks
          }));
          setArticles(mapped);
          
          const overallVerdict = getOverallVerdict(mapped);
          const avgFakeScore = getAverageFakeScore(mapped);
          updateVerdict(overallVerdict, q, avgFakeScore);
          setAnalysisId(Date.now()); // Trigger analysis tracking
        } else {
          setArticles([]);
        }
      })
      .catch(err => {
        console.error('Search error:', err);
        setError(err.message || 'failed to search');
      })
      .finally(() => setLoading(false));
  }, [q]);

  const sentimentData = articles.map(a => {
    const s = a.sentiment?.toLowerCase() || 'neutral';
    const isPositive = s === 'positive';
    const isNegative = s === 'negative';
    return {
      source: (a.source || 'Unknown').substring(0, 15),
      positive: isPositive ? 70 : 20,
      neutral: !isPositive && !isNegative ? 70 : 20,
      negative: isNegative ? 70 : 10,
    };
  });

  const positiveCount = articles.filter(a => a.sentiment?.toLowerCase() === 'positive').length;
  const negativeCount = articles.filter(a => a.sentiment?.toLowerCase() === 'negative').length;
  const neutralCount = articles.filter(a => !a.sentiment || a.sentiment?.toLowerCase() === 'neutral').length;
  const total = articles.length || 1;

  const hasRealSentiment = positiveCount + negativeCount + neutralCount > 0;

  const overallSentiment = hasRealSentiment ? [
    { name: 'Positive', value: Math.round((positiveCount / total) * 100), color: '#22c55e' },
    { name: 'Neutral', value: Math.round((neutralCount / total) * 100), color: '#64748b' },
    { name: 'Negative', value: Math.round((negativeCount / total) * 100), color: '#ef4444' },
  ] : [
    { name: 'Positive', value: 33, color: '#22c55e' },
    { name: 'Neutral', value: 34, color: '#64748b' },
    { name: 'Negative', value: 33, color: '#ef4444' },
  ];

  const getVerdictBadge = (verdict) => {
    if (verdict === 'verified') return <span className="badge badge-green">Verified</span>;
    if (verdict === 'mixed') return <span className="badge badge-yellow">Mixed Evidence</span>;
    if (verdict === 'disputed') return <span className="badge badge-red">Disputed</span>;
    return null;
  };

  const getCredibilityColor = (score) => {
    if (score >= 90) return 'cred-green';
    if (score >= 70) return 'cred-yellow';
    return 'cred-red';
  };

  // Get risk level class for visual indicator
  const getRiskClass = (riskLevel) => {
    if (!riskLevel) return '';
    const level = riskLevel.toUpperCase();
    if (level === 'LOW') return 'risk-low';
    if (level === 'MODERATE') return 'risk-moderate';
    if (level === 'HIGH') return 'risk-high';
    if (level === 'VERY_HIGH') return 'risk-very-high';
    return '';
  };

  return (
    <UserLayout>
      <div className="results-page">

        {/* HEADER */}
        <div className="results-header">
          <button className="back-home-btn" onClick={() => navigate('/')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Back to Search
          </button>
          <h1 className="results-title">Fact-Check Results</h1>
          <p className="results-query">Analyzing "<strong>{q}</strong>" across multiple sources</p>
        </div>

        {/* OVERALL ASSESSMENT */}
        {!loading && articles.length > 0 && (
          <div className="assessment-bar">
            <p className="assessment-label">Overall verdict</p>
            <p className="assessment-verdict">
              {getVerdictBadge(getOverallVerdict(articles))}
            </p>
            {getAverageFakeScore(articles) && (
              <div className="assessment-score">
                <span className="score-label">Misinformation Risk:</span>
                <span className={`score-value ${getRiskClass(
                  articles.find(a => a.riskLevel)?.riskLevel
                )}`}>
                  {getAverageFakeScore(articles)}%
                </span>
              </div>
            )}
            <span className="assessment-sources">
              Based on {articles.length} source{articles.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}

        {/* LOADING */}
        {loading && (
          <div className="loading-state">
            <div className="spinner" />
            <p>Analyzing sources...</p>
          </div>
        )}

        {/* ERROR */}
        {error && (
          <div className="error-state">
            Error: {error}
          </div>
        )}

        {/* TABS */}
        {!loading && articles.length > 0 && (
          <section>
            <div className="tab-list">
              <button
                className={`tab ${activeTab === 'sources' ? 'active' : ''}`}
                onClick={() => setActiveTab('sources')}
              >
                Source Comparison
              </button>
              <button
                className={`tab ${activeTab === 'sentiment' ? 'active' : ''}`}
                onClick={() => setActiveTab('sentiment')}
              >
                Sentiment Analysis
              </button>
              {articles.some(a => a.factChecks && a.factChecks.length > 0) && (
                <button
                  className={`tab ${activeTab === 'factchecks' ? 'active' : ''}`}
                  onClick={() => setActiveTab('factchecks')}
                >
                  Fact Checks
                </button>
              )}
            </div>

            <div className="tab-content">
              {activeTab === 'sources' && (
                <div className="sources">
                  {articles.length === 0 && (
                    <div className="muted">No articles found for this query.</div>
                  )}
                  {articles.map((article, idx) => (
                    <article key={idx} className="source-card">
                      <header>
                        <div className="left">
                          <h4>{article.source}</h4>
                          <span className={`cred ${getCredibilityColor(article.credibility)}`}>
                            {article.credibility}% credibility
                          </span>
                        </div>
                        <div className="right">
                          {getVerdictBadge(article.verdict)}
                        </div>
                      </header>
                      <p className="excerpt">{article.title}</p>
                      {article.excerpt && (
                        <p className="excerpt small">{article.excerpt}</p>
                      )}

                      {article.fakeScore !== undefined && (
                        <div className="fake-score-bar">
                          <span className="fake-score-label">
                            Misinformation risk: {Math.round(article.fakeScore)}%
                          </span>
                          <div className="fake-score-track">
                            <div
                              className={`fake-score-fill ${getRiskClass(article.riskLevel)}`}
                              style={{
                                width: `${article.fakeScore}%`
                              }}
                            />
                          </div>
                        </div>
                      )}
                      
                      {article.breakdown && (
                        <div className="breakdown-mini">
                          <details>
                            <summary>View score breakdown</summary>
                            <div className="breakdown-details">
                              {Object.entries(article.breakdown).map(([key, value]) => (
                                <div key={key} className="breakdown-item">
                                  <span>{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                                  <span>{value}</span>
                                </div>
                              ))}
                            </div>
                          </details>
                        </div>
                      )}
                      
                      {article.flags && article.flags.length > 0 && (
                        <div className="flags-list">
                          {article.flags.slice(0, 3).map((flag, fi) => (
                            <span key={fi} className="flag-tag">{flag}</span>
                          ))}
                        </div>
                      )}
                      
                      <div className="meta">
                        <span className="date">
                          {new Date(article.date).toLocaleDateString('en-US', {
                            year: 'numeric', month: 'short', day: 'numeric'
                          }) || article.date}
                        </span>
                        <a href={article.url} target="_blank" rel="noreferrer" className="read">
                          Read full article <ExternalLinkIcon className="icon" />
                        </a>
                      </div>
                    </article>
                  ))}
                </div>
              )}
              
              {activeTab === 'sentiment' && (
                <div className="sentiment">
                  <div className="chart-card">
                    <h4>Overall Sentiment Distribution</h4>
                    <div style={{ height: 280 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={overallSentiment}
                            dataKey="value"
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            stroke="none"
                            label={({ name, value }) => `${name}: ${value}%`}
                            labelLine={true}
                          >
                            {overallSentiment.map((entry, i) => (
                              <Cell key={i} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              background: 'rgba(8,14,35,0.95)',
                              border: '1px solid rgba(255,255,255,0.1)',
                              borderRadius: '8px',
                              color: '#e2e8f0'
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="chart-card">
                    <h4>Sentiment by Source</h4>
                    <div style={{ height: 280 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={sentimentData} margin={{ top: 10, right: 20, left: 0, bottom: 60 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                          <XAxis
                            dataKey="source"
                            tick={{ fill: '#94a3b8', fontSize: 11 }}
                            angle={-35}
                            textAnchor="end"
                          />
                          <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                          <Tooltip
                            contentStyle={{
                              background: 'rgba(8,14,35,0.95)',
                              border: '1px solid rgba(255,255,255,0.1)',
                              borderRadius: '8px',
                              color: '#e2e8f0'
                            }}
                          />
                          <Legend wrapperStyle={{ color: '#94a3b8' }} />
                          <Bar dataKey="positive" fill="#22c55e" name="Positive" />
                          <Bar dataKey="neutral" fill="#64748b" name="Neutral" />
                          <Bar dataKey="negative" fill="#ef4444" name="Negative" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'factchecks' && (
                <div className="factchecks-tab">
                  {articles.filter(a => a.factChecks && a.factChecks.length > 0).map((article, idx) => (
                    <div key={idx} className="factcheck-card">
                      <h4>{article.title}</h4>
                      {article.factChecks.map((factCheck, fIdx) => (
                        <div key={fIdx} className="factcheck-item">
                          <div className="factcheck-claim">{factCheck.claimText}</div>
                          <div className="factcheck-rating">
                            <span className="factcheck-publisher">{factCheck.publisher}:</span>
                            <span className={`factcheck-verdict ${factCheck.verdict?.toLowerCase()}`}>
                              {factCheck.rating}
                            </span>
                          </div>
                          {factCheck.url && (
                            <a href={factCheck.url} target="_blank" rel="noreferrer" className="factcheck-link">
                              View source →
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}
        
        {!loading && articles.length === 0 && !error && (
          <div className="empty-state">
            <p>No articles found for "{q}"</p>
            <p className="empty-hint">Try a different search term or check your spelling</p>
          </div>
        )}

      </div>
    </UserLayout>
  );
}