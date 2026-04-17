/**
 * PRODUCTS.JS
 * Fetches dynamic live data from Spring Boot API, runs live filters, 
 * handles AddToCart and the Quick Preview Modal.
 */

document.addEventListener('DOMContentLoaded', () => {
    let allProducts = [];
    
    // Fetch products from API

        .then(res => res.json())
        .then(data => {
            // Map the backend data to match the expected format slightly
            allProducts = data.map(p => ({
                id: p.id,
                title: p.name,
                category: p.category,
                price: p.price,
                unit: 'item', // default unit
                farmer: p.farmer ? p.farmer.name : 'Unknown Farmer',
                location: 'Local Farm', // default location
                image: p.image,
                stock: p.stock,
                desc: p.description
            }));
            
            // Save to storage for global AddToCart access
            Utils.setStorage('fc_products', allProducts);
            
            // Initialize filters with live data
            applyFilters();
        })
        .catch(err => {
            console.error('Error fetching products:', err);
            Utils.showToast('Failed to load marketplace products.', 'error');
        });

    
    // 2. Selectors
    const grid = document.getElementById('productsGrid');
    const searchInput = document.getElementById('searchInput');
    const categorySelect = document.getElementById('categoryFilter');
    const emptyState = document.getElementById('emptyState');

    // Quick parse URL if coming from home categories
    const urlParams = new URLSearchParams(window.location.search);
    const urlCat = urlParams.get('category');
    const urlQ = urlParams.get('q');
    
    if(urlCat && categorySelect) {
        // Simple case-insensitive match for select dropdown
        Array.from(categorySelect.options).forEach(opt => {
            if(opt.value.toLowerCase() === urlCat.toLowerCase()) categorySelect.value = opt.value;
        });
    }
    if(urlQ && searchInput) {
        searchInput.value = urlQ;
    }

    // 3. Render Engine
    const render = (arr) => {
        if(!grid) return;
        grid.innerHTML = '';
        if(arr.length === 0) {
            grid.style.display = 'none';
            if(emptyState) emptyState.style.display = 'block';
            return;
        }
        grid.style.display = 'grid';
        if(emptyState) emptyState.style.display = 'none';

        arr.forEach(p => {
            const card = document.createElement('div');
            card.className = 'product-card';
            card.innerHTML = `
                <div class="product-img-wrap">
                    <span class="product-badge">Organic</span>
                    <img src="${p.image}" alt="${p.title}" loading="lazy">
                    <button class="quick-view-btn" onclick="openModal('${p.id}')">Quick View</button>
                </div>
                <div class="product-info">
                    <span class="product-category">${p.category}</span>
                    <a href="product-details.html?id=${p.id}"><h3 class="product-title">${p.title}</h3></a>
                    <div class="product-farmer"><i class="fa-solid fa-wheat-awn mr-1"></i> ${p.farmer}</div>
                    <div class="text-secondary text-sm mt-1 border-b pb-2"><i class="fa-solid fa-location-dot", style="margin-right:2px;"></i> ${p.location}</div>
                    <div class="product-bottom">
                        <div class="product-price">${Utils.formatCurrency(p.price)} <span>/ ${p.unit}</span></div>
                        <button class="btn btn-primary" style="padding: 0.5rem 1rem;" onclick="addToCart('${p.id}')"><i class="fa-solid fa-cart-shopping"></i></button>
                    </div>
                </div>
            `;
            grid.appendChild(card);
        });
    };

    // 4. Filter Logic
    const applyFilters = () => {
        let filtered = [...allProducts];

        // text search
        if(searchInput && searchInput.value) {
            const s = searchInput.value.toLowerCase();
            filtered = filtered.filter(f => f.title.toLowerCase().includes(s) || f.farmer.toLowerCase().includes(s));
        }

        // categories dropdown
        if(categorySelect && categorySelect.value !== 'all') {
            // value in html is lower case, e.g., 'vegetables'. Original data category is capitalized e.g. 'Vegetables'.
            filtered = filtered.filter(f => f.category.toLowerCase() === categorySelect.value.toLowerCase());
        }

        render(filtered);
    };

    // 5. Binding Events
    if(searchInput) searchInput.addEventListener('input', applyFilters);
    if(categorySelect) categorySelect.addEventListener('change', applyFilters);

    // Filter initialized during fetch response

    // 6. Modal Engine
    const quickModal = document.getElementById('quickPreviewModal');
    const closeBtn = document.getElementById('closeModalBtn');
    
    window.openModal = (id) => {
        const p = allProducts.find(x => x.id === id);
        if(!p || !quickModal) return;
        
        document.getElementById('mpImg').src = p.image;
        document.getElementById('mpCat').textContent = p.category;
        document.getElementById('mpTitle').textContent = p.title;
        document.getElementById('mpFarmer').innerHTML = `<i class="fa-solid fa-wheat-awn mr-1"></i> ${p.farmer}`;
        document.getElementById('mpPrice').innerHTML = `${Utils.formatCurrency(p.price)} <span style="font-size:1rem;color:var(--text-secondary);font-weight:400;">/ ${p.unit}</span>`;
        document.getElementById('mpDesc').textContent = p.desc;
        document.getElementById('mpDetailsLink').href = `product-details.html?id=${p.id}`;
        
        const addBtn = document.getElementById('mpAddBtn');
        addBtn.onclick = () => { addToCart(p.id); quickModal.classList.remove('active'); };

        quickModal.classList.add('active');
    };

    if(closeBtn && quickModal) {
        closeBtn.addEventListener('click', () => quickModal.classList.remove('active'));
        quickModal.addEventListener('click', (e) => {
            if(e.target === quickModal) quickModal.classList.remove('active');
        });
    }
});

// 7. Global Add To Cart (Used by Grid and Modal)
window.addToCart = function(id, qty = 1) {
    const products = Utils.getStorage('fc_products', []);
    const p = products.find(x => String(x.id) === String(id));
    if(!p) return;

    let cart = Utils.getStorage('fc_cart', []);
    const exists = cart.findIndex(x => String(x.id) === String(id));
    if(exists > -1) {
        cart[exists].quantity += qty;
    } else {
        cart.push({...p, quantity: qty});
    }
    
    Utils.setStorage('fc_cart', cart);
    Utils.showToast(`<b>${p.title}</b> added to cart!`);
    Utils.logAction('Added to Cart', { productId: id });
    
    if(window.updateNavCartCount) window.updateNavCartCount();
};
