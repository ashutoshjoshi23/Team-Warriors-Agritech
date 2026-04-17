/**
 * CART.JS — v4.0 Blinkit/BigBasket Style
 * - Delivery charge: ₹40 below ₹500, FREE above ₹500
 * - Suggestions: never shows items already in cart
 * - Empty cart: beautiful with suggestions still visible
 */

const COUPONS = {
    'FARM10':  { type: 'percent', value: 10,  label: '10% off!' },
    'FRESH20': { type: 'percent', value: 20,  label: '20% off!' },
    'SAVE50':  { type: 'fixed',   value: 50,  label: '₹50 off!' },
    'NMIET':   { type: 'percent', value: 15,  label: '15% student discount!' },
};

const FREE_SHIP_AT  = 500;   // Free delivery threshold
const DELIVERY_FEE  = 40;    // Delivery charge below threshold
let appliedCoupon   = null;
let allProducts     = [];    // Cached from API

document.addEventListener('DOMContentLoaded', async () => {
    await loadAllProducts();   // fetch products first, then render
    renderCart();
});

// ── Load all products from API ──
async function loadAllProducts() {
    try {
        const res  = await fetch('/api/products');
        if (!res.ok) return;
        allProducts = await res.json();
    } catch (e) { console.error('Products fetch:', e); }
}

// ── Main render ──
function renderCart() {
    const cart    = Utils.getCart();
    const body    = document.getElementById('cartItemsBody');
    const countEl = document.getElementById('cartCount');

    const totalQty = cart.reduce((s, i) => s + i.quantity, 0);
    if (countEl) countEl.textContent = totalQty;

    if (!cart.length) {
        renderEmptyCart(body);
        updateSummary(0);
        const btn = document.getElementById('checkoutBtn');
        if (btn) btn.disabled = true;
        renderSuggestions();   // still show suggestions even if empty
        return;
    }

    const btn = document.getElementById('checkoutBtn');
    if (btn) btn.disabled = false;

    body.innerHTML = cart.map((item, i) => `
        <div class="cart-item" id="ci-${i}">
            <img class="cart-item-img"
                 src="${item.image || ''}" alt="${item.title}"
                 onerror="this.src='https://images.unsplash.com/photo-1543362906-acfc16c67564?w=200'">
            <div class="cart-item-info">
                <div class="cart-item-name">${item.title}</div>
                <div class="cart-item-farmer"><i class="fa-solid fa-wheat-awn"></i> ${item.farmer || 'Local Farmer'}</div>
                <div class="cart-item-price">${Utils.formatCurrency(item.price)} / ${item.unit || 'item'}</div>
            </div>
            <div class="qty-ctrl">
                <button class="qty-btn" onclick="changeQty(${i}, -1)"><i class="fa-solid fa-minus"></i></button>
                <span class="qty-display">${item.quantity}</span>
                <button class="qty-btn" onclick="changeQty(${i}, 1)"><i class="fa-solid fa-plus"></i></button>
            </div>
            <div class="cart-item-total">${Utils.formatCurrency(item.price * item.quantity)}</div>
            <button class="remove-btn" onclick="removeItem(${i})" title="Remove">
                <i class="fa-solid fa-trash-can"></i>
            </button>
        </div>
    `).join('');

    const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
    updateSummary(subtotal);
    renderSuggestions();
    if (window.updateNavCartCount) window.updateNavCartCount();
}

