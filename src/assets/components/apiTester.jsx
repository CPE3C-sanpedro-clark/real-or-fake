// API Tester Component - Tests all endpoints in the real-or-fake API
// Base URL: Uses relative /api path in production

import { useState, useEffect, useCallback, useRef } from 'react'
import './css/apitester.css'

const API_BASE = import.meta.env.VITE_API_BASE || '';

// ==================== HELPER FUNCTIONS FOR FAKE NEWS DISPLAY ====================
const getScoreColor = (score) => {
  if (score <= 20) return '#27ae60';
  if (score <= 40) return '#27ae60';
  if (score <= 60) return '#f39c12';
  return '#e74c3c';
};

const formatBreakdownLabel = (key) => {
  const labels = {
    sensationalism: 'Sensationalism',
    emotionalLanguage: 'Emotional Language',
    clickbaitPatterns: 'Clickbait Patterns',
    conspiracyLanguage: 'Conspiracy Language',
    uncertaintyLanguage: 'Uncertainty Language',
    sourceCredibility: 'Source Credibility',
    articleCompleteness: 'Article Completeness',
    factCheckPenalty: 'Fact-Check Penalty'
  };
  return labels[key] || key;
};

// ==================== REUSABLE API CALL FUNCTION ====================
const callApi = async (method, endpoint, body = null, token = null) => {
  try {
    const headers = { 'Content-Type': 'application/json' }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    const options = {
      method,
      headers
    }
    if (body) {
      options.body = JSON.stringify(body)
    }
    const res = await fetch(`${API_BASE}${endpoint}`, options)
    const data = await res.json()
    if (!res.ok) {
      return { data: null, error: data.error || `HTTP ${res.status}` }
    }
    return { data, error: null }
  } catch (err) {
    return { data: null, error: err.message || 'Request failed' }
  }
}

