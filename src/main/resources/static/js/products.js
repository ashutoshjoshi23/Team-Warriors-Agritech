/**
 * PRODUCTS.JS — v3.0 Blinkit Style
 * - Inline cart quantity on each card (like Blinkit/Zepto)
 * - Cart state visible without opening cart page
 * - Persistent across refresh (reads from user-scoped localStorage)
 */

document.addEventListener('DOMContentLoaded', () => {
    let allProducts    = [];
    let activeCategory = 'all';
    const activeSortEl = document.getElementById('sortSelect');
    const grid         = document.getElementById('productsGrid');
    const searchInput  = document.getElementById('searchInput');
    const emptyState   = document.getElementById('emptyState');
    const resultCount  = document.getElementById('resultCount');

    // ── URL params ──
    const urlParams = new URLSearchParams(window.location.search);
    const urlCat    = urlParams.get('category');
    const urlQ      = urlParams.get('q');
    if (urlQ && searchInput) searchInput.value = urlQ;
    if (urlCat) activeCategory = urlCat;

    // ── Fetch products ──
    fetch('/api/products')
        .then(res => res.json())
        .then(data => {
            allProducts = data.map(p => ({
                id:       String(p.id),
                title:    p.name,
                category: p.category,
                price:    p.price,
                unit:     'item',
                farmer:   p.farmer ? p.farmer.name : 'Local Farmer',
                location: 'Local Farm',
                image:    p.image,
                stock:    p.stock,
                desc:     p.description
            }));
            Utils.setStorage('fc_products', allProducts);
            applyFilters();
        })
        .catch(() => Utils.showToast('Failed to load products.', 'error'));

    // ── Category pills ──
    document.querySelectorAll('.cat-pill').forEach(pill => {
        if (pill.dataset.cat === activeCategory) {
            document.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
        }
        pill.addEventListener('click', () => {
            document.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            activeCategory = pill.dataset.cat;
            applyFilters();
        });
    });

    // ── BLINKIT-STYLE CARD RENDER ──
    const render = (arr) => {
        if (!grid) return;
        if (resultCount) resultCount.textContent = arr.length;

        grid.innerHTML = '';
        if (!arr.length) {
            if (emptyState) emptyState.style.display = 'block';
            return;
        }
        if (emptyState) emptyState.style.display = 'none';

        arr.forEach((p, i) => {
            const cart     = Utils.getCart();
            const cartItem = cart.find(x => String(x.id) === String(p.id));
            const qty      = cartItem ? cartItem.quantity : 0;

            const stockBadge = (p.stock !== undefined && p.stock < 10 && p.stock > 0)
                ? `<span style="background:#f59e0b;color:white;font-size:0.7rem;font-weight:700;padding:3px 8px;border-radius:6px;margin-left:6px;">Low Stock</span>` : '';

            // Blinkit-style bottom control:
            // If qty=0 → big green "Add" button
            // If qty>0 → "-  qty  +" control in green
            const cartControl = qty === 0
                ? `<button class="btn btn-primary atc-btn" style="padding:0.65rem 1.1rem;border-radius:12px;gap:6px;font-weight:700;" onclick="addToCart('${p.id}')">
                       <i class="fa-solid fa-cart-plus"></i> Add
                   </button>`
                : `<div class="inline-qty-ctrl" id="iqc-${p.id}">
                       <button class="iq-btn" onclick="removeFromCart('${p.id}')"><i class="fa-solid fa-minus"></i></button>
                       <span class="iq-num" id="iqn-${p.id}">${qty}</span>
                       <button class="iq-btn" onclick="addToCart('${p.id}')"><i class="fa-solid fa-plus"></i></button>
                   </div>`;

            const card = document.createElement('div');
            card.className   = 'product-card animate-up';
            card.style.animationDelay = `${Math.min(i * 0.07, 0.5)}s`;
            card.id = `pcard-${p.id}`;
            card.innerHTML = `
                <div class="product-img-wrap">
                    <span class="product-badge">Organic</span>
                    <img src="${p.image}" alt="${p.title}" loading="lazy"
                         onerror="this.src='https://images.unsplash.com/photo-1543362906-acfc16c67564?w=400'">
                    <button class="quick-view-btn" onclick="openModal('${p.id}')">
                        <i class="fa-solid fa-eye" style="margin-right:5px;"></i>Quick View
                    </button>
                </div>
                <div class="product-info">
                    <span class="product-category">${p.category}</span>
                    <a href="product-details.html?id=${p.id}">
                        <h3 class="product-title">${p.title}${stockBadge}</h3>
                    </a>
                    <div class="product-farmer"><i class="fa-solid fa-wheat-awn"></i> ${p.farmer}</div>
                    <div style="font-size:0.85rem;color:var(--text-secondary);margin:6px 0 12px;">
                        <i class="fa-solid fa-location-dot"></i> ${p.location}
                    </div>
                    <div class="product-bottom">
                        <div class="product-price">${Utils.formatCurrency(p.price)} <span>/ ${p.unit}</span></div>
                        ${cartControl}
                    </div>
                </div>
            `;
            grid.appendChild(card);
        });
    };

    // ── Filter + Sort ──
    const applyFilters = () => {
        let filtered = [...allProducts];
        const q = searchInput ? searchInput.value.toLowerCase().trim() : '';
        if (q) filtered = filtered.filter(p =>
            p.title.toLowerCase().includes(q) ||
            p.farmer.toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q)
        );
        if (activeCategory !== 'all') {
            filtered = filtered.filter(p => p.category.toLowerCase() === activeCategory.toLowerCase());
        }
        const sort = activeSortEl ? activeSortEl.value : 'default';
        if (sort === 'price-asc')  filtered.sort((a, b) => a.price - b.price);
        else if (sort === 'price-desc') filtered.sort((a, b) => b.price - a.price);
        else if (sort === 'name-asc')   filtered.sort((a, b) => a.title.localeCompare(b.title));
        render(filtered);
    };

    if (searchInput) searchInput.addEventListener('input', applyFilters);
    if (activeSortEl) activeSortEl.addEventListener('change', applyFilters);

    // ── Quick View Modal ──
    const quickModal = document.getElementById('quickPreviewModal');
    const closeBtn   = document.getElementById('closeModalBtn');

    window.openModal = (id) => {
        const p = allProducts.find(x => x.id === String(id));
        if (!p || !quickModal) return;
        document.getElementById('mpImg').src              = p.image;
        document.getElementById('mpCat').textContent      = p.category;
        document.getElementById('mpTitle').textContent    = p.title;
        document.getElementById('mpFarmer').innerHTML     = `<i class="fa-solid fa-wheat-awn"></i> ${p.farmer} &nbsp;·&nbsp; <i class="fa-solid fa-location-dot"></i> ${p.location}`;
        document.getElementById('mpPrice').innerHTML      = `${Utils.formatCurrency(p.price)} <span style="font-size:1rem;color:var(--text-secondary);font-weight:400;">/ ${p.unit}</span>`;
        document.getElementById('mpDesc').textContent     = p.desc || 'Fresh, organic, directly from our trusted local farmers.';
        document.getElementById('mpDetailsLink').href     = `product-details.html?id=${p.id}`;
        const addBtn = document.getElementById('mpAddBtn');
        addBtn.onclick = () => { addToCart(p.id); quickModal.classList.remove('active'); };
        quickModal.classList.add('active');
    };

    if (closeBtn) closeBtn.addEventListener('click', () => quickModal.classList.remove('active'));
    if (quickModal) quickModal.addEventListener('click', e => { if (e.target === quickModal) quickModal.classList.remove('active'); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') quickModal?.classList.remove('active'); });
});

// ── Global: Add to cart (Blinkit inline update) ──
window.addToCart = function(id, qty = 1) {
    const products = Utils.getStorage('fc_products', []);
    const p        = products.find(x => String(x.id) === String(id));
    if (!p) { Utils.showToast('Product not found!', 'error'); return; }

    Utils.addToCart(p, qty);
    updateProductCardQty(id);
};

// ── Global: Remove one from cart (inline minus button) ──
window.removeFromCart = function(id) {
    const cart = Utils.getCart();
    const idx  = cart.findIndex(x => String(x.id) === String(id));
    if (idx === -1) return;

    if (cart[idx].quantity <= 1) {
        cart.splice(idx, 1);
    } else {
        cart[idx].quantity--;
    }
    Utils.setCart(cart);
    if (window.updateNavCartCount) window.updateNavCartCount();
    updateProductCardQty(id);
};

// ── Update a single product card's qty control (no full re-render) ──
function updateProductCardQty(id) {
    const cart     = Utils.getCart();
    const cartItem = cart.find(x => String(x.id) === String(id));
    const qty      = cartItem ? cartItem.quantity : 0;
    const bottom   = document.querySelector(`#pcard-${id} .product-bottom`);
    if (!bottom) return;

    const ctrlEl = bottom.querySelector('.inline-qty-ctrl, .atc-btn');
    if (!ctrlEl) return;

    if (qty === 0) {
        ctrlEl.outerHTML = `
            <button class="btn btn-primary atc-btn"
                style="padding:0.65rem 1.1rem;border-radius:12px;gap:6px;font-weight:700;"
                onclick="addToCart('${id}')">
                <i class="fa-solid fa-cart-plus"></i> Add
            </button>`;
    } else {
        // Check if already a qty ctrl
        const qtyNumEl = document.getElementById(`iqn-${id}`);
        if (qtyNumEl) {
            // Just update the number
            qtyNumEl.textContent = qty;
        } else {
            ctrlEl.outerHTML = `
                <div class="inline-qty-ctrl" id="iqc-${id}">
                    <button class="iq-btn" onclick="removeFromCart('${id}')"><i class="fa-solid fa-minus"></i></button>
                    <span class="iq-num" id="iqn-${id}">${qty}</span>
                    <button class="iq-btn" onclick="addToCart('${id}')"><i class="fa-solid fa-plus"></i></button>
                </div>`;
        }
    }
}