// ── Beautiful empty cart (Blinkit style) ──
function renderEmptyCart(body) {
    if (!body) return;
    body.innerHTML = `
        <div class="empty-cart">
            <div class="empty-cart-icon">
                <i class="fa-solid fa-basket-shopping"></i>
            </div>
            <h3>Your cart is empty!</h3>
            <p>Looks like you haven't added any fresh produce yet.<br>Start adding items to place your first order!</p>
            <a href="products.html" class="btn btn-primary" style="margin-top:18px;display:inline-flex;gap:8px;">
                <i class="fa-solid fa-store"></i> Browse Marketplace
            </a>
            <div style="margin-top:24px; display:flex; justify-content:center; gap:20px; flex-wrap:wrap;">
                <a href="products.html?category=Vegetables" class="cat-pill"><i class="fa-solid fa-carrot"></i> Vegetables</a>
                <a href="products.html?category=Fruits" class="cat-pill"><i class="fa-solid fa-apple-whole"></i> Fruits</a>
                <a href="products.html?category=Dairy" class="cat-pill"><i class="fa-solid fa-bottle-water"></i> Dairy</a>
            </div>
        </div>
    `;
}

// ── Summary with REAL delivery charges ──
function updateSummary(subtotal) {
    let discount = 0;
    if (appliedCoupon) {
        discount = appliedCoupon.type === 'percent'
            ? Math.round(subtotal * appliedCoupon.value / 100)
            : Math.min(appliedCoupon.value, subtotal);
    }

    const afterDiscount = subtotal - discount;

    // Delivery: ₹40 below threshold, FREE above
    const deliveryFee = (subtotal > 0 && afterDiscount < FREE_SHIP_AT) ? DELIVERY_FEE : 0;
    const gst         = Math.round(afterDiscount * 0.08);
    const total       = afterDiscount + gst + deliveryFee;

    setEl('sumSubtotal', Utils.formatCurrency(subtotal));
    setEl('sumGST',      Utils.formatCurrency(gst));
    setEl('sumTotal',    Utils.formatCurrency(subtotal > 0 ? total : 0));

    // Delivery charge display
    const shipEl = document.getElementById('sumShipping');
    if (shipEl) {
        if (subtotal === 0) {
            shipEl.textContent = '—';
            shipEl.style.color = 'var(--text-secondary)';
        } else if (deliveryFee === 0) {
            shipEl.innerHTML = '<span style="color:var(--success);font-weight:800;">FREE</span>';
        } else {
            shipEl.innerHTML = `<span style="color:var(--danger);font-weight:700;">${Utils.formatCurrency(deliveryFee)}</span>`;
        }
    }

    // Discount row
    const dRow = document.getElementById('discountRow');
    if (dRow) dRow.style.display = discount > 0 ? 'flex' : 'none';
    setEl('sumDiscount', '-' + Utils.formatCurrency(discount));

    // Free shipping progress bar
    const needed   = Math.max(FREE_SHIP_AT - afterDiscount, 0);
    const pct      = Math.min((afterDiscount / FREE_SHIP_AT) * 100, 100);
    const prog     = document.getElementById('shipProgress');
    const shipTxt  = document.getElementById('shipText');

    if (prog) prog.style.width = pct + '%';
    if (shipTxt) {
        if (subtotal === 0) {
            shipTxt.innerHTML = `Add <span>${Utils.formatCurrency(FREE_SHIP_AT)}</span> for Free Delivery`;
        } else if (needed <= 0) {
            shipTxt.innerHTML = '<span style="color:var(--success);"><i class="fa-solid fa-check-circle"></i> Free Delivery unlocked!</span>';
        } else {
            shipTxt.innerHTML = `Add <span>${Utils.formatCurrency(needed)}</span> more for Free Delivery <small style="opacity:0.7;">(currently ₹${DELIVERY_FEE} charge)</small>`;
        }
    }

    // Delivery row label
    const delivRowLabel = document.getElementById('deliveryLabel');
    if (delivRowLabel) {
        delivRowLabel.textContent = deliveryFee > 0
            ? `Delivery (below ₹${FREE_SHIP_AT})`
            : 'Delivery';
    }

    // Farm Coins
    const coins   = Math.floor(total * 0.1);
    const coinsEl = document.getElementById('coinsPreview');
    const coinsV  = document.getElementById('coinsToEarn');
    if (coinsEl) coinsEl.style.display = subtotal > 0 ? 'flex' : 'none';
    if (coinsV)  coinsV.textContent = coins;
}

