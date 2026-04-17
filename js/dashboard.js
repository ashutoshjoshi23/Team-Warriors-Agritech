/**
 * DASHBOARD.JS
 * Requires utils.js. Handles rendering stats and toggling Farmer/Buyer
 * specific modules securely via localStorage and backend API.
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // Auth Validation Check
    const session = Utils.getStorage('fc_session');
    if(!session || !session.isLoggedIn) {
        window.location.href = 'login.html';
        return;
    }

    const { user } = session;
    const isFarmer = user.role.toUpperCase() === 'FARMER';

    // Inject Dashboard UI into dashboard-content
    const dashContent = document.getElementById('dashboard-content');
    if (dashContent) {
        dashContent.innerHTML = `
            <div class="stats-grid" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:20px; margin-bottom:40px;">
                <div class="card" style="text-align:center;">
                    <i id="stat1Icon" class="fa-solid fa-spinner" style="font-size:2rem; color:var(--primary); margin-bottom:10px;"></i>
                    <h3 id="stat1Title">Loading...</h3>
                    <h2 id="stat1Val" style="color:var(--text-color); margin-top:10px;">-</h2>
                </div>
                <div class="card" style="text-align:center;">
                    <i id="stat2Icon" class="fa-solid fa-spinner" style="font-size:2rem; color:var(--primary); margin-bottom:10px;"></i>
                    <h3 id="stat2Title">Loading...</h3>
                    <h2 id="stat2Val" style="color:var(--text-color); margin-top:10px;">-</h2>
                </div>
            </div>
            
            <div class="dashboard-grid" style="display:grid; grid-template-columns: 2fr 1fr; gap:20px;">
                <div class="card">
                    <h3 style="margin-bottom:20px; border-bottom: 1px solid var(--border-color); padding-bottom:10px;">Recent Orders</h3>
                    <div style="overflow-x:auto;">
                        <table class="table" style="width:100%; text-align:left;">
                            <thead>
                                <tr>
                                    <th>Order ID</th>
                                    <th>Date</th>
                                    <th>Items</th>
                                    <th>Total</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody id="recentOrdersBody">
                                <tr><td colspan="5" class="text-center">Loading orders...</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <div class="card" style="text-align:center;">
                    <img id="dashSidebarImg" src="" alt="Profile" style="width:100px; height:100px; border-radius:50%; margin-bottom:15px; object-fit:cover; border:3px solid var(--primary);">
                    <h3 id="dashSidebarName">...</h3>
                    <p id="dashSidebarRole" style="color:var(--text-muted); text-transform:uppercase; font-size:0.9rem; font-weight:700; margin-top:5px;"></p>
                    <button class="btn btn-outline" style="width:100%; margin-top:20px;" onclick="Utils.removeStorage('fc_session'); window.location.href='index.html'">Logout</button>
                </div>
            </div>

            <!-- Farmer specific section -->
            <div id="farmerProductsSection" style="display:none; margin-top:40px;">
                <h3 style="margin-bottom:20px; border-bottom: 1px solid var(--border-color); padding-bottom:10px;">Your Active Products</h3>
                <div id="farmerProductsGrid" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap:20px;"></div>
                
                <div class="card" style="margin-top: 40px; border: 1px solid var(--primary); background: rgba(45, 106, 79, 0.03);">
                    <h3 style="margin-bottom:20px; color:var(--primary);"><i class="fa-solid fa-plus-circle"></i> Sell a New Item</h3>
                    <form id="addProductForm" style="display:grid; gap: 15px;">
                        <div>
                            <label style="font-weight:600; display:block; margin-bottom:5px;">Product Name</label>
                            <input type="text" id="addProdName" class="form-control" required placeholder="e.g. Fresh Oranges">
                        </div>
                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px;">
                            <div>
                                <label style="font-weight:600; display:block; margin-bottom:5px;">Category</label>
                                <select id="addProdCat" class="form-control" required>
                                    <option value="Vegetables">Vegetables</option>
                                    <option value="Fruits">Fruits</option>
                                    <option value="Dairy">Dairy</option>
                                    <option value="Grains">Grains</option>
                                    <option value="Meat">Meat</option>
                                    <option value="Pantry">Pantry</option>
                                </select>
                            </div>
                            <div>
                                <label style="font-weight:600; display:block; margin-bottom:5px;">Price (USD)</label>
                                <input type="number" id="addProdPrice" step="0.01" class="form-control" required placeholder="0.00">
                            </div>
                        </div>
                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px;">
                            <div>
                                <label style="font-weight:600; display:block; margin-bottom:5px;">Stock Quantity</label>
                                <input type="number" id="addProdStock" class="form-control" required placeholder="e.g. 50">
                            </div>
                            <div>
                                <label style="font-weight:600; display:block; margin-bottom:5px;">Image URL</label>
                                <input type="url" id="addProdImage" class="form-control" required placeholder="https://images.unsplash.com/photo-...">
                            </div>
                        </div>
                        <div>
                            <label style="font-weight:600; display:block; margin-bottom:5px;">Description</label>
                            <textarea id="addProdDesc" class="form-control" rows="3" required placeholder="Describe your product..."></textarea>
                        </div>
                        <button type="submit" class="btn btn-primary" id="addProdBtn" style="padding: 12px; font-size:1.1rem;">List Product to Market <i class="fa-solid fa-arrow-right"></i></button>
                    </form>
                </div>
            </div>

            <!-- Buyer specific section -->
            <div id="buyerRecommendationsSection" style="display:none; margin-top:40px;">
                <h3 style="margin-bottom:20px; border-bottom: 1px solid var(--border-color); padding-bottom:10px;">Recommended For You</h3>
                <div id="buyerRecsGrid" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap:20px;"></div>
            </div>
        `;
    }

    // Populate Sidebar Identity
    const sImg = document.getElementById('dashSidebarImg');
    const sName = document.getElementById('dashSidebarName');
    const sRole = document.getElementById('dashSidebarRole');
    if(sImg) sImg.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=2D6A4F&color=fff`;
    if(sName) sName.textContent = user.name;
    if(sRole) sRole.textContent = user.role;

    // Load Mock Orders
    const allOrders = Utils.getStorage('fc_orders', []);
    const relevantOrders = isFarmer 
        ? allOrders.filter(o => o.farmerEmail === user.email)
        : allOrders.filter(o => o.userEmail === user.email);
        
    const viewOrders = isFarmer && relevantOrders.length === 0 
        ? [{ id: 'ORD-8931', date: new Date().toISOString(), total: 45.90, status: 'Pending', items: [1,2] }]
        : relevantOrders;

    // Build Stats
    const stat1Title = document.getElementById('stat1Title');
    const stat1Val = document.getElementById('stat1Val');
    const stat1Icon = document.getElementById('stat1Icon');
    const stat2Title = document.getElementById('stat2Title');
    const stat2Val = document.getElementById('stat2Val');
    const stat2Icon = document.getElementById('stat2Icon');

    if(isFarmer) {
        if(stat1Title) stat1Title.textContent = 'Total Sales';
        if(stat1Val) stat1Val.textContent = Utils.formatCurrency(viewOrders.reduce((acc,o)=>acc+o.total, 0));
        if(stat1Icon) stat1Icon.className = 'fa-solid fa-sack-dollar';
        
        if(stat2Title) stat2Title.textContent = 'Active Products';
        if(stat2Icon) stat2Icon.className = 'fa-solid fa-wheat-awn';
    } else {
        if(stat1Title) stat1Title.textContent = 'Total Spent';
        if(stat1Val) stat1Val.textContent = Utils.formatCurrency(viewOrders.reduce((acc,o)=>acc+o.total, 0));
        if(stat1Icon) stat1Icon.className = 'fa-solid fa-wallet';
        
        if(stat2Title) stat2Title.textContent = 'Orders Placed';
        if(stat2Val) stat2Val.textContent = viewOrders.length.toString();
        if(stat2Icon) stat2Icon.className = 'fa-solid fa-box-open';
    }

    // Render Recent Orders Table
    const tableBody = document.getElementById('recentOrdersBody');
    if(tableBody) {
        if (viewOrders.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="5" class="text-center">No recent orders found.</td></tr>`;
        } else {
            let html = '';
            viewOrders.slice().reverse().slice(0, 5).forEach(o => {
                html += `
                    <tr>
                        <td><strong>${o.id}</strong></td>
                        <td>${new Date(o.date).toLocaleDateString()}</td>
                        <td>${o.items ? o.items.length : 0} items</td>
                        <td>${Utils.formatCurrency(o.total)}</td>
                        <td><span class="status-badge status-${o.status.toLowerCase()}">${o.status}</span></td>
                    </tr>
                `;
            });
            tableBody.innerHTML = html;
        }
    }

    // Fetch live products from backend API
    fetch('http://localhost:8090/api/products')
        .then(res => res.json())
        .then(products => {
            if (isFarmer) {
                const pSection = document.getElementById('farmerProductsSection');
                if(pSection) pSection.style.display = 'block';
                
                // Set the active products stat
                const myProds = products.filter(p => p.farmer && p.farmer.id === user.id);
                if(stat2Val) stat2Val.textContent = myProds.length.toString();

                const grid = document.getElementById('farmerProductsGrid');
                if(grid) {
                    if (myProds.length === 0) {
                        grid.innerHTML = '<p class="text-muted">You have not listed any products yet.</p>';
                    } else {
                        grid.innerHTML = '';
                        myProds.forEach(p => {
                            grid.innerHTML += `
                                <div class="card" style="padding:0; overflow:hidden;">
                                    <img src="${p.image}" alt="prod" style="width:100%; height:160px; object-fit:cover;">
                                    <div style="padding:1rem;">
                                        <h4 style="margin-bottom:0.2rem;">${p.name}</h4>
                                        <p class="text-secondary text-sm">${p.stock} in stock</p>
                                        <div class="flex justify-between items-center mt-2">
                                            <span style="font-weight:700; color:var(--primary)">${Utils.formatCurrency(p.price)}</span>
                                            <span class="badge" style="background:var(--primary); color:white; padding:2px 8px; border-radius:12px; font-size:0.8rem;">Active</span>
                                        </div>
                                    </div>
                                </div>
                            `;
                        });
                    }
                }

                // Add Product Form Handler
                const addForm = document.getElementById('addProductForm');
                if(addForm) {
                    addForm.addEventListener('submit', (e) => {
                        e.preventDefault();
                        const btn = document.getElementById('addProdBtn');
                        btn.disabled = true;
                        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Listing...';

                        const newProduct = {
                            name: document.getElementById('addProdName').value,
                            category: document.getElementById('addProdCat').value,
                            price: parseFloat(document.getElementById('addProdPrice').value),
                            stock: parseInt(document.getElementById('addProdStock').value),
                            image: document.getElementById('addProdImage').value,
                            description: document.getElementById('addProdDesc').value,
                            farmer: {
                                id: user.id
                            }
                        };

                        fetch('http://localhost:8090/api/products', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(newProduct)
                        })
                        .then(res => res.json())
                        .then(data => {
                            Utils.showToast('Product successfully listed!');
                            setTimeout(() => {
                                window.location.reload();
                            }, 1000);
                        })
                        .catch(err => {
                            console.error(err);
                            Utils.showToast('Error listing product', 'error');
                            btn.disabled = false;
                            btn.innerHTML = 'List Product <i class="fa-solid fa-arrow-right"></i>';
                        });
                    });
                }
            } else {
                // Buyer Recommendations
                const rSection = document.getElementById('buyerRecommendationsSection');
                if(rSection) rSection.style.display = 'block';
                
                const grid = document.getElementById('buyerRecsGrid');
                if(grid) {
                    const recs = products.sort(() => 0.5 - Math.random()).slice(0, 3);
                    if (recs.length === 0) {
                        grid.innerHTML = '<p class="text-muted">No products available currently.</p>';
                    } else {
                        grid.innerHTML = '';
                        recs.forEach(p => {
                            const farmerName = p.farmer ? p.farmer.name : 'Unknown Farmer';
                            grid.innerHTML += `
                                <div class="card" style="padding:0; overflow:hidden;">
                                    <img src="${p.image}" alt="prod" style="width:100%; height:160px; object-fit:cover;">
                                    <div style="padding:1rem;">
                                        <h4 style="margin-bottom:0.2rem; font-size:1rem;"><a href="product-details.html?id=${p.id}" style="color:inherit;">${p.name}</a></h4>
                                        <p class="text-secondary text-sm"><i class="fa-solid fa-wheat-awn"></i> ${farmerName}</p>
                                        <div class="flex justify-between items-center mt-2 border-t pt-2" style="border-color:var(--border-color);">
                                            <span style="font-weight:700;">${Utils.formatCurrency(p.price)}</span>
                                            <button class="btn btn-primary" style="padding:0.35rem 0.75rem;" onclick="Utils.showToast('${p.name} mock added to cart!')"><i class="fa-solid fa-cart-plus"></i></button>
                                        </div>
                                    </div>
                                </div>
                            `;
                        });
                    }
                }
            }
        })
        .catch(err => {
            console.error("Failed to load products", err);
            Utils.showToast('Failed to load products from database.', 'error');
        });
});
