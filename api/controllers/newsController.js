/* CONTROLLERS/NEWSCONTROLLER.JS - NEWS API HTTP HANDLERS */

import * as guardianService from '../services/guardianService.js';
import { analyzeSentiment } from '../services/sentimentService.js';
import { calculateFakeNewsProbability } from '../services/fakeNewsScoringService.js';
import Activity from '../models/Activity.js';

// Helper function to safely log activities (prevons NULL errors)
async function safeLogActivity(activityData) {
    try {
        // Ensure query_text is never null for search/fact_check activities
        if ((activityData.activityType === 'search' || activityData.activityType === 'fact_check' || activityData.activityType === 'sentiment_analysis') && !activityData.queryText) {
            activityData.queryText = 'unknown_query';
        }
        
        // Ensure article_title is never null for article_view
        if (activityData.activityType === 'article_view' && !activityData.articleTitle) {
            activityData.articleTitle = 'unknown_article';
        }
        
        await Activity.log(activityData);
    } catch (err) {
        // Log error but don't fail the main request
        console.error('Failed to log activity:', err.message);
    }
}

// GET /api/news/guardian/search?q=keyword - Search Guardian articles
export async function searchGuardian(req, res) {
    const startTime = Date.now();
    
    try {
        const { q, page, pageSize, fromDate, toDate, section } = req.query;

        if (!q) {
            return res.status(400).json({ error: 'query parameter (q) is required' });
        }

        const articles = await guardianService.searchArticles(q, {
            page: page ? parseInt(page) : 1,
            pageSize: pageSize ? parseInt(pageSize) : 10,
            fromDate,
            toDate,
            section
        });

        // Log search activity safely
        if (req.user && req.session) {
            await safeLogActivity({
                userId: req.user.id,
                sessionId: req.session.id,
                activityType: 'search',
                queryText: q,
                responseTimeMs: Date.now() - startTime,
                metadata: {
                    page: page || 1,
                    pageSize: pageSize || 10,
                    resultCount: articles.length,
                    fromDate: fromDate || null,
                    toDate: toDate || null,
                    section: section || null
                }
            });
        }

        res.json({
            success: true,
            count: articles.length,
            data: articles
        });

    } catch (err) {
        console.error('Guardian search error:', err.message);
        res.status(500).json({ error: 'failed to search articles' });
    }
}

// GET /api/news/guardian/latest/:section - Get latest articles by section
export async function getLatestBySection(req, res) {
    const startTime = Date.now();
    
    try {
        const { section } = req.params;
        const { pageSize } = req.query;

        const articles = await guardianService.getLatestBySection(
            section,
            pageSize ? parseInt(pageSize) : 10
        );

        // Log activity safely
        if (req.user && req.session) {
            await safeLogActivity({
                userId: req.user.id,
                sessionId: req.session.id,
                activityType: 'search',
                queryText: `latest:${section}`,
                responseTimeMs: Date.now() - startTime,
                metadata: {
                    section,
                    pageSize: pageSize || 10,
                    resultCount: articles.length
                }
            });
        }

        res.json({
            success: true,
            count: articles.length,
            data: articles
        });

    } catch (err) {
        console.error('Guardian latest error:', err.message);
        res.status(500).json({ error: 'failed to fetch latest articles' });
    }
}

// GET /api/news/guardian/article/:id - Get single article with sentiment
export async function getArticleWithSentiment(req, res) {
    const startTime = Date.now();
    
    try {
        const { id } = req.params;

        const article = await guardianService.getArticleById(id);

        // Analyze sentiment of the article body
        const sentiment = analyzeSentiment(article.bodyText || article.trailText);

        // Log article view activity safely
        if (req.user && req.session) {
            await safeLogActivity({
                userId: req.user.id,
                sessionId: req.session.id,
                activityType: 'article_view',
                articleTitle: article.webTitle || 'Unknown Article',
                articleUrl: article.webUrl,
                sourceName: article.sectionName || 'The Guardian',
                sentimentScore: sentiment.score,
                responseTimeMs: Date.now() - startTime,
                metadata: {
                    articleId: id,
                    sentimentLabel: sentiment.label,
                    sectionName: article.sectionName
                }
            });
        }

        res.json({
            success: true,
            data: {
                ...article,
                sentiment
            }
        });

    } catch (err) {
        console.error('Guardian article error:', err.message);
        res.status(500).json({ error: 'failed to fetch article' });
    }
}

// GET /api/news/guardian/sections - Get available sections
export async function getSections(req, res) {
    try {
        const sections = await guardianService.getSections();

        // Log sections fetch safely (with placeholder query_text)
        if (req.user && req.session) {
            await safeLogActivity({
                userId: req.user.id,
                sessionId: req.session.id,
                activityType: 'search',
                queryText: 'fetch_sections',
                metadata: {
                    action: 'fetch_sections',
                    sectionsCount: sections.length
                }
            });
        }

        res.json({
            success: true,
            count: sections.length,
            data: sections
        });

    } catch (err) {
        console.error('Guardian sections error:', err.message);
        res.status(500).json({ error: 'failed to fetch sections' });
    }
}

