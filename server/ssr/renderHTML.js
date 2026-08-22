/**
 * Server-Side Rendering (SSR) HTML Template Renderer
 *
 * This module generates fully pre-rendered HTML pages on the server
 * with injected data, proper SEO meta tags, and Open Graph tags.
 * 
 * The rendered HTML is immediately meaningful to search engine crawlers
 * and displays content before any JavaScript executes on the client.
 *
 * Pattern: Server renders HTML shell with initial data injected as
 * window.__INITIAL_STATE__ for client-side hydration.
 */

const APP_NAME = 'Alex — Animal Rescue Platform';
const APP_URL = process.env.CLIENT_URL || 'http://localhost:5000';

/**
 * Render the base HTML shell with shared head tags.
 * @param {Object} options
 * @param {string} options.title - Page title
 * @param {string} options.description - Meta description
 * @param {string} options.content - Main HTML body content
 * @param {Object} options.initialState - Data injected into window.__INITIAL_STATE__
 * @param {string} options.canonicalUrl - Canonical URL for SEO
 */
const renderPage = ({ title, description, content, initialState = {}, canonicalUrl = '' }) => {
    const safeState = JSON.stringify(initialState).replace(/<\/script>/gi, '<\\/script>');

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    <!-- SEO Meta Tags -->
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <meta name="robots" content="index, follow" />
    ${canonicalUrl ? `<link rel="canonical" href="${escapeHtml(canonicalUrl)}" />` : ''}

    <!-- Open Graph / Social Media -->
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:site_name" content="${APP_NAME}" />
    ${canonicalUrl ? `<meta property="og:url" content="${escapeHtml(canonicalUrl)}" />` : ''}

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />

    <!-- Inline Critical CSS -->
    <style>
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f0f1a; color: #e2e8f0; line-height: 1.6; }
        .ssr-container { max-width: 1100px; margin: 0 auto; padding: 2rem 1.5rem; }
        .ssr-header { background: linear-gradient(135deg, #1e3a5f, #2d6a4f); padding: 3rem 2rem; text-align: center; border-radius: 1rem; margin-bottom: 2rem; }
        .ssr-header h1 { font-size: 2.5rem; font-weight: 800; color: #fff; margin-bottom: 0.5rem; }
        .ssr-header p { color: #a8d5ba; font-size: 1.1rem; }
        .ssr-badge { display: inline-block; background: rgba(255,255,255,0.15); color: #fff; font-size: 0.75rem; padding: 0.25rem 0.75rem; border-radius: 99px; margin-top: 1rem; letter-spacing: 0.05em; text-transform: uppercase; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
        .stat-card { background: #1a1a2e; border: 1px solid #2d2d44; border-radius: 0.75rem; padding: 1.5rem; text-align: center; }
        .stat-card .number { font-size: 2.5rem; font-weight: 700; color: #4ade80; }
        .stat-card .label { color: #94a3b8; font-size: 0.875rem; margin-top: 0.25rem; }
        .report-list { list-style: none; }
        .report-item { background: #1a1a2e; border: 1px solid #2d2d44; border-radius: 0.75rem; padding: 1.25rem 1.5rem; margin-bottom: 0.75rem; display: flex; justify-content: space-between; align-items: center; }
        .report-item .animal { font-weight: 600; color: #e2e8f0; }
        .report-item .meta { color: #64748b; font-size: 0.875rem; margin-top: 0.25rem; }
        .severity-badge { padding: 0.25rem 0.75rem; border-radius: 99px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; }
        .severity-CRITICAL { background: #7f1d1d; color: #fca5a5; }
        .severity-HIGH { background: #7c2d12; color: #fdba74; }
        .severity-MEDIUM { background: #713f12; color: #fde68a; }
        .severity-LOW { background: #14532d; color: #86efac; }
        .status-badge { padding: 0.2rem 0.6rem; border-radius: 99px; font-size: 0.7rem; font-weight: 600; background: #1e3a5f; color: #93c5fd; }
        .ssr-note { background: #0f2027; border: 1px solid #1e3a5f; border-radius: 0.5rem; padding: 1rem 1.5rem; margin-top: 2rem; font-size: 0.8rem; color: #64748b; }
        .ssr-note strong { color: #4ade80; }
        h2 { font-size: 1.25rem; color: #e2e8f0; margin-bottom: 1rem; font-weight: 700; }
        .empty-state { text-align: center; padding: 3rem; color: #64748b; }
        nav { display: flex; gap: 1rem; justify-content: center; margin-bottom: 2rem; }
        nav a { color: #4ade80; text-decoration: none; font-size: 0.9rem; padding: 0.5rem 1rem; border: 1px solid #2d6a4f; border-radius: 0.5rem; transition: background 0.2s; }
        nav a:hover { background: #14532d; }
    </style>

    <!-- Injected Server Data (for client-side hydration) -->
    <script>
        window.__INITIAL_STATE__ = ${safeState};
        window.__SSR__ = true;
    </script>
</head>
<body>
    <div id="ssr-root">
        ${content}
    </div>
    <script>
        // Client-side hydration note: In a full SSR setup, React would
        // hydrate this server-rendered HTML using ReactDOM.hydrateRoot()
        console.log('[SSR] Page pre-rendered on server. Initial state:', window.__INITIAL_STATE__);
    </script>
</body>
</html>`;
};

/**
 * Render the SSR Landing Page (/)
 */
const renderLanding = ({ totalReports, totalRescuers, completedRescues, recentReports }) => {
    const content = `
        <div class="ssr-container">
            <nav>
                <a href="/ssr">🏠 Home</a>
                <a href="/ssr/reports">📋 Reports</a>
                <a href="/">🚀 Launch App</a>
            </nav>

            <header class="ssr-header">
                <h1>🐾 ${escapeHtml(APP_NAME)}</h1>
                <p>Connecting citizens with rescuers to save animals in need</p>
                <span class="ssr-badge">⚡ Server-Side Rendered</span>
            </header>

            <div class="stats-grid">
                <div class="stat-card">
                    <div class="number">${totalReports}</div>
                    <div class="label">Total Reports Filed</div>
                </div>
                <div class="stat-card">
                    <div class="number">${completedRescues}</div>
                    <div class="label">Rescues Completed</div>
                </div>
                <div class="stat-card">
                    <div class="number">${totalRescuers}</div>
                    <div class="label">Active Rescuers</div>
                </div>
            </div>

            <h2>Recent Rescue Reports</h2>
            ${renderReportList(recentReports)}

            <div class="ssr-note">
                <strong>SSR Note:</strong> This page was rendered entirely on the server at
                <em>${new Date().toISOString()}</em>. The HTML you see was generated by Express
                with live database data injected before reaching your browser — no JavaScript
                needed for the initial render. This improves SEO and time-to-first-paint.
            </div>
        </div>
    `;

    return renderPage({
        title: `${APP_NAME} — Animal Rescue Platform`,
        description: 'Connect with nearby rescuers to save injured animals. Report animal emergencies and get help fast.',
        content,
        canonicalUrl: `${APP_URL}/ssr`,
        initialState: { totalReports, totalRescuers, completedRescues, recentReports }
    });
};

/**
 * Render the SSR Reports List Page
 */
const renderReportsPage = ({ reports, filters, total }) => {
    const content = `
        <div class="ssr-container">
            <nav>
                <a href="/ssr">🏠 Home</a>
                <a href="/ssr/reports">📋 Reports</a>
                <a href="/">🚀 Launch App</a>
            </nav>

            <header class="ssr-header">
                <h1>📋 Rescue Reports</h1>
                <p>${total} report${total !== 1 ? 's' : ''} found${filters.status ? ` — Status: ${filters.status}` : ''}</p>
                <span class="ssr-badge">⚡ Server-Side Rendered</span>
            </header>

            <h2>All Reports</h2>
            ${renderReportList(reports)}

            <div class="ssr-note">
                <strong>SSR Note:</strong> These ${reports.length} records were fetched from MongoDB
                and rendered as HTML on the server at <em>${new Date().toISOString()}</em>.
                Search engines can index this content without executing JavaScript.
            </div>
        </div>
    `;

    return renderPage({
        title: `Rescue Reports — ${APP_NAME}`,
        description: `Browse all ${total} animal rescue reports. Filter by status, severity, and animal type.`,
        content,
        canonicalUrl: `${APP_URL}/ssr/reports`,
        initialState: { reports, filters, total }
    });
};

/**
 * Render a list of report items as HTML.
 */
const renderReportList = (reports = []) => {
    if (!reports.length) {
        return `<div class="empty-state">🐾 No reports found.</div>`;
    }

    const items = reports.map(report => `
        <li class="report-item">
            <div>
                <div class="animal">🐾 ${escapeHtml(report.animalType || 'Unknown')}</div>
                <div class="meta">${escapeHtml((report.description || '').slice(0, 80))}${report.description?.length > 80 ? '…' : ''}</div>
                <div class="meta">📅 ${new Date(report.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
            </div>
            <div style="display:flex;gap:0.5rem;flex-direction:column;align-items:flex-end">
                <span class="severity-badge severity-${escapeHtml(report.severity || 'LOW')}">${escapeHtml(report.severity || 'LOW')}</span>
                <span class="status-badge">${escapeHtml(report.status || 'PENDING')}</span>
            </div>
        </li>
    `).join('');

    return `<ul class="report-list">${items}</ul>`;
};

/**
 * Simple HTML escaping to prevent XSS in server-rendered content.
 */
const escapeHtml = (str) => {
    if (str == null) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
};

module.exports = { renderLanding, renderReportsPage };
