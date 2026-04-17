/**
 * HOME.JS — v2.0
 * Dynamically renders featured products on the homepage with full product cards.
 */
document.addEventListener('DOMContentLoaded', () => {
    const featuredGrid = document.getElementById('featuredProducts');
    if (!featuredGrid) return;

    fetch('/api/products')
        .then(res => res.json())
        .then(products => {
            if (!products || !products.length) {
                featuredGrid.innerHTML = `
                    <div style="grid-column:1/-1; text-align:center; padding:50px; color:var(--text-secondary);">
                        <i class="fa-solid fa-seedling" style="font-size:2.5rem; margin-bottom:12px; display:block; color:var(--border-color);"></i>
                        <p>No products available yet. Check back soon!</p>
                    </div>`;
                return;
            }

            // Store globally for cart access
            Utils.setStorage('fc_products', products.map(p => ({
                id: String(p.id), title: p.name, category: p.category,
                price: p.price, unit: 'item',
                farmer: p.farmer?.name || 'Local Farmer',
                location: 'Local Farm', image: p.image,
                stock: p.stock, desc: p.description
            })));

            // Category-based fallback images
            const fallbacks = {
                'Fruits':     'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=400',
                'Vegetables': 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400',
                'Dairy':      'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400',
                'Grains':     'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400',
                'Honey':      'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400',
                'default':    'https://images.unsplash.com/photo-1543362906-acfc16c67564?w=400'
            };

            const getFallback = (cat) => fallbacks[cat] || fallbacks['default'];

            // Show first 4 as featured
            const featured = products.slice(0, 4);
            featuredGrid.innerHTML = '';

            featured.forEach((p, i) => {
                const farmerName = p.farmer?.name || 'Local Farmer';
                const catName    = p.category || 'Fresh';
                const imgSrc     = (p.image && p.image.trim() !== '') ? p.image : getFallback(catName);

                const card = document.createElement('div');
                card.className = 'product-card animate-up';
                card.style.animationDelay = `${i * 0.1}s`;
                card.innerHTML = `
                    <div class="product-img-wrap">
                        <span class="product-badge">Organic</span>
                        <img src="${imgSrc}" alt="${p.name}" loading="lazy"
                             onerror="this.onerror=null;this.src='${getFallback(catName)}'">
                    </div>
                    <div class="product-info">
                        <span class="product-category">${catName}</span>
                        <a href="products.html?id=${p.id}" style="text-decoration:none;">
                            <h3 class="product-title">${p.name}</h3>
                        </a>
                        <div class="product-farmer">
                            <i class="fa-solid fa-wheat-awn"></i>
                            ${farmerName}
                        </div>
                        <div class="product-bottom">
                            <div class="product-price">
                                ${Utils.formatCurrency(p.price)}
                                <span>/ item</span>
                            </div>
                            <button class="btn btn-primary"
                                style="padding:0.55rem 1rem;border-radius:12px;font-size:0.85rem;gap:6px;display:flex;align-items:center;"
                                onclick="homeAddToCart('${p.id}')">
                                <i class="fa-solid fa-cart-plus"></i>
                                <span style="font-size:0.8rem;">Add</span>
                            </button>
                        </div>
                    </div>
                `;
                featuredGrid.appendChild(card);
            });

        })
        .catch(err => {
            console.error('Featured products error:', err);
            featuredGrid.innerHTML = `
                <div style="grid-column:1/-1; text-align:center; padding:40px; color:var(--text-secondary);">
                    <i class="fa-solid fa-wifi" style="font-size:2rem; margin-bottom:12px; display:block;"></i>
                    <p>Unable to load products. Please check your connection.</p>
                </div>`;
        });
});

window.homeAddToCart = function(id) {
    const products = Utils.getStorage('fc_products', []);
    const p = products.find(x => String(x.id) === String(id));
    if (p) Utils.addToCart(p, 1);
    else Utils.showToast('Could not add to cart.', 'error');
};
