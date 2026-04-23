import { useState } from "react";
import ResourcesLayout from "../assets/components/ResourceLayout";
import "../styles/api-docs.css";

const endpoints = [
  {
    category: "Authentication",
    color: "#6366f1",
    items: [
      {
        method: "POST",
        path: "/api/auth/register",
        title: "Register User",
        description: "Create a new user account. Returns a JWT token on success.",
        auth: false,
        body: {
          username: "string (required)",
          email: "string (required)",
          password: "string (required, min 8 chars)"
        },
        response: {
          message: "user registered successfully",
          token: "eyJhbGciOiJIUzI1NiIs...",
          user: {
            id: 1,
            username: "johndoe",
            email: "john@example.com",
            role: "user"
          }
        },
        errors: [
          { code: 400, message: "username, email, and password are required" },
          { code: 400, message: "invalid email format" },
          { code: 400, message: "password must be at least 8 characters" },
          { code: 409, message: "username or email already exists" },
        ]
      },
      {
        method: "POST",
        path: "/api/auth/login",
        title: "Login User",
        description: "Authenticate a user and receive a JWT token.",
        auth: false,
        body: {
          email: "string (required)",
          password: "string (required)"
        },
        response: {
          message: "login successful",
          token: "eyJhbGciOiJIUzI1NiIs...",
          user: {
            id: 1,
            username: "johndoe",
            email: "john@example.com",
            role: "user"
          }
        },
        errors: [
          { code: 400, message: "email and password are required" },
          { code: 401, message: "User not found" },
          { code: 401, message: "Invalid password" },
        ]
      },
      {
        method: "POST",
        path: "/api/auth/logout",
        title: "Logout User",
        description: "Logout the currently authenticated user. Requires a valid Bearer token.",
        auth: true,
        body: null,
        response: {
          message: "logout successful"
        },
        errors: [
          { code: 401, message: "no token provided" },
          { code: 401, message: "token expired" },
        ]
      }
    ]
  },
  {
    category: "News — Guardian",
    color: "#22d3ee",
    items: [
      {
        method: "GET",
        path: "/api/news/guardian/search",
        title: "Search Articles",
        description: "Search Guardian news articles by keyword.",
        auth: false,
        params: {
          q: "string (required) — search keyword",
          page: "number (optional, default: 1)",
          pageSize: "number (optional, default: 10)",
          fromDate: "string (optional) — YYYY-MM-DD",
          toDate: "string (optional) — YYYY-MM-DD",
          section: "string (optional) — e.g. politics, science"
        },
        response: {
          success: true,
          count: 10,
          data: ["array of article objects"]
        },
        errors: [
          { code: 400, message: "query parameter (q) is required" }
        ]
      },
      {
        method: "GET",
        path: "/api/news/guardian/search-with-sentiment",
        title: "Search with Sentiment",
        description: "Search articles and include sentiment analysis for each result.",
        auth: false,
        params: {
          q: "string (required)",
          page: "number (optional)",
          pageSize: "number (optional, default: 5)"
        },
        response: {
          success: true,
          count: 5,
          data: ["articles with sentiment field added"]
        },
        errors: [
          { code: 400, message: "query parameter (q) is required" }
        ]
      },
      {
        method: "GET",
        path: "/api/news/guardian/search-with-analysis",
        title: "Search with Full Analysis",
        description: "Search articles with both sentiment analysis and fake news scoring.",
        auth: false,
        params: {
          q: "string (required)",
          page: "number (optional)",
          pageSize: "number (optional, default: 5)"
        },
        response: {
          success: true,
          count: 5,
          data: ["articles with sentiment and fakeNewsScore fields"]
        },
        errors: [
          { code: 400, message: "query parameter (q) is required" }
        ]
      },
      {
        method: "GET",
        path: "/api/news/guardian/latest/:section",
        title: "Latest by Section",
        description: "Get the latest articles from a specific Guardian section.",
        auth: false,
        params: {
          ":section": "string (required) — e.g. politics, science, technology",
          pageSize: "number (optional, default: 10)"
        },
        response: {
          success: true,
          count: 10,
          data: ["array of article objects"]
        },
        errors: []
      },
      {
        method: "GET",
        path: "/api/news/guardian/article/:id",
        title: "Get Single Article",
        description: "Fetch a single Guardian article by its ID with sentiment analysis.",
        auth: false,
        params: {
          ":id": "string (required) — Guardian article ID"
        },
        response: {
          success: true,
          data: {
            webTitle: "Article title",
            webUrl: "https://...",
            trailText: "Article excerpt",
            sentiment: "positive | neutral | negative"
          }
        },
        errors: []
      },
      {
        method: "GET",
        path: "/api/news/guardian/sections",
        title: "Get Sections",
        description: "Get all available Guardian news sections.",
        auth: false,
        params: null,
        response: {
          success: true,
          count: 50,
          data: ["array of section objects"]
        },
        errors: []
      }
    ]
  },
  {
    category: "News — RSS Feeds",
    color: "#f59e0b",
    items: [
      {
        method: "GET",
        path: "/api/news/rss/search",
        title: "Search RSS Feeds",
        description: "Search articles across free RSS sources: BBC, Reuters, AP, NPR, DW.",
        auth: false,
        params: {
          q: "string (required) — search keyword"
        },
        response: {
          success: true,
          data: ["array of RSS articles"]
        },
        errors: []
      },
      {
        method: "GET",
        path: "/api/news/rss/feeds",
        title: "Get All Feeds",
        description: "Get all available RSS feed articles.",
        auth: false,
        params: null,
        response: {
          success: true,
          data: ["array of feed articles"]
        },
        errors: []
      },
      {
        method: "GET",
        path: "/api/news/rss/sources",
        title: "Get RSS Sources",
        description: "Get list of all available RSS news sources.",
        auth: false,
        params: null,
        response: {
          success: true,
          data: ["BBC", "Reuters", "AP", "NPR", "DW"]
        },
        errors: []
      },
      {
        method: "GET",
        path: "/api/news/rss/article/:id",
        title: "Get RSS Article",
        description: "Get a single RSS article by its ID.",
        auth: false,
        params: {
          ":id": "string (required) — article ID"
        },
        response: {
          success: true,
          data: { "article object": "..." }
        },
        errors: []
      }
    ]
  },
  {
    category: "Analysis",
    color: "#a78bfa",
    items: [
      {
        method: "POST",
        path: "/api/news/analyze/fake-score",
        title: "Analyze Fake News Score",
        description: "Analyze a single article and calculate its fake news probability and risk level.",
        auth: false,
        body: {
          title: "string (required)",
          description: "string (optional)",
          bodyText: "string (optional)",
          link: "string (optional)",
          source: "string (optional)",
          byline: "string (optional)"
        },
        response: {
          success: true,
          data: {
            riskLevel: "LOW | MODERATE | HIGH | VERY_HIGH",
            fakeNewsProbability: 0.15,
            credibilityScore: 85,
            flags: []
          }
        },
        errors: [
          { code: 400, message: "article title is required" }
        ]
      },
      {
        method: "POST",
        path: "/api/news/analyze/compare",
        title: "Compare Articles",
        description: "Compare multiple articles against each other for cross-verification.",
        auth: false,
        body: {
          articles: "array of article objects (required)"
        },
        response: {
          success: true,
          data: {
            overallVerdict: "verified | mixed | disputed",
            consistency: 0.78,
            articles: ["analyzed articles with scores"]
          }
        },
        errors: [
          { code: 400, message: "articles array is required" }
        ]
      },
      {
        method: "POST",
        path: "/api/news/analyze/batch",
        title: "Batch Analyze",
        description: "Analyze multiple articles individually in a single request.",
        auth: false,
        body: {
          articles: "array of article objects (required)"
        },
        response: {
          success: true,
          count: 5,
          data: ["array of individual analysis results"]
        },
        errors: [
          { code: 400, message: "articles array is required" }
        ]
      }
    ]
  },
  {
    category: "Checks",
    color: "#22c55e",
    items: [
      {
        method: "POST",
        path: "/api/checks",
        title: "Save Check",
        description: "Save a user's fact-check query to the database. Requires authentication.",
        auth: true,
        body: {
          query: "string (required) — the search term or URL",
          verdict: "string (optional) — verified | mixed | disputed (default: mixed)",
          check_type: "string (optional) — text | link | image (default: text)"
        },
        response: {
          success: true
        },
        errors: [
          { code: 401, message: "no token provided" }
        ]
      },
      {
        method: "GET",
        path: "/api/checks",
        title: "Get Recent Checks",
        description: "Get the 10 most recent checks for the authenticated user.",
        auth: true,
        params: null,
        response: {
          success: true,
          data: [
            {
              id: 1,
              user_id: 1,
              query: "climate change 2024",
              verdict: "verified",
              check_type: "text",
              created_at: "2026-04-21T10:00:00.000Z"
            }
          ]
        },
        errors: [
          { code: 401, message: "no token provided" }
        ]
      },
      {
        method: "POST",
        path: "/api/checks/update-verdict",
        title: "Update Verdict",
        description: "Update the verdict of the most recent check matching the query.",
        auth: true,
        body: {
          query: "string (required)",
          verdict: "string (required) — verified | mixed | disputed"
        },
        response: {
          success: true
        },
        errors: [
          { code: 401, message: "no token provided" }
        ]
      }
    ]
  }
];

