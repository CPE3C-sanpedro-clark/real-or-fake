import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import UserLayout from "../assets/components/UserLayout";
import "../styles/landing.css";

const API_BASE = import.meta.env.VITE_API_BASE || '';

export default function LandingPage() {
  const [showOptions, setShowOptions] = useState(false);
  const [activeTab, setActiveTab] = useState('link');
  const [query, setQuery] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [recentChecks, setRecentChecks] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  // Get category from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const categoryParam = urlParams.get('category');

  // Set query if category is provided
  useEffect(() => {
    if (categoryParam && categoryParam !== 'All') {
      setQuery(categoryParam);
    }
  }, [categoryParam]);

  // Get auth headers with session token
  const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken');
    const sessionToken = localStorage.getItem('sessionToken');
    const headers = { Authorization: `Bearer ${token}` };
    if (sessionToken) {
      headers['X-Session-Token'] = sessionToken;
    }
    return headers;
  };

  // Fetch recent checks on load - get last 10 unique checks
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) return;
    
    fetch(`${API_BASE}/api/checks?limit=50`, {
      headers: getAuthHeaders()
    })
      .then(res => res.json())
      .then(data => { 
        if (data.success) {
          // Remove duplicates by query (keep most recent)
          const uniqueChecks = [];
          const seenQueries = new Set();
          
          for (const check of data.data) {
            if (!seenQueries.has(check.query)) {
              seenQueries.add(check.query);
              uniqueChecks.push(check);
            }
          }
          
          setRecentChecks(uniqueChecks.slice(0, 10));
        }
      })
      .catch(() => {});
  }, []);

  const handleSearch = () => {
    const searchTerm = query.trim();
    if (!searchTerm) return;
    // REMOVED: await saveCheck - results page will handle saving
    navigate(`/results?q=${encodeURIComponent(searchTerm)}&type=text`);
  };

  const handleLinkCheck = () => {
    const searchTerm = urlInput.trim();
    if (!searchTerm) return;
    // REMOVED: await saveCheck - results page will handle saving
    navigate(`/results?q=${encodeURIComponent(searchTerm)}&type=link`);
  };

  const handleImageSelect = (file) => {
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleImageCheck = () => {
    if (!imageFile) return;
    const searchTerm = imageFile.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
    // REMOVED: await saveCheck - results page will handle saving
    navigate(`/results?q=${encodeURIComponent(searchTerm)}&type=image`);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleImageSelect(file);
    }
  };

  useEffect(() => {
    const handleClick = (e) => {
      if (!e.target.closest('.search-wrapper')) setShowOptions(false);
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const getVerdictStyle = (verdict) => {
    if (verdict === 'verified') return { label: 'Verified', color: '#22c55e' };
    if (verdict === 'disputed') return { label: 'Disputed', color: '#ef4444' };
    return { label: 'Mixed Evidence', color: '#f59e0b' };
  };

  return (
    <UserLayout>
      <main className="landing-content">

        {/* HERO */}
        <div className="landing-hero">
          <h1 className="landing-title">What would you like to verify today?</h1>
          <p className="landing-subtitle">Enter a claim, paste a link, or upload an image</p>
        </div>

        {/* SEARCH */}
        <div className="search-wrapper">
          <div className="search-box">
            <button className="plus-btn" onClick={() => setShowOptions(!showOptions)}>+</button>
            <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              placeholder="Search the truth behind the headlines..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
            />
            <button className="check-btn" onClick={handleSearch}>Check</button>
          </div>

          {showOptions && (
            <div className="check-dropdown">
              <div className="check-tabs">
                <button
                  className={`check-tab ${activeTab === 'link' ? 'active' : ''}`}
                  onClick={() => setActiveTab('link')}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
                    <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
                  </svg>
                  Link
                </button>
                <button
                  className={`check-tab ${activeTab === 'image' ? 'active' : ''}`}
                  onClick={() => setActiveTab('image')}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                  Image
                </button>
              </div>

              {/* LINK TAB */}
              {activeTab === 'link' && (
                <div className="check-tab-content">
                  <label>News Article URL</label>
                  <input
                    type="url"
                    placeholder="https://example.com/news"
                    className="check-url-input"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleLinkCheck(); }}
                  />
                  <button className="verify-btn" onClick={handleLinkCheck}>Check Link</button>
                </div>
              )}

              {/* IMAGE TAB */}
              {activeTab === 'image' && (
                <div className="check-tab-content">
                  {!imagePreview ? (
                    <div
                      className={`upload-area ${dragOver ? 'drag-over' : ''}`}
                      onDrop={handleDrop}
                      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="16 16 12 12 8 16"/>
                        <line x1="12" y1="12" x2="12" y2="21"/>
                        <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/>
                      </svg>
                      <p>Drag & drop an image</p>
                      <span>or</span>
                      <button
                        className="browse-btn"
                        onClick={() => fileInputRef.current.click()}
                      >
                        Browse Files
                      </button>
                      <small>JPG, PNG, GIF, WebP</small>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => handleImageSelect(e.target.files[0])}
                      />
                    </div>
                  ) : (
                    <div className="image-preview-area">
                      <img src={imagePreview} alt="Preview" className="image-preview" />
                      <p className="image-filename">{imageFile.name}</p>
                      <div className="image-actions">
                        <button
                          className="browse-btn"
                          onClick={() => { setImageFile(null); setImagePreview(null); }}
                        >
                          Remove
                        </button>
                        <button className="verify-btn" onClick={handleImageCheck}>
                          Check Image
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* RECENT CHECKS */}
        {recentChecks.length === 0 ? (
          <div className="landing-placeholder">
            <div className="placeholder-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </div>
            <h3>No checks yet</h3>
            <p>Your activity and recent checks will appear here once you start verifying claims.</p>
          </div>
        ) : (
          <div className="recent-checks">
            <h3 className="recent-title">Recent Checks</h3>
            <div className="checks-list">
              {recentChecks.map((check) => {
                const { label, color } = getVerdictStyle(check.verdict);
                return (
                  <div
                    key={check.id}
                    className="check-item"
                    onClick={() => navigate(`/results?q=${encodeURIComponent(check.query)}&type=${check.check_type}`)}
                  >
                    <div className="check-query">{check.query}</div>
                    <div className="check-meta">
                      <span className="check-type">{check.check_type === 'text' ? 'Text Search' : check.check_type === 'link' ? 'URL Analysis' : 'Image Analysis'}</span>
                      <span className="check-verdict" style={{ color }}>{label}</span>
                      <span className="check-date">
                        {new Date(check.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </main>
    </UserLayout>
  );
}