function setEl(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

// ── Coupon ──
function applyCoupon() {
    const inp  = document.getElementById('couponInput');
    const msg  = document.getElementById('couponMsg');
    const code = (inp?.value || '').toUpperCase().trim();
    if (!code) { showMsg(msg, 'Enter a coupon code.', 'danger'); return; }

    const coupon = COUPONS[code];
    if (!coupon) {
        appliedCoupon = null;
        showMsg(msg, '<i class="fa-solid fa-xmark"></i> Invalid coupon code.', 'danger');
    } else {
        appliedCoupon = coupon;
        showMsg(msg, `<i class="fa-solid fa-check"></i> Coupon applied — ${coupon.label}`, 'success');
        Utils.showToast(`Coupon <b>${code}</b> applied — ${coupon.label}`);
    }
    const cart     = Utils.getCart();
    const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
    updateSummary(subtotal);
}
window.applyCoupon = applyCoupon;

function showMsg(el, html, type) {
    if (!el) return;
    el.innerHTML = html;
    el.style.color = type === 'danger' ? 'var(--danger)' : 'var(--success)';
}

// ── Quantity & Remove ──
window.changeQty = (index, delta) => {
    const cart = Utils.getCart();
    if (!cart[index]) return;
    cart[index].quantity = Math.max(1, cart[index].quantity + delta);
    Utils.setCart(cart);
    renderCart();
};

window.removeItem = (index) => {
    const cart = Utils.getCart();
    const name = cart[index]?.title;

    // Animate out
    const row = document.getElementById(`ci-${index}`);
    if (row) {
        row.style.transition = 'all 0.3s ease';
        row.style.opacity    = '0';
        row.style.transform  = 'translateX(-20px)';
        setTimeout(() => {
            cart.splice(index, 1);
            Utils.setCart(cart);
            Utils.showToast(`${name} removed`, 'info');
            renderCart();
        }, 280);
    } else {
        cart.splice(index, 1);
        Utils.setCart(cart);
        Utils.showToast(`${name} removed`, 'info');
        renderCart();
    }
};

window.clearAllCart = () => {
    if (!confirm('Clear entire cart?')) return;
    Utils.clearCart();
    renderCart();
    Utils.showToast('Cart cleared!', 'info');
};

// ── Suggestions: exclude ALL items already in cart ──
function renderSuggestions() {
    const grid    = document.getElementById('suggestGrid');
    const section = document.getElementById('suggestionsSection');
    if (!grid || !allProducts.length) return;

    const cart   = Utils.getCart();
    const inCart = new Set(cart.map(i => String(i.id)));

    // Only show products NOT in cart
    const sugg = allProducts
        .filter(p => !inCart.has(String(p.id)))
        .slice(0, 4);

    if (!sugg.length) {
        if (section) section.style.display = 'none';
        return;
    }

    if (section) section.style.display = 'block';

    grid.innerHTML = sugg.map(p => `
        <div class="suggest-card">
            <img src="${p.image || ''}" alt="${p.name}"
                 onerror="this.src='https://images.unsplash.com/photo-1543362906-acfc16c67564?w=200'">
            <div class="suggest-info">
                <div class="suggest-name">${p.name}</div>
                <div style="font-size:0.75rem;color:var(--text-secondary);margin-bottom:4px;">${p.category || ''}</div>
                <div class="suggest-price">${Utils.formatCurrency(p.price)}</div>
                <button class="suggest-add"
                    onclick="quickAdd('${p.id}','${p.name.replace(/'/g,"\\'")}',${p.price},'${(p.image||'').replace(/'/g,"\\'")}','${p.category||''}','${p.farmer?.name||'Local Farmer'}')">
                    <i class="fa-solid fa-plus"></i> Add to Cart
                </button>
            </div>
        </div>
    `).join('');
}

window.quickAdd = (id, name, price, image, category, farmer) => {
    Utils.addToCart({ id, name, price: parseFloat(price), image, unit: 'item', farmer, category }, 1);
    renderCart();
};