const methodColors = {
  GET: { bg: "rgba(34,197,94,0.1)", color: "#22c55e", border: "rgba(34,197,94,0.2)" },
  POST: { bg: "rgba(99,102,241,0.1)", color: "#818cf8", border: "rgba(99,102,241,0.2)" },
  PUT: { bg: "rgba(245,158,11,0.1)", color: "#fbbf24", border: "rgba(245,158,11,0.2)" },
  DELETE: { bg: "rgba(239,68,68,0.1)", color: "#f87171", border: "rgba(239,68,68,0.2)" },
};

export default function ApiDocsPage() {
  const [openEndpoint, setOpenEndpoint] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);

  const toggle = (key) => setOpenEndpoint(openEndpoint === key ? null : key);

  const filteredEndpoints = activeCategory
    ? endpoints.filter(e => e.category === activeCategory)
    : endpoints;

  return (
    <ResourcesLayout>
      <div className="api-docs">

        {/* HERO */}
        <div className="api-hero">
          <h1 className="api-title">API Documentation</h1>
          <p className="api-subtitle">
            Complete reference for the VeriFake REST API. Base URL:
            <code className="api-base-url">{import.meta.env.VITE_API_BASE || 'http://localhost:3006'}</code>
          </p>
          <div className="api-auth-note">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
            Endpoints marked with <span className="auth-badge">Auth Required</span> need a Bearer token in the Authorization header:
            <code className="inline-code">Authorization: Bearer &lt;token&gt;</code>
          </div>

          <div className="api-tester-banner">
            <div className="api-tester-left">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
              <div>
                <p className="api-tester-title">Want to try the API interactively?</p>
                <p className="api-tester-desc">Use our built-in API Tester to send real requests and see live responses without writing any code.</p>
              </div>
            </div>
            <a href="/api-tester" className="api-tester-btn">
              Open API Tester
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </a>
          </div>
        </div>

        <div className="api-layout">

          {/* SIDEBAR NAV */}
          <aside className="api-sidebar">
            <p className="api-sidebar-title">Categories</p>
            <button
              className={`api-sidebar-item ${!activeCategory ? 'active' : ''}`}
              onClick={() => setActiveCategory(null)}
            >
              All Endpoints
            </button>
            {endpoints.map(e => (
              <button
                key={e.category}
                className={`api-sidebar-item ${activeCategory === e.category ? 'active' : ''}`}
                onClick={() => setActiveCategory(e.category)}
                style={activeCategory === e.category ? { color: e.color, borderColor: e.color } : {}}
              >
                {e.category}
              </button>
            ))}
          </aside>

          {/* ENDPOINTS */}
          <div className="api-content">
            {filteredEndpoints.map(group => (
              <div key={group.category} className="api-group">
                <div className="api-group-header">
                  <div className="api-group-dot" style={{ background: group.color }} />
                  <h2 className="api-group-title">{group.category}</h2>
                </div>

                {group.items.map((ep, idx) => {
                  const key = `${group.category}-${idx}`;
                  const isOpen = openEndpoint === key;
                  const mc = methodColors[ep.method] || methodColors.GET;

                  return (
                    <div key={key} className={`api-endpoint ${isOpen ? 'open' : ''}`}>
                      <div className="api-endpoint-header" onClick={() => toggle(key)}>
                        <span className="api-method" style={{ background: mc.bg, color: mc.color, border: `1px solid ${mc.border}` }}>
                          {ep.method}
                        </span>
                        <code className="api-path">{ep.path}</code>
                        <span className="api-ep-title">{ep.title}</span>
                        {ep.auth && <span className="auth-badge">Auth Required</span>}
                        <svg
                          className="api-chevron"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </div>

                      {isOpen && (
                        <div className="api-endpoint-body">
                          <p className="api-desc">{ep.description}</p>

                          {ep.params && (
                            <div className="api-section">
                              <h4>Query Parameters</h4>
                              <div className="api-table">
                                {Object.entries(ep.params).map(([k, v]) => (
                                  <div key={k} className="api-table-row">
                                    <code className="api-param-name">{k}</code>
                                    <span className="api-param-desc">{v}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {ep.body && (
                            <div className="api-section">
                              <h4>Request Body</h4>
                              <div className="api-table">
                                {Object.entries(ep.body).map(([k, v]) => (
                                  <div key={k} className="api-table-row">
                                    <code className="api-param-name">{k}</code>
                                    <span className="api-param-desc">{v}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="api-section">
                            <h4>Response</h4>
                            <pre className="api-code">{JSON.stringify(ep.response, null, 2)}</pre>
                          </div>

                          {ep.errors && ep.errors.length > 0 && (
                            <div className="api-section">
                              <h4>Error Responses</h4>
                              <div className="api-table">
                                {ep.errors.map((e, i) => (
                                  <div key={i} className="api-table-row">
                                    <code className="api-param-name error-code">{e.code}</code>
                                    <span className="api-param-desc">{e.message}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </ResourcesLayout>
  );
}