// GET /api/news/guardian/search-with-sentiment?q=keyword - Search with sentiment analysis
export async function searchWithSentiment(req, res) {
    const startTime = Date.now();
    
    try {
        const { q, page, pageSize } = req.query;

        if (!q) {
            return res.status(400).json({ error: 'query parameter (q) is required' });
        }

        const articles = await guardianService.searchArticles(q, {
            page: page ? parseInt(page) : 1,
            pageSize: pageSize ? parseInt(pageSize) : 5 // Limit for performance
        });

        // Add sentiment analysis to each article
        const articlesWithSentiment = articles.map(article => ({
            ...article,
            sentiment: analyzeSentiment(article.bodyText || article.trailText)
        }));

        // Calculate aggregate sentiment
        const sentimentScores = articlesWithSentiment.map(a => a.sentiment.score);
        const avgSentiment = sentimentScores.reduce((a, b) => a + b, 0) / sentimentScores.length;

        // Log search with sentiment activity safely
        if (req.user && req.session) {
            await safeLogActivity({
                userId: req.user.id,
                sessionId: req.session.id,
                activityType: 'sentiment_analysis',
                queryText: q,
                sentimentScore: avgSentiment,
                responseTimeMs: Date.now() - startTime,
                metadata: {
                    page: page || 1,
                    pageSize: pageSize || 5,
                    resultCount: articles.length,
                    positiveCount: articlesWithSentiment.filter(a => a.sentiment.label === 'positive').length,
                    negativeCount: articlesWithSentiment.filter(a => a.sentiment.label === 'negative').length,
                    neutralCount: articlesWithSentiment.filter(a => a.sentiment.label === 'neutral').length
                }
            });
        }

        res.json({
            success: true,
            count: articlesWithSentiment.length,
            data: articlesWithSentiment
        });

    } catch (err) {
        console.error('Guardian search with sentiment error:', err.message);
        res.status(500).json({ error: 'failed to search and analyze articles' });
    }
}

// GET /api/news/guardian/search-with-analysis?q=keyword - Search with sentiment AND fake news scoring
export async function searchWithAnalysis(req, res) {
    const startTime = Date.now();
    
    try {
        const { q, page, pageSize } = req.query;

        if (!q) {
            return res.status(400).json({ error: 'query parameter (q) is required' });
        }

        const articles = await guardianService.searchArticles(q, {
            page: page ? parseInt(page) : 1,
            pageSize: pageSize ? parseInt(pageSize) : 5
        });

        // Add both sentiment and fake news scoring
        const articlesWithAnalysis = articles.map(article => {
            const fakeNewsScore = calculateFakeNewsProbability({
                title: article.webTitle,
                description: article.trailText,
                bodyText: article.bodyText,
                link: article.webUrl,
                source: 'The Guardian',
                byline: article.byline
            });
            
            const sentiment = analyzeSentiment(article.bodyText || article.trailText);
            
            return {
                ...article,
                sentiment,
                fakeNewsScore
            };
        });

        // Calculate overall verdict based on fake news scores
        const avgFakeScore = articlesWithAnalysis.reduce((sum, a) => 
            sum + (a.fakeNewsScore?.fakeProbability || 50), 0) / articlesWithAnalysis.length;
        
        let verdict = 'mixed';
        if (avgFakeScore <= 20) verdict = 'verified';
        else if (avgFakeScore >= 60) verdict = 'disputed';

        // Log comprehensive analysis activity safely
        if (req.user && req.session) {
            await safeLogActivity({
                userId: req.user.id,
                sessionId: req.session.id,
                activityType: 'fact_check',
                queryText: q,
                verdict: verdict,
                fakeNewsScore: Math.round(avgFakeScore),
                responseTimeMs: Date.now() - startTime,
                sourcesChecked: articlesWithAnalysis.length,
                metadata: {
                    page: page || 1,
                    pageSize: pageSize || 5,
                    resultCount: articles.length,
                    avgFakeScore: Math.round(avgFakeScore),
                    highRiskCount: articlesWithAnalysis.filter(a => a.fakeNewsScore?.riskLevel === 'HIGH' || a.fakeNewsScore?.riskLevel === 'VERY_HIGH').length,
                    lowRiskCount: articlesWithAnalysis.filter(a => a.fakeNewsScore?.riskLevel === 'LOW').length,
                    sentimentSummary: {
                        positive: articlesWithAnalysis.filter(a => a.sentiment.label === 'positive').length,
                        negative: articlesWithAnalysis.filter(a => a.sentiment.label === 'negative').length,
                        neutral: articlesWithAnalysis.filter(a => a.sentiment.label === 'neutral').length
                    }
                }
            });
        }

        res.json({
            success: true,
            count: articlesWithAnalysis.length,
            data: articlesWithAnalysis
        });

    } catch (err) {
        console.error('Guardian search with analysis error:', err.message);
        res.status(500).json({ error: 'failed to search and analyze articles' });
    }
}