/**
 * DASHBOARD.JS — v3.0 Real-Time Edition
 * Animated counters, auto-refresh every 30s, live data from API.
 */

let refreshTimer = null;
let countdownTimer = null;
let refreshCountdown = 30;

document.addEventListener('DOMContentLoaded', async () => {
    const session = Utils.getStorage('fc_session');
    if (!session || !session.isLoggedIn) {
        window.location.href = 'login.html';
        return;
    }

    const user = session.user;

    // ── Greeting ──
    const nameEl   = document.getElementById('heroUserName');
    const dateEl   = document.getElementById('heroDate');
    const now      = new Date();
    const hour     = now.getHours();
    const greeting = hour < 12 ? '🌅 Good Morning' : hour < 17 ? '☀️ Good Afternoon' : '🌙 Good Evening';
    if (nameEl) nameEl.textContent = user.name?.split(' ')[0] || 'there';
    if (dateEl) dateEl.textContent = `${greeting} — ${now.toLocaleDateString('en-IN', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    })}`;

    // ── Profile card ──
    const avatarEl = document.getElementById('profileAvatar');
    const nameP    = document.getElementById('profileName');
    const emailP   = document.getElementById('profileEmail');
    const roleP    = document.getElementById('profileRole');
    if (avatarEl) avatarEl.textContent = (user.name || 'U')[0].toUpperCase();
    if (nameP)    nameP.textContent    = user.name  || 'User';
    if (emailP)   emailP.textContent   = user.email || '';
    if (roleP)    roleP.textContent    = user.role  || 'BUYER';

    // ── Logout ──
    const logoutBtn = document.getElementById('logoutDashBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            Utils.setStorage('fc_session', null);
            window.location.href = 'index.html';
        });
    }

    // ── Refresh button ──
    const refreshBtn = document.getElementById('refreshDashBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            clearInterval(refreshTimer);
            clearInterval(countdownTimer);
            loadDashboardData(user);
            startAutoRefresh(user);
        });
    }

    // ── Load data + start auto-refresh ──
    await loadDashboardData(user);
    startAutoRefresh(user);
});

async function loadDashboardData(user) {
    setRefreshIndicator('loading');

    // Parallel fetch
    const [ordersResult, productsResult] = await Promise.allSettled([
        fetch(`/api/orders/user/${user.id}`).then(r => r.ok ? r.json() : []),
        fetch('/api/products').then(r => r.ok ? r.json() : [])
    ]);

    const orders   = ordersResult.status   === 'fulfilled' ? ordersResult.value   : [];
    const products = productsResult.status === 'fulfilled' ? productsResult.value : [];

    // Stats
    const total     = Array.isArray(orders) ? orders.length : 0;
    const spent     = Array.isArray(orders) ? orders.reduce((s, o) => s + (parseFloat(o.totalAmount) || 0), 0) : 0;
    const pending   = Array.isArray(orders) ? orders.filter(o => ['PENDING_PAYMENT','PENDING','CONFIRMED','PROCESSING'].includes(o.status)).length : 0;
    const delivered = Array.isArray(orders) ? orders.filter(o => ['DELIVERED','PAID','COMPLETED'].includes(o.status)).length : 0;

    animateCounter('statOrders',    total,    0,    false);
    animateCounter('statPending',   pending,  0,    false);
    animateCounter('statDelivered', delivered,0,    false);
    animateCounterCurrency('statSpent', spent);

    renderOrdersTable(Array.isArray(orders) ? orders.slice(0, 6) : []);

    if (Array.isArray(products) && products.length) {
        Utils.setStorage('fc_products', products.map(p => ({
            id: String(p.id), title: p.name, category: p.category,
            price: p.price, unit: 'item', farmer: p.farmer?.name || 'Local Farmer',
            location: 'Local Farm', image: p.image, stock: p.stock, desc: p.description
        })));
        renderRecommended(products.slice(0, 4));
    }

    setRefreshIndicator('done');
}

// ── Auto-refresh every 30 seconds ──
function startAutoRefresh(user) {
    refreshCountdown = 30;
    updateCountdownDisplay();

    countdownTimer = setInterval(() => {
        refreshCountdown--;
        updateCountdownDisplay();
        if (refreshCountdown <= 0) refreshCountdown = 30;
    }, 1000);

    refreshTimer = setInterval(() => {
        refreshCountdown = 30;
        loadDashboardData(user);
    }, 30000);
}

