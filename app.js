// GasRush — Core App Module
// Single entry point: handles auth, routing, sidebar, theme

const GasRush = (() => {
    const SUPABASE_URL = 'https://ojqoxdsibiutpfhtvyyo.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qcW94ZHNpYml1dHBmaHR2eXlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkzMDgzODEsImV4cCI6MjA4NDg4NDM4MX0.GgpdgFyJBVtkAKmp2ZJIoEd5xO5EwA2itnfST-ig1ck';

    let _supabase = null;
    let _user = null;
    let _flags = {};
    let _ready = false;

    // ── Supabase ──
    function db() {
        if (!_supabase) {
            _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        }
        return _supabase;
    }

    // ── Auth ──
    function getUser() {
        if (_user) return _user;
        const raw = localStorage.getItem('gr_user');
        if (raw) {
            try { _user = JSON.parse(raw); } catch(e) { _user = null; }
        }
        return _user;
    }

    function setUser(user) {
        _user = user;
        localStorage.setItem('gr_user', JSON.stringify(user));
        localStorage.setItem('gr_token', user.token || 'demo');
    }

    function logout() {
        _user = null;
        localStorage.removeItem('gr_user');
        localStorage.removeItem('gr_token');
        window.location.href = 'login.html';
    }

    function requireAuth(allowedRoles) {
        const user = getUser();
        if (!user) { window.location.href = 'login.html'; return null; }
        if (allowedRoles && !allowedRoles.includes(user.role)) {
            window.location.href = getDashboardForRole(user.role);
            return null;
        }
        return user;
    }

    function getDashboardForRole(role) {
        const map = {
            admin: 'admin-dashboard.html',
            rental: 'rental-dashboard.html',
            vendor: 'vendor-dashboard.html',
            fieldworker: 'field-worker.html'
        };
        return map[role] || 'login.html';
    }

    // ── Demo Login ──
    const DEMO_USERS = {
        rental: { id: 'demo-rental', name: 'Rental User', email: 'rental@demo.com', role: 'rental', company: 'GasRush Demo', token: 'demo-rental-token' },
        vendor: { id: 'demo-vendor', name: 'Vendor User', email: 'vendor@demo.com', role: 'vendor', vendor_id: 'demo-vendor-id', company: 'Demo Fuel Co', token: 'demo-vendor-token' },
        fieldworker: { id: 'demo-fw', name: 'John Driver', email: 'driver@demo.com', role: 'fieldworker', vendor_id: 'demo-vendor-id', company: 'Demo Fuel Co', token: 'demo-fw-token' },
        admin: { id: 'demo-admin', name: 'Admin User', email: 'admin@demo.com', role: 'admin', company: 'GasRush', token: 'demo-admin-token' }
    };

    function demoLogin(role) {
        const user = DEMO_USERS[role];
        if (!user) return;
        setUser(user);
        window.location.href = getDashboardForRole(role);
    }

    // ── Feature Flags ──
    async function loadFlags() {
        const user = getUser();
        if (!user) return;
        try {
            const { data } = await db().from('feature_flags').select('*').eq('role', user.role);
            if (data) {
                data.forEach(f => { _flags[f.feature_key] = f.enabled; });
            }
        } catch(e) {
            console.warn('Feature flags unavailable:', e.message);
        }
    }

    function flagEnabled(key) {
        // If flag doesn't exist, default to enabled
        return _flags[key] !== false;
    }

    // ── Theme ──
    function initTheme() {
        const saved = localStorage.getItem('gr_theme') || 'light';
        document.documentElement.setAttribute('data-theme', saved);
    }

    function toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('gr_theme', next);
        // Update toggle button text
        const btn = document.getElementById('themeToggle');
        if (btn) btn.textContent = next === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';
    }

    // ── Sidebar ──
    const NAV_CONFIG = {
        rental: {
            main: [
                { label: 'Dashboard', icon: '📊', href: 'rental-dashboard.html' },
                { label: 'Create Work Order', icon: '➕', href: 'create-job.html', flag: 'page.create_job' },
                { label: 'Job Sites', icon: '📍', href: 'job-sites.html', flag: 'page.job_sites' }
            ],
            management: [
                { label: 'Invoices', icon: '📄', href: 'invoices.html', flag: 'page.invoices' },
                { label: 'Contracts', icon: '📝', href: 'contracts.html', flag: 'page.contracts' },
                { label: 'Equipment', icon: '⚙️', href: 'equipment.html', flag: 'page.equipment' },
                { label: 'Vendor Comparison', icon: '📊', href: 'vendor-comparison.html', flag: 'page.vendor_comparison' },
                { label: 'Recurring Jobs', icon: '🔁', href: 'recurring-jobs.html', flag: 'page.recurring_jobs' }
            ],
            tools: [
                { label: 'Reports', icon: '📈', href: 'reports.html', flag: 'page.reports' },
                { label: 'Daily Log', icon: '📒', href: 'daily-log.html', flag: 'page.daily_log' },
                { label: 'Documents', icon: '📁', href: 'documents.html', flag: 'page.documents' },
                { label: 'Bulk Import', icon: '📥', href: 'bulk-import.html', flag: 'page.bulk_import' }
            ],
            settings: [
                { label: 'Alerts', icon: '🔔', href: 'alerts.html', flag: 'page.alerts' },
                { label: 'Settings', icon: '⚙️', href: 'settings.html' }
            ]
        },
        vendor: {
            main: [
                { label: 'Dashboard', icon: '📊', href: 'vendor-dashboard.html' },
                { label: 'Job Sites', icon: '📍', href: 'job-sites.html', flag: 'page.job_sites' }
            ],
            management: [
                { label: 'Invoices', icon: '📄', href: 'invoices.html', flag: 'page.invoices' },
                { label: 'Contracts', icon: '📝', href: 'contracts.html', flag: 'page.contracts' },
                { label: 'Equipment', icon: '⚙️', href: 'equipment.html', flag: 'page.equipment' }
            ],
            team: [
                { label: 'Field Workers', icon: '👷', href: 'field-workers.html', flag: 'page.field_workers' },
                { label: 'Chat', icon: '💬', href: 'chat.html', flag: 'page.chat' }
            ],
            tools: [
                { label: 'Reports', icon: '📈', href: 'reports.html', flag: 'page.reports' },
                { label: 'Daily Log', icon: '📒', href: 'daily-log.html', flag: 'page.daily_log' },
                { label: 'Route Planning', icon: '🗺️', href: 'routes.html', flag: 'page.routes' },
                { label: 'Documents', icon: '📁', href: 'documents.html', flag: 'page.documents' }
            ],
            settings: [
                { label: 'Alerts', icon: '🔔', href: 'alerts.html', flag: 'page.alerts' },
                { label: 'Settings', icon: '⚙️', href: 'settings.html' }
            ]
        },
        fieldworker: {
            main: [
                { label: 'Dashboard', icon: '📊', href: 'field-worker.html' },
                { label: 'Job Sites', icon: '📍', href: 'job-sites.html', flag: 'page.job_sites' }
            ],
            tools: [
                { label: 'Daily Log', icon: '📒', href: 'daily-log.html', flag: 'page.daily_log' },
                { label: 'Time Tracking', icon: '⏱️', href: 'time-tracking.html', flag: 'page.time_tracking' },
                { label: 'Chat', icon: '💬', href: 'chat.html', flag: 'page.chat' }
            ],
            settings: [
                { label: 'Settings', icon: '⚙️', href: 'settings.html' }
            ]
        },
        admin: {
            main: [
                { label: 'Dashboard', icon: '📊', href: 'admin-dashboard.html' },
                { label: 'Create Work Order', icon: '➕', href: 'create-job.html' },
                { label: 'Job Sites', icon: '📍', href: 'job-sites.html' }
            ],
            management: [
                { label: 'Invoices', icon: '📄', href: 'invoices.html' },
                { label: 'Contracts', icon: '📝', href: 'contracts.html' },
                { label: 'Equipment', icon: '⚙️', href: 'equipment.html' },
                { label: 'Companies', icon: '🏢', href: 'companies.html' },
                { label: 'Users', icon: '👥', href: 'users.html' },
                { label: 'Field Workers', icon: '👷', href: 'field-workers.html' }
            ],
            tools: [
                { label: 'Reports', icon: '📈', href: 'reports.html' },
                { label: 'Daily Log', icon: '📒', href: 'daily-log.html' },
                { label: 'Documents', icon: '📁', href: 'documents.html' },
                { label: 'Routes', icon: '🗺️', href: 'routes.html' },
                { label: 'Recurring Jobs', icon: '🔁', href: 'recurring-jobs.html' },
                { label: 'Bulk Import', icon: '📥', href: 'bulk-import.html' },
                { label: 'Data Export', icon: '📤', href: 'data-export.html' },
                { label: 'Chat', icon: '💬', href: 'chat.html' }
            ],
            admin: [
                { label: 'Feature Flags', icon: '🚩', href: 'feature-flags.html' },
                { label: 'System Health', icon: '💚', href: 'system-health.html' }
            ],
            settings: [
                { label: 'Alerts', icon: '🔔', href: 'alerts.html' },
                { label: 'Settings', icon: '⚙️', href: 'settings.html' }
            ]
        }
    };

    function renderSidebar() {
        const user = getUser();
        if (!user) return;

        const nav = document.getElementById('sidebarNav');
        if (!nav) return;

        const config = NAV_CONFIG[user.role];
        if (!config) return;

        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        let html = '';

        const sectionLabels = {
            main: 'MAIN',
            management: 'MANAGEMENT',
            team: 'TEAM',
            tools: 'TOOLS',
            admin: 'ADMIN',
            settings: 'SETTINGS'
        };

        for (const [section, items] of Object.entries(config)) {
            const visibleItems = items.filter(item => !item.flag || flagEnabled(item.flag));
            if (visibleItems.length === 0) continue;

            html += `<div class="nav-section"><span class="nav-label">${sectionLabels[section] || section.toUpperCase()}</span>`;
            for (const item of visibleItems) {
                const active = item.href === currentPage ? ' active' : '';
                html += `<a href="${item.href}" class="nav-link${active}"><span class="nav-icon">${item.icon}</span>${item.label}</a>`;
            }
            html += '</div>';
        }

        nav.innerHTML = html;

        // User info + theme toggle in footer
        const footer = document.getElementById('sidebarFooter');
        if (footer) {
            const theme = localStorage.getItem('gr_theme') || 'light';
            footer.innerHTML = `
                <div class="sidebar-user">
                    <div class="user-name">${user.name}</div>
                    <div class="user-role">${user.role.charAt(0).toUpperCase() + user.role.slice(1)} Account</div>
                </div>
                <button class="btn-logout" onclick="GasRush.logout()">Logout</button>
                <button id="themeToggle" class="btn-theme" onclick="GasRush.toggleTheme()">${theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}</button>
            `;
        }
    }

    // ── Init ──
    async function init(opts = {}) {
        initTheme();
        const user = requireAuth(opts.roles);
        if (!user) return null;
        await loadFlags();
        renderSidebar();
        _ready = true;
        return user;
    }

    return {
        db, getUser, setUser, logout, requireAuth, demoLogin,
        flagEnabled, toggleTheme, init, renderSidebar, NAV_CONFIG,
        get ready() { return _ready; }
    };
})();
