import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import UserLayout from '../assets/components/UserLayout';
import '../styles/history.css';

function ArrowLeftIcon({ className }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12"></line>
      <polyline points="12 19 5 12 12 5"></polyline>
    </svg>
  );
}

function ExternalLinkIcon({ className }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

function SearchIcon({ className }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
  );
}

function CalendarIcon({ className }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="16" y1="2" x2="16" y2="6"></line>
      <line x1="8" y1="2" x2="8" y2="6"></line>
      <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
  );
}

// Mock data for history entries
const MOCK_HISTORY = [
  {
    id: 1,
    query: 'Climate change effects on polar bears',
    type: 'text',
    date: '2026-04-22',
    verdict: 'verified',
    sourcesCount: 8,
    summary: 'Multiple credible sources confirm significant impact on polar bear habitats due to melting ice.'
  },
  {
    id: 2,
    query: 'New electric vehicle battery technology breakthrough',
    type: 'text',
    date: '2026-04-21',
    verdict: 'mixed',
    sourcesCount: 5,
    summary: 'Claims about battery breakthrough show mixed evidence across different sources.'
  },
  {
    id: 3,
    query: 'https://www.theguardian.com/technology/2026/apr/20/ai-regulation-debate',
    type: 'url',
    date: '2026-04-20',
    verdict: 'verified',
    sourcesCount: 3,
    summary: 'Article verified as authentic Guardian publication with accurate information.'
  },
  {
    id: 4,
    query: 'Vitamin C cures common cold within 24 hours',
    type: 'text',
    date: '2026-04-19',
    verdict: 'disputed',
    sourcesCount: 12,
    summary: 'Medical experts dispute claims; evidence shows Vitamin C may reduce symptoms but not cure.'
  },
  {
    id: 5,
    query: 'SpaceX Mars colonization timeline 2030',
    type: 'text',
    date: '2026-04-18',
    verdict: 'mixed',
    sourcesCount: 6,
    summary: 'Timeline claims vary across sources; official SpaceX statements differ from expert analysis.'
  },
  {
    id: 6,
    query: 'Coffee consumption linked to longer lifespan',
    type: 'text',
    date: '2026-04-17',
    verdict: 'verified',
    sourcesCount: 9,
    summary: 'Multiple peer-reviewed studies support correlation between moderate coffee intake and longevity.'
  },
];

export default function HistoryPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterVerdict, setFilterVerdict] = useState('all');
  const [historyEntries] = useState(MOCK_HISTORY);

  const getVerdictBadge = (verdict) => {
    if (verdict === 'verified') return <span className="badge badge-green">Verified</span>;
    if (verdict === 'mixed') return <span className="badge badge-yellow">Mixed Evidence</span>;
    if (verdict === 'disputed') return <span className="badge badge-red">Disputed</span>;
    return null;
  };

  const filteredHistory = historyEntries.filter(entry => {
    const matchesSearch = entry.query.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesVerdict = filterVerdict === 'all' || entry.verdict === filterVerdict;
    return matchesSearch && matchesVerdict;
  });

  const handleViewDetails = (entry) => {
    navigate(`/results?q=${encodeURIComponent(entry.query)}&type=${entry.type}`);
  };

  return (
    <UserLayout>
      <div className="history-page">

        {/* HEADER */}
        <div className="history-header">
          <button
            className="back-home-btn"
            onClick={() => navigate('/results?q=')}
          >
            <ArrowLeftIcon className="icon" />
            Back to Dashboard
          </button>
          <h1 className="history-title">Fact-Check History</h1>
          <p className="history-subtitle">View your past fact-check analyses and results</p>
        </div>

        {/* FILTERS */}
        <div className="history-filters">
          <div className="search-box">
            <SearchIcon className="search-icon" />
            <input
              type="text"
              placeholder="Search your history..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filter-dropdown">
            <select
              value={filterVerdict}
              onChange={(e) => setFilterVerdict(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Verdicts</option>
              <option value="verified">Verified</option>
              <option value="mixed">Mixed Evidence</option>
              <option value="disputed">Disputed</option>
            </select>
          </div>
        </div>

        {/* STATS SUMMARY */}
        <div className="stats-summary">
          <div className="stat-card">
            <span className="stat-value">{historyEntries.length}</span>
            <span className="stat-label">Total Checks</span>
          </div>
          <div className="stat-card">
            <span className="stat-value stat-green">
              {historyEntries.filter(e => e.verdict === 'verified').length}
            </span>
            <span className="stat-label">Verified</span>
          </div>
          <div className="stat-card">
            <span className="stat-value stat-yellow">
              {historyEntries.filter(e => e.verdict === 'mixed').length}
            </span>
            <span className="stat-label">Mixed</span>
          </div>
          <div className="stat-card">
            <span className="stat-value stat-red">
              {historyEntries.filter(e => e.verdict === 'disputed').length}
            </span>
            <span className="stat-label">Disputed</span>
          </div>
        </div>

        {/* HISTORY LIST */}
        <div className="history-list">
          {filteredHistory.length === 0 ? (
            <div className="empty-state">
              <p>No history entries found</p>
            </div>
          ) : (
            filteredHistory.map((entry) => (
              <div key={entry.id} className="history-card">
                <div className="card-header">
                  <div className="query-section">
                    <span className="query-type">{entry.type === 'url' ? 'URL Analysis' : 'Text Search'}</span>
                    <h3 className="query-text">{entry.query}</h3>
                  </div>
                  <div className="verdict-section">
                    {getVerdictBadge(entry.verdict)}
                  </div>
                </div>

                <p className="query-summary">{entry.summary}</p>

                <div className="card-meta">
                  <div className="meta-left">
                    <span className="meta-item">
                      <CalendarIcon className="meta-icon" />
                      {new Date(entry.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                    <span className="meta-item">
                      {entry.sourcesCount} source{entry.sourcesCount !== 1 ? 's' : ''} analyzed
                    </span>
                  </div>
                  <button
                    className="view-details-btn"
                    onClick={() => handleViewDetails(entry)}
                  >
                    View Details <ExternalLinkIcon className="icon" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </UserLayout>
  );
}
