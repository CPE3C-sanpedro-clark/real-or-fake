import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import UserLayout from '../assets/components/UserLayout';
import '../styles/history.css';

const API_BASE = import.meta.env.VITE_API_BASE || '';

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

function FilterIcon({ className }) {
    return (
        <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="22 3 2 3 10 13 10 21 14 18 14 13 22 3"></polygon>
        </svg>
    );
}

export default function HistoryPage() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterVerdict, setFilterVerdict] = useState('all');
    const [filterType, setFilterType] = useState('all');
    const [historyEntries, setHistoryEntries] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [totalChecks, setTotalChecks] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const itemsPerPage = 20;

    const token = localStorage.getItem('authToken');

    // Get auth headers with session token
    const getAuthHeaders = () => {
        const sessionToken = localStorage.getItem('sessionToken');
        const headers = { Authorization: `Bearer ${token}` };
        if (sessionToken) {
            headers['X-Session-Token'] = sessionToken;
        }
        return headers;
    };

    const fetchHistory = async () => {
        setLoading(true);
        setError(null);
        
        try {
            // Use a large limit to get all checks (1000 should be enough)
            // Or use pagination to fetch all pages
            let url = `${API_BASE}/api/checks?limit=1000`;
            
            const response = await axios.get(url, {
                headers: getAuthHeaders()
            });
            
            if (response.data.success) {
                let allChecks = response.data.data || [];
                console.log(`Fetched ${allChecks.length} total checks from database`);
                
                // Apply filters
                let filteredChecks = [...allChecks];
                
                if (filterVerdict !== 'all') {
                    filteredChecks = filteredChecks.filter(check => check.verdict === filterVerdict);
                }
                
                if (filterType !== 'all') {
                    filteredChecks = filteredChecks.filter(check => check.check_type === filterType);
                }
                
                // Sort by date (newest first)
                filteredChecks.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                
                // Update total count for pagination
                setTotalChecks(filteredChecks.length);
                setTotalPages(Math.ceil(filteredChecks.length / itemsPerPage));
                
                // Apply pagination
                const startIndex = (currentPage - 1) * itemsPerPage;
                const paginatedChecks = filteredChecks.slice(startIndex, startIndex + itemsPerPage);
                
                setHistoryEntries(paginatedChecks);
                
                // Calculate stats from all checks (not just filtered)
                const verifiedCount = allChecks.filter(c => c.verdict === 'verified').length;
                const disputedCount = allChecks.filter(c => c.verdict === 'disputed').length;
                const mixedCount = allChecks.filter(c => c.verdict === 'mixed').length;
                
                // Calculate unique days
                const uniqueDays = new Set(allChecks.map(c => 
                    new Date(c.created_at).toLocaleDateString()
                )).size;
                
                // Calculate average fake score
                const checksWithScores = allChecks.filter(c => c.fake_news_score);
                const avgFakeScore = checksWithScores.length > 0 
                    ? Math.round(checksWithScores.reduce((sum, c) => sum + c.fake_news_score, 0) / checksWithScores.length)
                    : null;
                
                setStats({
                    total_activities: allChecks.length,
                    active_days: uniqueDays,
                    verified_claims: verifiedCount,
                    disputed_claims: disputedCount,
                    mixed_claims: mixedCount,
                    avg_fake_score: avgFakeScore
                });
            }
        } catch (err) {
            console.error('Failed to fetch history:', err);
            setError(err.response?.data?.error || 'Failed to load history');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchHistory();
        }
    }, [filterVerdict, filterType, currentPage]);

    const getVerdictBadge = (verdict) => {
        if (verdict === 'verified') return <span className="badge badge-green">Verified</span>;
        if (verdict === 'mixed') return <span className="badge badge-yellow">Mixed Evidence</span>;
        if (verdict === 'disputed') return <span className="badge badge-red">Disputed</span>;
        return null;
    };

    const getActivityIcon = (type) => {
        switch(type) {
            case 'text': return '🔍';
            case 'link': return '🔗';
            case 'image': return '🖼️';
            case 'url': return '🔗';
            default: return '📝';
        }
    };

    const getActivityLabel = (type) => {
        switch(type) {
            case 'text': return 'Text Search';
            case 'link': return 'URL Analysis';
            case 'url': return 'URL Analysis';
            case 'image': return 'Image Analysis';
            default: return type || 'Fact Check';
        }
    };

    const filteredHistory = historyEntries.filter(entry => {
        const displayText = entry.query || '';
        return displayText.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const handleViewDetails = (entry) => {
        const searchQuery = entry.query;
        navigate(`/results?q=${encodeURIComponent(searchQuery)}&type=${entry.check_type}`);
    };

    // Helper to truncate long text
    const truncateText = (text, maxLength = 80) => {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    };

    // Pagination handlers
    const goToPage = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    return (
        <UserLayout>
            <div className="history-page">
                <div className="history-header">
                    <button className="back-home-btn" onClick={() => navigate('/landing')}>
                        <ArrowLeftIcon className="icon" />
                        Back to Dashboard
                    </button>
                    <h1 className="history-title">Fact-Check History</h1>
                    <p className="history-subtitle">View your past fact-check analyses and results</p>
                </div>

                {/* Stats Summary */}
                {stats && (
                    <div className="stats-summary">
                        <div className="stat-card">
                            <span className="stat-value">{stats.total_activities || 0}</span>
                            <span className="stat-label">Total Checks</span>
                        </div>
                        <div className="stat-card">
                            <span className="stat-value">{stats.active_days || 0}</span>
                            <span className="stat-label">Active Days</span>
                        </div>
                        <div className="stat-card">
                            <span className="stat-value stat-green">{stats.verified_claims || 0}</span>
                            <span className="stat-label">Verified</span>
                        </div>
                        <div className="stat-card">
                            <span className="stat-value stat-yellow">{stats.mixed_claims || 0}</span>
                            <span className="stat-label">Mixed</span>
                        </div>
                        <div className="stat-card">
                            <span className="stat-value stat-red">{stats.disputed_claims || 0}</span>
                            <span className="stat-label">Disputed</span>
                        </div>
                        {stats.avg_fake_score && (
                            <div className="stat-card">
                                <span className="stat-value">{stats.avg_fake_score}%</span>
                                <span className="stat-label">Avg Risk Score</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Filters */}
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
                            value={filterType}
                            onChange={(e) => {
                                setFilterType(e.target.value);
                                setCurrentPage(1); // Reset to first page on filter change
                            }}
                            className="filter-select"
                        >
                            <option value="all">All Types</option>
                            <option value="text">Text Searches</option>
                            <option value="link">URL Checks</option>
                            <option value="image">Image Analysis</option>
                        </select>
                    </div>

                    <div className="filter-dropdown">
                        <select
                            value={filterVerdict}
                            onChange={(e) => {
                                setFilterVerdict(e.target.value);
                                setCurrentPage(1); // Reset to first page on filter change
                            }}
                            className="filter-select"
                        >
                            <option value="all">All Verdicts</option>
                            <option value="verified">Verified</option>
                            <option value="mixed">Mixed Evidence</option>
                            <option value="disputed">Disputed</option>
                        </select>
                    </div>
                </div>

                {/* History List */}
                {loading ? (
                    <div className="loading-state">
                        <div className="spinner" />
                        <p>Loading your history...</p>
                    </div>
                ) : error ? (
                    <div className="error-state">{error}</div>
                ) : (
                    <>
                        <div className="history-list">
                            {filteredHistory.length === 0 ? (
                                <div className="empty-state">
                                    <p>No history entries found</p>
                                    <p className="empty-hint">
                                        {searchTerm || filterVerdict !== 'all' || filterType !== 'all' 
                                            ? "Try changing your filters" 
                                            : "Start fact-checking news articles to see them here"}
                                    </p>
                                </div>
                            ) : (
                                filteredHistory.map((entry) => (
                                    <div key={entry.id} className="history-card" onClick={() => handleViewDetails(entry)}>
                                        <div className="card-header">
                                            <div className="query-section">
                                                <span className="query-type">
                                                    {getActivityIcon(entry.check_type)} {getActivityLabel(entry.check_type)}
                                                </span>
                                                <h3 className="query-text" title={entry.query}>
                                                    {truncateText(entry.query, 100)}
                                                </h3>
                                            </div>
                                            <div className="verdict-section">
                                                {getVerdictBadge(entry.verdict)}
                                            </div>
                                        </div>

                                        {entry.fake_news_score && (
                                            <div className="fake-score-bar">
                                                <div className="fake-score-label">
                                                    Misinformation Score: {entry.fake_news_score}%
                                                </div>
                                                <div className="fake-score-track">
                                                    <div 
                                                        className="fake-score-fill"
                                                        style={{
                                                            width: `${entry.fake_news_score}%`,
                                                            background: entry.fake_news_score > 60 
                                                                ? '#ef4444' 
                                                                : entry.fake_news_score > 40 
                                                                    ? '#fbbf24' 
                                                                    : '#4ade80'
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        <div className="card-meta">
                                            <div className="meta-left">
                                                <span className="meta-item">
                                                    <CalendarIcon className="meta-icon" />
                                                    {new Date(entry.created_at).toLocaleDateString('en-US', {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </span>
                                                {entry.sources_checked && entry.sources_checked > 0 && (
                                                    <span className="meta-item">
                                                        📰 {entry.sources_checked} sources
                                                    </span>
                                                )}
                                            </div>
                                            <button className="view-details-btn">
                                                View Details <ExternalLinkIcon className="icon" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        
                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="pagination">
                                <button 
                                    onClick={() => goToPage(currentPage - 1)} 
                                    disabled={currentPage === 1}
                                    className="pagination-btn"
                                >
                                    Previous
                                </button>
                                <span className="pagination-info">
                                    Page {currentPage} of {totalPages} ({totalChecks} items)
                                </span>
                                <button 
                                    onClick={() => goToPage(currentPage + 1)} 
                                    disabled={currentPage === totalPages}
                                    className="pagination-btn"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </UserLayout>
    );
}