function updateCountdownDisplay() {
    const el = document.getElementById('refreshCountdown');
    if (el) el.textContent = `Auto-refresh in ${refreshCountdown}s`;
}

function setRefreshIndicator(state) {
    const icon = document.getElementById('refreshIcon');
    const btn  = document.getElementById('refreshDashBtn');
    if (!icon) return;
    if (state === 'loading') {
        icon.className = 'fa-solid fa-spinner fa-spin';
        if (btn) btn.disabled = true;
    } else {
        icon.className = 'fa-solid fa-rotate-right';
        if (btn) btn.disabled = false;
    }
}

// ── Animated counter (number count-up) ──
function animateCounter(elId, target, start = 0, isCurrency = false) {
    const el = document.getElementById(elId);
    if (!el) return;
    const duration = 1000;
    const step     = 16;
    const steps    = duration / step;
    const inc      = (target - start) / steps;
    let current    = start;
    const timer = setInterval(() => {
        current += inc;
        if ((inc >= 0 && current >= target) || (inc < 0 && current <= target)) {
            current = target;
            clearInterval(timer);
        }
        el.textContent = Math.round(current);
    }, step);
}

function animateCounterCurrency(elId, target) {
    const el = document.getElementById(elId);
    if (!el) return;
    const duration = 1200;
    const step     = 16;
    const steps    = duration / step;
    const inc      = target / steps;
    let current    = 0;
    const timer = setInterval(() => {
        current += inc;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        el.textContent = Utils.formatCurrency(Math.round(current));
    }, step);
}

// ── Orders table ──
function renderOrdersTable(orders) {
    const wrap = document.getElementById('ordersTableWrap');
    if (!wrap) return;

    if (!orders.length) {
        wrap.innerHTML = `
            <div class="empty-orders">
                <i class="fa-solid fa-box-open"></i>
                <p style="font-weight:700; margin-bottom:8px; color:var(--text-primary);">No orders yet!</p>
                <p>Start shopping to see your orders here.</p>
                <a href="products.html" class="btn btn-primary" style="margin-top:18px; display:inline-flex;">
                    <i class="fa-solid fa-basket-shopping"></i> Shop Now
                </a>
            </div>`;
        return;
    }

    const rows = orders.map(o => {
        const statusClass = 'status-' + (o.status || 'PENDING').replace(/ /g, '_');
        const date  = new Date(o.createdAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        const amt   = Utils.formatCurrency(parseFloat(o.totalAmount) || 0);
        const label = (o.status || 'PENDING').replace(/_/g, ' ');
        return `
            <tr>
                <td data-label="Order ID"><strong>#ORD-${o.id}</strong></td>
                <td data-label="Date">${date}</td>
                <td data-label="Amount" style="color:var(--primary-color); font-weight:700;">${amt}</td>
                <td data-label="Status"><span class="status-pill ${statusClass}">${label}</span></td>
                <td data-label="Action">
                    <a href="orders.html" style="color:var(--primary-color); font-weight:600; font-size:0.85rem;">
                        View <i class="fa-solid fa-arrow-right" style="font-size:0.7rem;"></i>
                    </a>
                </td>
            </tr>`;
    }).join('');

    wrap.innerHTML = `
        <table class="orders-table">
            <thead>
                <tr>
                    <th>Order ID</th><th>Date</th><th>Amount</th><th>Status</th><th>Action</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>`;
}

// ── Recommended products ──
function renderRecommended(products) {
    const grid = document.getElementById('recoGrid');
    if (!grid) return;

    grid.innerHTML = products.map(p => `
        <div class="reco-card">
            <img src="${p.image || ''}" alt="${p.name}"
                 onerror="this.src='https://images.unsplash.com/photo-1543362906-acfc16c67564?w=300'">
            <div class="reco-info">
                <div class="reco-name">${p.name}</div>
                <div style="font-size:0.78rem; color:var(--text-secondary); margin-bottom:6px;">${p.category || ''}</div>
                <div class="reco-price">${Utils.formatCurrency(p.price)}</div>
                <button class="reco-btn"
                    onclick="quickAddToCart('${p.id}','${p.name.replace(/'/g,"\\'")}',${p.price},'${(p.image||'').replace(/'/g,"\\'")}')">
                    <i class="fa-solid fa-cart-plus"></i> Add to Cart
                </button>
            </div>
        </div>
    `).join('');
}

window.quickAddToCart = function(id, name, price, image) {
    Utils.addToCart({ id: String(id), title: name, price: parseFloat(price), image, quantity: 1, unit: 'item' }, 1);
};
