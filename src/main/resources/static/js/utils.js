/**
 * UTILS.JS — v3.0
 * User-scoped cart, per-user storage, toast, component injection, currency.
 */

const Utils = {
    logAction: (action, meta = {}) => {
        console.log(`[FC] ${new Date().toISOString()} | ${action}`, meta);
    },

    formatCurrency: (val) => new Intl.NumberFormat('en-IN', {
        style: 'currency', currency: 'INR', maximumFractionDigits: 0
    }).format(val),

    /** ── Storage ── */
    getStorage: (key, def = null) => {
        try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : def; }
        catch { return def; }
    },
    setStorage: (key, value) => localStorage.setItem(key, JSON.stringify(value)),
    removeStorage: (key) => localStorage.removeItem(key),

    /** ── USER-SCOPED CART KEY ── */
    cartKey: () => {
        const s = Utils.getStorage('fc_session');
        return s?.isLoggedIn ? `fc_cart_${s.user.id}` : 'fc_cart_guest';
    },

    getCart: () => Utils.getStorage(Utils.cartKey(), []),

    setCart: (cart) => Utils.setStorage(Utils.cartKey(), cart),

    clearCart: () => localStorage.removeItem(Utils.cartKey()),

    /** ── Add to Cart ── */
    addToCart: (product, qty = 1) => {
        const cart = Utils.getCart();
        const idx  = cart.findIndex(x => String(x.id) === String(product.id));
        if (idx > -1) {
            cart[idx].quantity += qty;
        } else {
            cart.push({
                id: String(product.id),
                title: product.name || product.title,
                price: parseFloat(product.price),
                image: product.image || '',
                unit: product.unit || 'item',
                farmer: product.farmer || 'Local Farmer',
                quantity: qty
            });
        }
        Utils.setCart(cart);
        Utils.showToast(`<b>${product.name || product.title}</b> added to cart!`);
        if (window.updateNavCartCount) window.updateNavCartCount();
    },

    /** ── Wishlist (per user) ── */
    wishlistKey: () => {
        const s = Utils.getStorage('fc_session');
        return s?.isLoggedIn ? `fc_wish_${s.user.id}` : 'fc_wish_guest';
    },
    getWishlist: () => Utils.getStorage(Utils.wishlistKey(), []),
    toggleWishlist: (product) => {
        let wish = Utils.getWishlist();
        const idx = wish.findIndex(x => String(x.id) === String(product.id));
        if (idx > -1) {
            wish.splice(idx, 1);
            Utils.setStorage(Utils.wishlistKey(), wish);
            Utils.showToast(`Removed from Wishlist`, 'info');
            return false;
        } else {
            wish.push({ id: String(product.id), title: product.name || product.title,
                price: product.price, image: product.image });
            Utils.setStorage(Utils.wishlistKey(), wish);
            Utils.showToast(`<b>${product.name || product.title}</b> saved to Wishlist!`);
            return true;
        }
    },
    isWishlisted: (id) => Utils.getWishlist().some(x => String(x.id) === String(id)),

    /** ── Farm Coins ── */
    coinsKey: () => {
        const s = Utils.getStorage('fc_session');
        return s?.isLoggedIn ? `fc_coins_${s.user.id}` : null;
    },
    getCoins: () => {
        const k = Utils.coinsKey();
        return k ? (parseInt(Utils.getStorage(k, 0)) || 0) : 0;
    },
    addCoins: (amount) => {
        const k = Utils.coinsKey();
        if (!k) return;
        const coins = Utils.getCoins() + Math.floor(amount * 0.1); // 10% of purchase as coins
        Utils.setStorage(k, coins);
    },

    /** ── Component Injection ── */
    injectComponent: async (path, targetId) => {
        try {
            const res = await fetch(path);
            if (!res.ok) throw new Error('fetch failed');
            document.getElementById(targetId).innerHTML = await res.text();
        } catch (e) {
            console.error(`Inject failed [${path}]:`, e.message);
        }
    },

    /** ── Toast ── */
    showToast: (message, type = 'success') => {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            document.body.appendChild(container);
        }
        const toast = document.createElement('div');
        toast.className = 'toast';
        const icon = type === 'success' ? 'fa-check-circle text-success' : 'fa-info-circle';
        toast.style.borderLeftColor = type === 'error' ? 'var(--danger)' : type === 'info' ? 'var(--info)' : 'var(--primary-color)';
        toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
        container.appendChild(toast);
        setTimeout(() => { toast.classList.add('fade-out'); setTimeout(() => toast.remove(), 300); }, 3500);
    },

    /** ── Loader ── */
    hideLoader: () => {
        const loader = document.getElementById('global-loader');
        if (loader) { loader.style.opacity = '0'; setTimeout(() => loader.style.display = 'none', 300); }
    },
};

window.Utils = Utils;