// ==================== MAIN COMPONENT ====================
function apiTester() {
  const [activeTab, setActiveTab] = useState('health')
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState(null)
  const [error, setError] = useState(null)

  // Auth state
  const [token, setToken] = useState(null)
  const [user, setUser] = useState(null)

  // Refs for scrolling
  const resultRef = useRef(null)
  const contentStartRef = useRef(null)

  // Form states - defined at component level to prevent re-render focus loss
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [registerForm, setRegisterForm] = useState({ username: '', email: '', password: '' })
  const [sentimentForm, setSentimentForm] = useState({ text: '' })
  const [batchTexts, setBatchTexts] = useState('')
  const [guardianSearchForm, setGuardianSearchForm] = useState({
    q: '', section: '', fromDate: '', toDate: '', page: '1', pageSize: '10'
  })
  const [articleId, setArticleId] = useState('')

  // RSS Feed forms
  const [rssSearchForm, setRssSearchForm] = useState({ q: '' })
  const [rssSourcesSelected, setRssSourcesSelected] = useState('')
  const [rssArticleId, setRssArticleId] = useState('')

  // Fake News Analysis form
  const [fakeNewsForm, setFakeNewsForm] = useState({
    title: '',
    description: '',
    bodyText: '',
    link: '',
    source: '',
    byline: ''
  })

  // Auto-run health check on mount
  useEffect(() => {
    handleRequest('GET', '/api/health')
  }, [])

  // Reusable request handler with scroll to results
  const handleRequest = useCallback(async (method, endpoint, body = null) => {
    setLoading(true)
    setResponse(null)
    setError(null)

    const { data, error } = await callApi(method, endpoint, body, token)

    if (error) {
      setError(error)
    } else {
      setResponse(data)
      
      // Auto-save token and user info on successful login/register
      if (endpoint === '/api/auth/login' || endpoint === '/api/auth/register') {
        if (data?.token) {
          setToken(data.token)
          setUser(data.user || null)
        }
      }
    }
    setLoading(false)
    
    // Scroll to results after state update (allow time for rendering)
    setTimeout(() => {
      if (resultRef.current) {
        resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 100)
  }, [token])

  // Logout handler
  const handleLogout = useCallback(async () => {
    if (token) {
      await callApi('POST', '/api/auth/logout', null, token)
    }
    setToken(null)
    setUser(null)
    setResponse(null)
    setError(null)
    setLoginForm({ email: '', password: '' })
  }, [token])

  // ==================== RENDER ====================
  return (
    <div className="page-container">
      <div className="main-card">
        {/* Header */}
        <header className="header">
          <h1 className="title">API Tester</h1>
          <p className="subtitle">Test and explore the Real-or-Fake API endpoints</p>
          <div className="base-url-badge">{API_BASE}</div>
        </header>

        {/* Tab Navigation - Full width, scrollable on mobile */}
        <nav className="tabs" role="tablist">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setResponse(null); setError(null) }}
              className={activeTab === tab.id ? 'tab active' : 'tab'}
              style={{
                borderTopColor: activeTab === tab.id ? tab.color : 'transparent',
                backgroundColor: activeTab === tab.id ? '#fff' : '#f8f9fa',
                color: activeTab === tab.id ? tab.color : '#6c757d'
              }}
              role="tab"
              aria-selected={activeTab === tab.id}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* Hidden element to mark content start for scrolling reference */}
        <div ref={contentStartRef}></div>

        {/* Tab Content */}
        <main className="content">
          {activeTab === 'health' && (
            <HealthSection handleRequest={handleRequest} loading={loading} />
          )}
          {activeTab === 'auth' && (
            <AuthSection
              handleRequest={handleRequest}
              handleLogout={handleLogout}
              loading={loading}
              token={token}
              user={user}
              isLoggedIn={!!token}
              loginForm={loginForm}
              setLoginForm={setLoginForm}
              registerForm={registerForm}
              setRegisterForm={setRegisterForm}
            />
          )}
          {activeTab === 'sentiment' && (
            <SentimentSection
              handleRequest={handleRequest}
              loading={loading}
              sentimentForm={sentimentForm}
              setSentimentForm={setSentimentForm}
              batchTexts={batchTexts}
              setBatchTexts={setBatchTexts}
            />
          )}
          {activeTab === 'news' && (
            <NewsSection
              handleRequest={handleRequest}
              loading={loading}
              guardianSearchForm={guardianSearchForm}
              setGuardianSearchForm={setGuardianSearchForm}
              articleId={articleId}
              setArticleId={setArticleId}
            />
          )}
          {activeTab === 'rss' && (
            <RssSection
              handleRequest={handleRequest}
              loading={loading}
              rssSearchForm={rssSearchForm}
              setRssSearchForm={setRssSearchForm}
              rssSourcesSelected={rssSourcesSelected}
              setRssSourcesSelected={setRssSourcesSelected}
              rssArticleId={rssArticleId}
              setRssArticleId={setRssArticleId}
            />
          )}
          {activeTab === 'fakenews' && (
            <FakeNewsSection
              handleRequest={handleRequest}
              loading={loading}
              fakeNewsForm={fakeNewsForm}
              setFakeNewsForm={setFakeNewsForm}
            />
          )}
        </main>

        {/* Response / Error Display with ref for scrolling */}
        {(loading || response || error) && (
          <div ref={resultRef} className="result-section">
            {loading && (
              <div className="loading-spinner">
                <div className="spinner"></div>
                <p>Processing your request...</p>
              </div>
            )}
            {error && (
              <div className="error-box">
                <strong>⚠️ Error</strong>
                <p>{error}</p>
              </div>
            )}
            {response && (
              <div className="success-box">
                <strong>✓ Response</strong>
                {/* Special rendering for fake news analysis */}
                {response.data?.fakeProbability !== undefined ? (
                  <div className="fake-news-result">
                    <div className="score-display">
                      <div className="score-circle" style={{
                        borderColor: getScoreColor(response.data.fakeProbability)
                      }}>
                        <span className="score-value" style={{ color: getScoreColor(response.data.fakeProbability) }}>
                          {response.data.fakeProbability}
                        </span>
                        <span className="score-label">Fake Score</span>
                      </div>
                      <div className="risk-badge" style={{
                        backgroundColor: getScoreColor(response.data.fakeProbability)
                      }}>
                        {response.data.riskLevel}
                      </div>
                    </div>
                    <p className="risk-description">{response.data.riskDescription}</p>

                    {/* Fact Check Results */}
                    {response.data.factChecks && response.data.factChecks.length > 0 && (
                      <div className="fact-check-section">
                        <h4>🔍 Fact-Check Results</h4>
                        {response.data.factChecks.map((fc, idx) => (
                          <div key={idx} className="fact-check-item">
                            <div className="fact-check-header">
                              <strong>Claim:</strong> "{fc.claimText}"
                            </div>
                            <div className="fact-check-details">
                              <span className="publisher">{fc.publisher}</span>
                              <span className={`verdict ${fc.verdict.toLowerCase()}`}>
                                {fc.verdict}
                              </span>
                              {fc.url && (
                                <a href={fc.url} target="_blank" rel="noopener noreferrer" className="fact-check-link">
                                  Read full fact-check
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Breakdown */}
                    {response.data.breakdown && (
                      <div className="breakdown-section">
                        <h4>Score Breakdown</h4>
                        <div className="breakdown-grid">
                          {Object.entries(response.data.breakdown).map(([key, value]) => (
                            <div key={key} className="breakdown-item">
                              <span className="breakdown-label">{formatBreakdownLabel(key)}</span>
                              <div className="breakdown-bar">
                                <div className="bar-fill" style={{
                                  width: `${Math.min(100, value)}%`,
                                  backgroundColor: value > 50 ? '#e74c3c' : value > 25 ? '#f39c12' : '#27ae60'
                                }}></div>
                                <span className="bar-value">{value}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Flags */}
                    {response.data.flags && response.data.flags.length > 0 && (
                      <div className="flags-section">
                        <h4>⚠️ Detected Flags</h4>
                        <ul className="flags-list">
                          {response.data.flags.map((flag, idx) => (
                            <li key={idx}>{flag}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <pre>{JSON.stringify(response, null, 2)}</pre>
                )}
              </div>
            )}
          </div>
        )}

        {/* API Documentation */}
        <footer className="doc-section">
          <h3 className="doc-title">API Quick Reference</h3>
          <div className="doc-grid">
            <DocColumn
              title="Health"
              color="#27ae60"
              endpoints={[{ method: 'GET', path: '/api/health' }]}
            />
            <DocColumn
              title="Authentication"
              color="#3498db"
              endpoints={[
                { method: 'POST', path: '/api/auth/register' },
                { method: 'POST', path: '/api/auth/login' },
                { method: 'POST', path: '/api/auth/logout' }
              ]}
            />
            <DocColumn
              title="Sentiment"
              color="#9b59b6"
              endpoints={[
                { method: 'POST', path: '/api/sentiment/analyze' },
                { method: 'POST', path: '/api/sentiment/analyze-batch' },
                { method: 'POST', path: '/api/sentiment/aggregate' }
              ]}
            />
            <DocColumn
              title="News (Guardian)"
              color="#e67e22"
              endpoints={[
                { method: 'GET', path: '/api/news/guardian/search' },
                { method: 'GET', path: '/api/news/guardian/search-with-sentiment' },
                { method: 'GET', path: '/api/news/guardian/search-with-analysis' },
                { method: 'GET', path: '/api/news/guardian/latest/:section' },
                { method: 'GET', path: '/api/news/guardian/article/:id' },
                { method: 'GET', path: '/api/news/guardian/sections' }
              ]}
            />
            <DocColumn
              title="RSS Feeds"
              color="#2ecc71"
              endpoints={[
                { method: 'GET', path: '/api/news/rss/search' },
                { method: 'GET', path: '/api/news/rss/feeds' },
                { method: 'GET', path: '/api/news/rss/sources' },
                { method: 'GET', path: '/api/news/rss/article/:id' }
              ]}
            />
            <DocColumn
              title="Fake News Analysis"
              color="#e74c3c"
              endpoints={[
                { method: 'POST', path: '/api/news/analyze/fake-score' },
                { method: 'POST', path: '/api/news/analyze/compare' },
                { method: 'POST', path: '/api/news/analyze/batch' }
              ]}
            />
          </div>
        </footer>
      </div>
    </div>
  )
}

// ==================== RSS SECTION COMPONENT ====================
function RssSection({ handleRequest, loading, rssSearchForm, setRssSearchForm, rssSourcesSelected, setRssSourcesSelected, rssArticleId, setRssArticleId }) {
  const [availableSources, setAvailableSources] = useState([])
  const [loadingSources, setLoadingSources] = useState(false)

  // Fetch available RSS sources on mount
  useEffect(() => {
    const fetchSources = async () => {
      setLoadingSources(true)
      const { data, error } = await callApi('GET', '/api/news/rss/sources')
      if (!error && data?.data) {
        setAvailableSources(data.data)
      }
      setLoadingSources(false)
    }
    fetchSources()
  }, [])

  return (
    <>
      <section className="section">
        <h2 className="section-title"><b>📡 Get Available RSS Sources</b></h2>
        <p className="section-desc">List all available RSS feed sources with their credibility scores.</p>
        <div className="endpoint-badge"><span className="badge-get">GET</span> /api/news/rss/sources</div>

        <button
          onClick={() => handleRequest('GET', '/api/news/rss/sources')}
          disabled={loading}
          className="btn-primary"
        >
          {loading ? 'Fetching...' : 'Get RSS Sources'}
        </button>

        {availableSources.length > 0 && (
          <div className="sources-preview">
            <h4>Available Sources ({availableSources.length})</h4>
            <div className="source-grid">
              {availableSources.slice(0, 6).map(source => (
                <div key={source.key} className="source-card">
                  <strong>{source.name}</strong>
                  <span className={`credibility-badge ${source.credibility >= 90 ? 'high' : source.credibility >= 70 ? 'medium' : 'low'}`}>
                    {source.credibility}%
                  </span>
                  <span className="country-badge">{source.country}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="section">
        <h2 className="section-title"><b>🔍 Search RSS Feeds</b></h2>
        <p className="section-desc">Search across all RSS feeds for articles matching your keyword.</p>
        <div className="endpoint-badge"><span className="badge-get">GET</span> /api/news/rss/search</div>

        <div className="form-group">
          <label className="label">Search Query *</label>
          <input
            type="text"
            placeholder="e.g., technology, climate, AI"
            value={rssSearchForm.q}
            onChange={(e) => setRssSearchForm({ ...rssSearchForm, q: e.target.value })}
            className="input"
          />
        </div>

        <button
          onClick={() => {
            const params = new URLSearchParams({ q: rssSearchForm.q })
            handleRequest('GET', `/api/news/rss/search?${params}`)
          }}
          disabled={loading || !rssSearchForm.q}
          className="btn-primary"
        >
          {loading ? 'Searching...' : 'Search RSS Feeds'}
        </button>
      </section>

      <section className="section">
        <h2 className="section-title"><b>📰 Get RSS Feeds by Sources</b></h2>
        <p className="section-desc">Get articles from specific RSS sources. Leave empty to get all sources.</p>
        <div className="endpoint-badge"><span className="badge-get">GET</span> /api/news/rss/feeds</div>

        <div className="form-group">
          <label className="label">Source Keys (comma-separated)</label>
          <input
            type="text"
            placeholder="e.g., bbc, reuters, ap_news"
            value={rssSourcesSelected}
            onChange={(e) => setRssSourcesSelected(e.target.value)}
            className="input"
          />
          <small className="help-text">
            Available: bbc, bbc_world, reuters, ap_news, npr, dw
          </small>
        </div>

        <button
          onClick={() => {
            const params = rssSourcesSelected ? `?sources=${rssSourcesSelected}` : ''
            handleRequest('GET', `/api/news/rss/feeds${params}`)
          }}
          disabled={loading}
          className="btn-primary"
        >
          {loading ? 'Fetching...' : 'Get RSS Feeds'}
        </button>
      </section>

      <section className="section">
        <h2 className="section-title"><b>📄 Get RSS Article by ID</b></h2>
        <p className="section-desc">Fetch a specific RSS article by its unique ID.</p>
        <div className="endpoint-badge"><span className="badge-get">GET</span> /api/news/rss/article/:id</div>

        <div className="form-group">
          <label className="label">Article ID</label>
          <input
            type="text"
            placeholder="e.g., bbc-abc123def456"
            value={rssArticleId}
            onChange={(e) => setRssArticleId(e.target.value)}
            className="input"
          />
          <small className="help-text">
            Article IDs can be found in the search or feeds response
          </small>
        </div>

        <button
          onClick={() => handleRequest('GET', `/api/news/rss/article/${rssArticleId}`)}
          disabled={loading || !rssArticleId}
          className="btn-primary"
        >
          {loading ? 'Fetching...' : 'Get Article'}
        </button>
      </section>
    </>
  )
}

// ==================== FAKE NEWS ANALYSIS SECTION ====================
function FakeNewsSection({ handleRequest, loading, fakeNewsForm, setFakeNewsForm }) {
  return (
    <>
      <section className="section">
        <h2 className="section-title"><b>🔍 Fake News Checker</b></h2>
        <p className="section-desc">Enter a claim, statement, or news to check if it's real or fake.</p>
        <div className="endpoint-badge"><span className="badge-post">POST</span> /api/news/analyze/fake-score</div>

        <div className="form-group">
          <label className="label">Enter Claim or Information *</label>
          <textarea
            placeholder="e.g., President Donald J. Trump is dead"
            value={fakeNewsForm.title}
            onChange={(e) => setFakeNewsForm({ ...fakeNewsForm, title: e.target.value })}
            rows={4}
            className="textarea"
          />
          <small className="help-text">
            The system will check this against fact-checking databases and analyze for fake news patterns.
          </small>
        </div>

        <button
          onClick={() => handleRequest('POST', '/api/news/analyze/fake-score', {
            title: fakeNewsForm.title,
            description: '',
            bodyText: '',
            link: '',
            source: '',
            byline: ''
          })}
          disabled={loading || !fakeNewsForm.title.trim()}
          className="btn-primary"
        >
          {loading ? 'Checking with Fact-Check APIs...' : 'Check if Real or Fake'}
        </button>
      </section>

      {/* Quick Examples */}
      <section className="section example-section">
        <h2 className="section-title"><b>📝 Try These Examples</b></h2>
        <div className="example-grid">
          <div className="example-card">
            <h4>Claim to Check</h4>
            <pre>"President Donald J. Trump is dead"</pre>
            <button
              onClick={() => setFakeNewsForm({ ...fakeNewsForm, title: 'President Donald J. Trump is dead' })}
              className="btn-example"
            >
              Load Example
            </button>
          </div>

          <div className="example-card">
            <h4>Another Claim</h4>
            <pre>"Vaccines contain microchips for tracking"</pre>
            <button
              onClick={() => setFakeNewsForm({ ...fakeNewsForm, title: 'Vaccines contain microchips for tracking' })}
              className="btn-example"
            >
              Load Example
            </button>
          </div>
        </div>
      </section>
    </>
  )
}

// ==================== EXISTING SUB-COMPONENTS ====================

function HealthSection({ handleRequest, loading }) {
  return (
    <section className="section">
      <h2 className="section-title">🏥 Health Check</h2>
      <p className="section-desc">Verify that the API server and database connection are working properly.</p>
      <div className="endpoint-badge"><span className="badge-get">GET</span> /api/health</div>
      <button
        onClick={() => handleRequest('GET', '/api/health')}
        disabled={loading}
        className="btn-primary"
      >
        {loading ? 'Checking...' : 'Run Health Check'}
      </button>
    </section>
  )
}

function AuthSection({ handleRequest, handleLogout, loading, token, user, isLoggedIn, loginForm, setLoginForm, registerForm, setRegisterForm }) {
  return (
    <>
      {/* Logged-in Status */}
      {isLoggedIn ? (
        <section className="section">
          <h2 className="section-title"><b>🟢 Logged In</b></h2>
          {user && (
            <div className="user-info-box">
              <p><strong>User:</strong> {user.username}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Role:</strong> {user.role}</p>
            </div>
          )}
          <div className="token-preview">
            <strong>Token:</strong>
            <code>{token?.substring(0, 30)}...</code>
          </div>
          <button
            onClick={handleLogout}
            disabled={loading}
            className="btn-logout"
          >
            {loading ? 'Logging out...' : 'Logout'}
          </button>
        </section>
      ) : (
        <>
          <section className="section">
            <h2 className="section-title"><b>Register New User</b></h2>
            <p className="section-desc">Create a new user account with username, email, and password.</p>
            <div className="endpoint-badge"><span className="badge-post">POST</span> /api/auth/register</div>

            <div className="form-group">
              <label className="label">Username</label>
              <input
                type="text"
                placeholder="johndoe"
                value={registerForm.username}
                onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                className="input"
              />
            </div>

            <div className="form-group">
              <label className="label">Email</label>
              <input
                type="email"
                placeholder="john@example.com"
                value={registerForm.email}
                onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                className="input"
              />
            </div>

            <div className="form-group">
              <label className="label">Password (min 8 characters)</label>
              <input
                type="password"
                placeholder="••••••••"
                value={registerForm.password}
                onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                className="input"
              />
            </div>

            <button
              onClick={() => handleRequest('POST', '/api/auth/register', registerForm)}
              disabled={loading}
              className="btn-primary"
            >
              {loading ? 'Registering...' : 'Register User'}
            </button>
          </section>

          <section className="section">
            <h2 className="section-title"><b>Login User</b></h2>
            <p className="section-desc">Authenticate with email and password to receive a JWT token.</p>
            <div className="endpoint-badge"><span className="badge-post">POST</span> /api/auth/login</div>

            <div className="form-group">
              <label className="label">Email</label>
              <input
                type="email"
                placeholder="john@example.com"
                value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                className="input"
              />
            </div>

            <div className="form-group">
              <label className="label">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                className="input"
              />
            </div>

            <button
              onClick={() => handleRequest('POST', '/api/auth/login', loginForm)}
              disabled={loading}
              className="btn-primary"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </section>
        </>
      )}
    </>
  )
}

function SentimentSection({ handleRequest, loading, sentimentForm, setSentimentForm, batchTexts, setBatchTexts }) {
  return (
    <>
      <section className="section">
        <h2 className="section-title"><b>Analyze Single Text</b></h2>
        <p className="section-desc">Analyze the sentiment of a single piece of text.</p>
        <div className="endpoint-badge"><span className="badge-post">POST</span> /api/sentiment/analyze</div>

        <div className="form-group">
          <label className="label">Text to analyze</label>
          <textarea
            placeholder="Enter text here, e.g., 'I love this product! It works amazing.'"
            value={sentimentForm.text}
            onChange={(e) => setSentimentForm({ ...sentimentForm, text: e.target.value })}
            rows={4}
            className="textarea"
          />
        </div>

        <button
          onClick={() => handleRequest('POST', '/api/sentiment/analyze', sentimentForm)}
          disabled={loading || !sentimentForm.text}
          className="btn-primary"
        >
          {loading ? 'Analyzing...' : 'Analyze Sentiment'}
        </button>
      </section>

      <section className="section">
        <h2 className="section-title"><b>Batch Sentiment Analysis</b></h2>
        <p className="section-desc">Analyze multiple texts at once. Enter each text on a new line.</p>
        <div className="endpoint-badge"><span className="badge-post">POST</span> /api/sentiment/analyze-batch</div>

        <div className="form-group">
          <label className="label">Texts (one per line)</label>
          <textarea
            placeholder="I love this!&#10;This is terrible.&#10;Pretty good overall."
            value={batchTexts}
            onChange={(e) => setBatchTexts(e.target.value)}
            rows={6}
            className="textarea"
          />
        </div>

        <button
          onClick={() => handleRequest('POST', '/api/sentiment/analyze-batch', {
            texts: batchTexts.split('\n').filter(t => t.trim())
          })}
          disabled={loading || !batchTexts.trim()}
          className="btn-primary"
        >
          {loading ? 'Analyzing...' : 'Analyze All Texts'}
        </button>
      </section>

      <section className="section">
        <h2 className="section-title"><b>Aggregate Sentiment Stats</b></h2>
        <p className="section-desc">Get aggregate statistics including distribution and percentages.</p>
        <div className="endpoint-badge"><span className="badge-post">POST</span> /api/sentiment/aggregate</div>

        <div className="form-group">
          <label className="label">Texts (one per line)</label>
          <textarea
            placeholder="Great product!&#10;Not worth the money.&#10;It's okay, nothing special."
            value={batchTexts}
            onChange={(e) => setBatchTexts(e.target.value)}
            rows={6}
            className="textarea"
          />
        </div>

        <button
          onClick={() => handleRequest('POST', '/api/sentiment/aggregate', {
            texts: batchTexts.split('\n').filter(t => t.trim())
          })}
          disabled={loading || !batchTexts.trim()}
          className="btn-primary"
        >
          {loading ? 'Calculating...' : 'Get Aggregate Stats'}
        </button>
      </section>
    </>
  )
}

function NewsSection({ handleRequest, loading, guardianSearchForm, setGuardianSearchForm, articleId, setArticleId }) {
  return (
    <>
      <section className="section">
        <h2 className="section-title"><b>Search Guardian Articles</b></h2>
        <p className="section-desc">Search articles from The Guardian API by keyword.</p>
        <div className="endpoint-badge"><span className="badge-get">GET</span> /api/news/guardian/search</div>

        <div className="form-grid">
          <div className="form-group">
            <label className="label">Search Query *</label>
            <input
              type="text"
              placeholder="e.g., artificial intelligence"
              value={guardianSearchForm.q}
              onChange={(e) => setGuardianSearchForm({ ...guardianSearchForm, q: e.target.value })}
              className="input"
            />
          </div>

          <div className="form-group">
            <label className="label">Section</label>
            <select
              value={guardianSearchForm.section}
              onChange={(e) => setGuardianSearchForm({ ...guardianSearchForm, section: e.target.value })}
              className="select"
            >
              <option value="">All Sections</option>
              <option value="technology">Technology</option>
              <option value="politics">Politics</option>
              <option value="business">Business</option>
              <option value="science">Science</option>
              <option value="sport">Sport</option>
              <option value="world">World News</option>
              <option value="uk-news">UK News</option>
              <option value="environment">Environment</option>
            </select>
          </div>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label className="label">From Date</label>
            <input
              type="date"
              value={guardianSearchForm.fromDate}
              onChange={(e) => setGuardianSearchForm({ ...guardianSearchForm, fromDate: e.target.value })}
              className="input"
            />
          </div>

          <div className="form-group">
            <label className="label">To Date</label>
            <input
              type="date"
              value={guardianSearchForm.toDate}
              onChange={(e) => setGuardianSearchForm({ ...guardianSearchForm, toDate: e.target.value })}
              className="input"
            />
          </div>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label className="label">Page</label>
            <input
              type="number"
              min="1"
              value={guardianSearchForm.page}
              onChange={(e) => setGuardianSearchForm({ ...guardianSearchForm, page: e.target.value })}
              className="input"
            />
          </div>

          <div className="form-group">
            <label className="label">Page Size</label>
            <input
              type="number"
              min="1"
              max="50"
              value={guardianSearchForm.pageSize}
              onChange={(e) => setGuardianSearchForm({ ...guardianSearchForm, pageSize: e.target.value })}
              className="input"
            />
          </div>
        </div>

        <button
          onClick={() => {
            const params = new URLSearchParams({
              q: guardianSearchForm.q,
              page: guardianSearchForm.page,
              pageSize: guardianSearchForm.pageSize
            })
            if (guardianSearchForm.section) params.append('section', guardianSearchForm.section)
            if (guardianSearchForm.fromDate) params.append('from-date', guardianSearchForm.fromDate)
            if (guardianSearchForm.toDate) params.append('to-date', guardianSearchForm.toDate)
            handleRequest('GET', `/api/news/guardian/search?${params}`)
          }}
          disabled={loading || !guardianSearchForm.q}
          className="btn-primary"
        >
          {loading ? 'Searching...' : 'Search Articles'}
        </button>
      </section>

      <section className="section">
        <h2 className="section-title"><b>Search with Sentiment</b></h2>
        <p className="section-desc">Search articles and automatically analyze sentiment for each result.</p>
        <div className="endpoint-badge"><span className="badge-get">GET</span> /api/news/guardian/search-with-sentiment</div>

        <div className="form-group">
          <label className="label">Search Query</label>
          <input
            type="text"
            placeholder="e.g., climate change"
            value={guardianSearchForm.q}
            onChange={(e) => setGuardianSearchForm({ ...guardianSearchForm, q: e.target.value })}
            className="input"
          />
        </div>

        <button
          onClick={() => {
            const params = new URLSearchParams({ q: guardianSearchForm.q, pageSize: '5' })
            handleRequest('GET', `/api/news/guardian/search-with-sentiment?${params}`)
          }}
          disabled={loading || !guardianSearchForm.q}
          className="btn-primary"
        >
          {loading ? 'Searching...' : 'Search + Analyze'}
        </button>
      </section>

      <section className="section">
        <h2 className="section-title"><b>Search with Full Analysis</b></h2>
        <p className="section-desc">Search articles and get both sentiment analysis AND fake news scoring.</p>
        <div className="endpoint-badge"><span className="badge-get">GET</span> /api/news/guardian/search-with-analysis</div>

        <div className="form-group">
          <label className="label">Search Query</label>
          <input
            type="text"
            placeholder="e.g., AI breakthrough"
            value={guardianSearchForm.q}
            onChange={(e) => setGuardianSearchForm({ ...guardianSearchForm, q: e.target.value })}
            className="input"
          />
        </div>

        <button
          onClick={() => {
            const params = new URLSearchParams({ q: guardianSearchForm.q, pageSize: '5' })
            handleRequest('GET', `/api/news/guardian/search-with-analysis?${params}`)
          }}
          disabled={loading || !guardianSearchForm.q}
          className="btn-primary"
        >
          {loading ? 'Searching...' : 'Search + Full Analysis'}
        </button>
      </section>

      <section className="section">
        <h2 className="section-title"><b>Get Article by ID</b></h2>
        <p className="section-desc">Fetch a specific Guardian article with sentiment analysis.</p>
        <div className="endpoint-badge"><span className="badge-get">GET</span> /api/news/guardian/article/:id</div>

        <div className="form-group">
          <label className="label">Article ID</label>
          <input
            type="text"
            placeholder="e.g., technology/2024/jan/15/ai-revolution"
            value={articleId}
            onChange={(e) => setArticleId(e.target.value)}
            className="input"
          />
        </div>

        <button
          onClick={() => handleRequest('GET', `/api/news/guardian/article/${articleId}`)}
          disabled={loading || !articleId}
          className="btn-primary"
        >
          {loading ? 'Fetching...' : 'Get Article'}
        </button>
      </section>

      <section className="section">
        <h2 className="section-title"><b>Get Latest by Section</b></h2>
        <p className="section-desc">Get the most recent articles from a specific section.</p>
        <div className="endpoint-badge"><span className="badge-get">GET</span> /api/news/guardian/latest/:section</div>

        <div className="form-group">
          <label className="label">Select Section</label>
          <select
            value={guardianSearchForm.section}
            onChange={(e) => setGuardianSearchForm({ ...guardianSearchForm, section: e.target.value })}
            className="select"
          >
            <option value="">Choose a section...</option>
            <option value="technology">Technology</option>
            <option value="politics">Politics</option>
            <option value="business">Business</option>
            <option value="science">Science</option>
            <option value="sport">Sport</option>
            <option value="world">World News</option>
            <option value="uk-news">UK News</option>
            <option value="environment">Environment</option>
          </select>
        </div>

        <button
          onClick={() => handleRequest('GET', `/api/news/guardian/latest/${guardianSearchForm.section}?pageSize=10`)}
          disabled={loading || !guardianSearchForm.section}
          className="btn-primary"
        >
          {loading ? 'Fetching...' : 'Get Latest Articles'}
        </button>
      </section>

      <section className="section">
        <h2 className="section-title"><b>Get Available Sections</b></h2>
        <p className="section-desc">List all available sections from The Guardian API.</p>
        <div className="endpoint-badge"><span className="badge-get">GET</span> /api/news/guardian/sections</div>

        <button
          onClick={() => handleRequest('GET', '/api/news/guardian/sections')}
          disabled={loading}
          className="btn-primary"
        >
          {loading ? 'Fetching...' : 'Get All Sections'}
        </button>
      </section>
    </>
  )
}

function DocColumn({ title, color, endpoints }) {
  return (
    <div className="doc-column">
      <h4 className="doc-column-title" style={{ color }}>{title}</h4>
      <ul className="doc-list">
        {endpoints.map((ep, i) => (
          <li key={i} className="doc-item">
            <span className={ep.method === 'GET' ? 'badge-get' : 'badge-post'}>{ep.method}</span>
            {ep.path}
          </li>
        ))}
      </ul>
    </div>
  )
}

// ==================== TABS CONFIG ====================
const tabs = [
  { id: 'health', label: 'Health', icon: '🏥', color: '#27ae60' },
  { id: 'auth', label: 'Auth', icon: '👤', color: '#3498db' },
  { id: 'sentiment', label: 'Sentiment', icon: '😊', color: '#9b59b6' },
  { id: 'news', label: 'Guardian', icon: '📰', color: '#e67e22' },
  { id: 'rss', label: 'RSS Feeds', icon: '📡', color: '#2ecc71' },
  { id: 'fakenews', label: 'Fake News', icon: '🔍', color: '#e74c3c' }
]

export default apiTester