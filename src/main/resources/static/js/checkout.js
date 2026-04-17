/**
 * CHECKOUT.JS — v3.0
 * Custom Payment Modal (UPI / Card / NetBanking / COD)
 */
document.addEventListener('DOMContentLoaded', () => {
    const session = Utils.getStorage('fc_session');
    if (!session || !session.isLoggedIn) {
        Utils.showToast('Please log in to checkout!', 'info');
        setTimeout(() => window.location.href = 'login.html', 1500);
        return;
    }

    const nameEl = document.getElementById('chkName');
    const phoneEl = document.getElementById('chkPhone');
    if (nameEl && session.user?.name) nameEl.value = session.user.name;
    if (phoneEl && session.user?.phone) phoneEl.value = session.user.phone;

    const cart = Utils.getCart();
    if (!cart.length) { window.location.href = 'cart.html'; return; }
    renderOrderSummary(cart);

    document.getElementById('checkoutForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleCheckout(cart, session);
    });
});

async function handleCheckout(cart, session) {
    const btn = document.getElementById('placeOrderBtn');
    const orig = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Creating order...';
    btn.disabled = true;

    const shippingAddress = [
        document.getElementById('chkAddress')?.value,
        document.getElementById('chkCity')?.value,
        document.getElementById('chkState')?.value,
        document.getElementById('chkZip')?.value
    ].filter(Boolean).join(', ');

    try {
        const totals = calculateTotal(cart);
        const orderRes = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                buyer: { id: session.user.id },
                totalAmount: totals.grandTotal,
                status: 'PENDING_PAYMENT',
                shippingAddress,
                items: cart.map(i => ({ product: { id: i.id }, quantity: i.quantity, price: i.price }))
            })
        });

        if (!orderRes.ok) throw new Error(await orderRes.text());
        const savedOrder = await orderRes.json();

        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Initializing payment...';

        // Step 2: Create payment intent (sets razorpayOrderId in DB)
        const rzpRes = await fetch(`/api/payments/create-order/${savedOrder.id}`, { method: 'POST' });
        const rzpData = rzpRes.ok ? await rzpRes.json() : { id: `order_mock_${savedOrder.id}` };
        const orderId = rzpData.id || `order_mock_${savedOrder.id}`;

        btn.innerHTML = orig;
        btn.disabled = false;

        // Open custom payment modal
        openPaymentModal(savedOrder, cart, totals, orderId);

    } catch (err) {
        Utils.showToast('Error: ' + err.message, 'error');
        btn.innerHTML = orig;
        btn.disabled = false;
    }
}

// ── Custom Payment Modal ──
function openPaymentModal(order, cart, totals, orderId) {
    const existing = document.getElementById('payModalOverlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'payModalOverlay';
    overlay.innerHTML = `
    <style>
    #payModalOverlay {
        position:fixed;inset:0;background:rgba(0,0,0,0.65);z-index:99999;
        display:flex;align-items:center;justify-content:center;padding:16px;
        backdrop-filter:blur(4px);animation:fadeIn 0.2s ease;
    }
    @keyframes fadeIn{from{opacity:0}to{opacity:1}}
    #payModal {
        background:var(--bg-alt);border-radius:24px;width:100%;max-width:480px;
        box-shadow:0 25px 60px rgba(0,0,0,0.35);overflow:hidden;
        animation:slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1);
    }
    @keyframes slideUp{from{transform:translateY(40px);opacity:0}to{transform:translateY(0);opacity:1}}
    .pm-header {
        background:linear-gradient(135deg,#1B4332,#2D6A4F);
        padding:20px 24px;display:flex;justify-content:space-between;align-items:center;
    }
    .pm-brand { color:white;font-weight:800;font-size:1.1rem; }
    .pm-amount { color:#6EE7B7;font-weight:800;font-size:1.1rem; }
    .pm-close { background:rgba(255,255,255,0.15);border:none;color:white;
        width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:1rem;
        display:flex;align-items:center;justify-content:center; }
    .pm-tabs { display:flex;border-bottom:2px solid var(--border-color);background:var(--bg-color); }
    .pm-tab {
        flex:1;padding:14px 8px;border:none;background:none;
        font-family:inherit;font-size:0.82rem;font-weight:600;
        color:var(--text-secondary);cursor:pointer;transition:all 0.2s;
        display:flex;flex-direction:column;align-items:center;gap:4px;
        border-bottom:3px solid transparent;margin-bottom:-2px;
    }
    .pm-tab.active { color:var(--primary-color);border-bottom-color:var(--primary-color); }
    .pm-tab i { font-size:1.1rem; }
    .pm-body { padding:24px; }
    .pm-panel { display:none; }
    .pm-panel.active { display:block;animation:fadeIn 0.2s; }
    .pm-field { margin-bottom:16px; }
    .pm-field label { display:block;font-size:0.82rem;font-weight:700;
        color:var(--text-secondary);margin-bottom:6px;text-transform:uppercase;letter-spacing:0.5px; }
    .pm-field input, .pm-field select {
        width:100%;padding:12px 14px;border:2px solid var(--border-color);
        border-radius:12px;background:var(--bg-color);color:var(--text-primary);
        font-family:inherit;font-size:0.95rem;outline:none;transition:all 0.2s;box-sizing:border-box;
    }
    .pm-field input:focus, .pm-field select:focus { border-color:var(--primary-color); }
    .pm-row2 { display:grid;grid-template-columns:1fr 1fr;gap:12px; }
    .pm-pay-btn {
        width:100%;padding:15px;border-radius:14px;
        background:linear-gradient(135deg,#1B4332,#2D6A4F,#40916C);
        color:white;border:none;font-family:inherit;font-weight:800;
        font-size:1rem;cursor:pointer;transition:all 0.3s;margin-top:8px;
        display:flex;align-items:center;justify-content:center;gap:10px;
        box-shadow:0 8px 20px rgba(45,106,79,0.3);
    }
    .pm-pay-btn:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 12px 28px rgba(45,106,79,0.4);}
    .pm-pay-btn:disabled{opacity:0.6;cursor:not-allowed;}
    .upi-apps { display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:16px; }
    .upi-app {
        border:2px solid var(--border-color);border-radius:12px;padding:12px 8px;
        text-align:center;cursor:pointer;transition:all 0.2s;background:var(--bg-color);
        font-size:0.75rem;font-weight:700;color:var(--text-secondary);
    }
    .upi-app:hover,.upi-app.selected { border-color:var(--primary-color);background:rgba(45,106,79,0.08);color:var(--primary-color); }
    .upi-app .upi-icon { font-size:1.5rem;margin-bottom:4px;display:block; }
    .cod-info { background:linear-gradient(135deg,rgba(245,158,11,0.1),rgba(217,119,6,0.05));
        border:2px solid rgba(245,158,11,0.3);border-radius:14px;padding:18px;text-align:center; }
    .cod-info i { font-size:2rem;color:#d97706;margin-bottom:10px;display:block; }
    .cod-info h4 { font-weight:800;margin-bottom:6px; }
    .cod-info p { font-size:0.85rem;color:var(--text-secondary); }
    .net-banks { display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px; }
    .net-bank {
        border:2px solid var(--border-color);border-radius:10px;padding:10px 12px;
        cursor:pointer;transition:all 0.2s;background:var(--bg-color);
        font-size:0.85rem;font-weight:600;color:var(--text-secondary);
        display:flex;align-items:center;gap:8px;
    }
    .net-bank:hover,.net-bank.selected { border-color:var(--primary-color);color:var(--primary-color); }
    .pm-secure { display:flex;align-items:center;justify-content:center;gap:6px;
        font-size:0.75rem;color:var(--text-secondary);margin-top:14px; }
    /* Success screen */
    #paySuccess { display:none;padding:40px 24px;text-align:center; }
    .success-check { width:80px;height:80px;border-radius:50%;
        background:linear-gradient(135deg,#16a34a,#22c55e);
        display:flex;align-items:center;justify-content:center;
        margin:0 auto 20px;animation:pop 0.5s cubic-bezier(0.34,1.56,0.64,1); }
    @keyframes pop{from{transform:scale(0)}to{transform:scale(1)}}
    .success-check i { font-size:2rem;color:white; }
    </style>

    <div id="payModal">
        <div class="pm-header">
            <div class="pm-brand"><i class="fa-solid fa-leaf" style="margin-right:6px;"></i>FarmConnect Pay</div>
            <div class="pm-amount" id="pmAmount">${Utils.formatCurrency(totals.grandTotal)}</div>
            <button class="pm-close" onclick="closePayModal()"><i class="fa-solid fa-xmark"></i></button>
        </div>

        <div id="payMainContent">
            <!-- Tabs -->
            <div class="pm-tabs">
                <button class="pm-tab active" onclick="switchTab('upi',this)">
                    <i class="fa-solid fa-mobile-screen"></i>UPI
                </button>
                <button class="pm-tab" onclick="switchTab('card',this)">
                    <i class="fa-solid fa-credit-card"></i>Card
                </button>
                <button class="pm-tab" onclick="switchTab('netbanking',this)">
                    <i class="fa-solid fa-building-columns"></i>Net Banking
                </button>
                <button class="pm-tab" onclick="switchTab('cod',this)">
                    <i class="fa-solid fa-truck"></i>COD
                </button>
            </div>

            <div class="pm-body">
                <!-- UPI Panel -->
                <div class="pm-panel active" id="panel-upi">
                    <div class="upi-apps">
                        <div class="upi-app" onclick="selectUpiApp(this,'GPay')">
                            <span class="upi-icon">🟢</span>GPay
                        </div>
                        <div class="upi-app" onclick="selectUpiApp(this,'PhonePe')">
                            <span class="upi-icon">🟣</span>PhonePe
                        </div>
                        <div class="upi-app" onclick="selectUpiApp(this,'Paytm')">
                            <span class="upi-icon">🔵</span>Paytm
                        </div>
                        <div class="upi-app" onclick="selectUpiApp(this,'BHIM')">
                            <span class="upi-icon">🇮🇳</span>BHIM
                        </div>
                    </div>
                    <div class="pm-field">
                        <label>Or Enter UPI ID</label>
                        <input type="text" id="upiId" placeholder="yourname@upi">
                    </div>
                    <button class="pm-pay-btn" onclick="processPayment('upi')" id="payBtnUpi">
                        <i class="fa-solid fa-shield-halved"></i>Pay ${Utils.formatCurrency(totals.grandTotal)}
                    </button>
                </div>

                <!-- Card Panel -->
                <div class="pm-panel" id="panel-card">
                    <div class="pm-field">
                        <label>Card Number</label>
                        <input type="text" id="cardNum" placeholder="1234 5678 9012 3456" maxlength="19"
                               oninput="formatCard(this)">
                    </div>
                    <div class="pm-field">
                        <label>Name on Card</label>
                        <input type="text" id="cardName" placeholder="PINAK DHABU">
                    </div>
                    <div class="pm-row2">
                        <div class="pm-field">
                            <label>Expiry</label>
                            <input type="text" id="cardExp" placeholder="MM/YY" maxlength="5" oninput="formatExpiry(this)">
                        </div>
                        <div class="pm-field">
                            <label>CVV</label>
                            <input type="password" id="cardCvv" placeholder="•••" maxlength="3">
                        </div>
                    </div>
                    <button class="pm-pay-btn" onclick="processPayment('card')" id="payBtnCard">
                        <i class="fa-solid fa-lock"></i>Pay ${Utils.formatCurrency(totals.grandTotal)}
                    </button>
                </div>

                <!-- Net Banking Panel -->
                <div class="pm-panel" id="panel-netbanking">
                    <div class="net-banks">
                        <div class="net-bank" onclick="selectBank(this,'SBI')">🏦 SBI</div>
                        <div class="net-bank" onclick="selectBank(this,'HDFC')">🏦 HDFC</div>
                        <div class="net-bank" onclick="selectBank(this,'ICICI')">🏦 ICICI</div>
                        <div class="net-bank" onclick="selectBank(this,'Axis')">🏦 Axis</div>
                        <div class="net-bank" onclick="selectBank(this,'Kotak')">🏦 Kotak</div>
                        <div class="net-bank" onclick="selectBank(this,'BOB')">🏦 BOB</div>
                    </div>
                    <div class="pm-field">
                        <label>Or Select Bank</label>
                        <select id="bankSelect">
                            <option value="">Select your bank</option>
                            <option>Punjab National Bank</option>
                            <option>Canara Bank</option>
                            <option>Union Bank</option>
                            <option>Yes Bank</option>
                            <option>IndusInd Bank</option>
                        </select>
                    </div>
                    <button class="pm-pay-btn" onclick="processPayment('netbanking')" id="payBtnNet">
                        <i class="fa-solid fa-building-columns"></i>Proceed to Bank
                    </button>
                </div>

                <!-- COD Panel -->
                <div class="pm-panel" id="panel-cod">
                    <div class="cod-info">
                        <i class="fa-solid fa-truck-fast"></i>
                        <h4>Cash on Delivery</h4>
                        <p>Pay <strong>${Utils.formatCurrency(totals.grandTotal)}</strong> when your order arrives.<br>
                        Our delivery partner will collect the payment.</p>
                    </div>
                    <div style="margin-top:16px;padding:12px;background:var(--bg-color);border-radius:10px;font-size:0.82rem;color:var(--text-secondary);">
                        <i class="fa-solid fa-circle-info" style="color:var(--primary-color);"></i>
                        Extra ₹25 COD handling charge applies.
                        Estimated delivery: 2-4 business days.
                    </div>
                    <button class="pm-pay-btn" onclick="processPayment('cod')" id="payBtnCod" style="margin-top:16px;">
                        <i class="fa-solid fa-handshake"></i>Place COD Order
                    </button>
                </div>

                <div class="pm-secure">
                    <i class="fa-solid fa-lock"></i> 256-bit SSL Secured &nbsp;|&nbsp;
                    <i class="fa-solid fa-shield-check"></i> PCI DSS Compliant
                </div>
            </div>
        </div>

        <!-- Success Screen -->
        <div id="paySuccess">
            <div class="success-check"><i class="fa-solid fa-check"></i></div>
            <h2 style="color:var(--text-primary);margin-bottom:8px;" id="successTitle">Payment Successful!</h2>
            <p style="color:var(--text-secondary);margin-bottom:20px;" id="successMsg">Your order has been confirmed.</p>
            <div style="background:var(--bg-color);border-radius:14px;padding:16px;text-align:left;margin-bottom:20px;" id="successDetails"></div>
            <button class="pm-pay-btn" onclick="window.location.href='orders.html'">
                <i class="fa-solid fa-box"></i> View Orders & Download Invoice
            </button>
        </div>
    </div>
    `;

    document.body.appendChild(overlay);
    window._currentOrder   = order;
    window._currentCart    = cart;
    window._currentTotals  = totals;
    window._razorpayOrderId = orderId;  // The actual ID set in DB
}

window.closePayModal = () => {
    document.getElementById('payModalOverlay')?.remove();
};

window.switchTab = (tab, el) => {
    document.querySelectorAll('.pm-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.pm-panel').forEach(p => p.classList.remove('active'));
    el.classList.add('active');
    document.getElementById('panel-' + tab)?.classList.add('active');
};

window.selectUpiApp = (el, app) => {
    document.querySelectorAll('.upi-app').forEach(u => u.classList.remove('selected'));
    el.classList.add('selected');
    const upiField = document.getElementById('upiId');
    if (upiField && !upiField.value) upiField.placeholder = `yourname@${app.toLowerCase()}`;
};

window.selectBank = (el, bank) => {
    document.querySelectorAll('.net-bank').forEach(b => b.classList.remove('selected'));
    el.classList.add('selected');
};

window.formatCard = (el) => {
    let v = el.value.replace(/\D/g,'').substring(0,16);
    el.value = v.replace(/(.{4})/g,'$1 ').trim();
};

window.formatExpiry = (el) => {
    let v = el.value.replace(/\D/g,'');
    if (v.length >= 2) v = v.substring(0,2) + '/' + v.substring(2,4);
    el.value = v;
};

window.processPayment = async (method) => {
    const btnId = { upi:'payBtnUpi', card:'payBtnCard', netbanking:'payBtnNet', cod:'payBtnCod' }[method];
    const btn   = document.getElementById(btnId);
    const order = window._currentOrder;
    const cart  = window._currentCart;
    const totals= window._currentTotals;

    // Basic validation
    if (method === 'upi') {
        const upiVal = document.getElementById('upiId')?.value.trim();
        const selected = document.querySelector('.upi-app.selected');
        if (!upiVal && !selected) { Utils.showToast('Select UPI app or enter UPI ID', 'info'); return; }
    }
    if (method === 'card') {
        const num = document.getElementById('cardNum')?.value.replace(/\s/g,'');
        const cvv = document.getElementById('cardCvv')?.value;
        if (num?.length < 16) { Utils.showToast('Enter valid 16-digit card number', 'info'); return; }
        if (cvv?.length < 3)  { Utils.showToast('Enter valid CVV', 'info'); return; }
    }

    if (btn) { btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...'; btn.disabled = true; }

    // Simulate payment processing delay
    await new Promise(r => setTimeout(r, 1800));

    try {
        const paymentId = `pay_${method}_${Date.now()}`;
        const verifyRes = await fetch('/api/payments/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                razorpay_order_id:   window._razorpayOrderId || `order_mock_${order.id}`,
                razorpay_payment_id: paymentId,
                razorpay_signature:  'verified_' + method
            })
        });

        if (!verifyRes.ok) throw new Error('Verification failed');

        // Clear cart & add coins
        Utils.clearCart();
        Utils.addCoins(totals.grandTotal);
        if (window.updateNavCartCount) window.updateNavCartCount();

        // Show success screen
        showSuccess(order, method, totals, paymentId);

    } catch (e) {
        Utils.showToast('Payment failed: ' + e.message, 'error');
        if (btn) { btn.innerHTML = 'Retry'; btn.disabled = false; }
    }
};

function showSuccess(order, method, totals, paymentId) {
    document.getElementById('payMainContent').style.display = 'none';
    const succ = document.getElementById('paySuccess');
    succ.style.display = 'block';

    const methodLabels = { upi:'UPI Payment', card:'Card Payment', netbanking:'Net Banking', cod:'Cash on Delivery' };
    const methodIcons  = { upi:'fa-mobile-screen', card:'fa-credit-card', netbanking:'fa-building-columns', cod:'fa-truck' };

    document.getElementById('successTitle').textContent =
        method === 'cod' ? 'Order Placed Successfully!' : 'Payment Successful!';
    document.getElementById('successMsg').textContent =
        method === 'cod'
            ? 'Your COD order is confirmed. Pay when it arrives!'
            : 'Your order has been confirmed. Thank you!';

    document.getElementById('successDetails').innerHTML = `
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border-color);">
            <span style="color:var(--text-secondary);font-size:0.85rem;">Order ID</span>
            <span style="font-weight:700;">#ORD-${order.id}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border-color);">
            <span style="color:var(--text-secondary);font-size:0.85rem;">Payment Method</span>
            <span style="font-weight:700;"><i class="fa-solid ${methodIcons[method]}" style="margin-right:4px;color:var(--primary-color);"></i>${methodLabels[method]}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border-color);">
            <span style="color:var(--text-secondary);font-size:0.85rem;">Amount Paid</span>
            <span style="font-weight:800;color:var(--primary-color);">${Utils.formatCurrency(totals.grandTotal)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:8px 0;">
            <span style="color:var(--text-secondary);font-size:0.85rem;">Farm Coins Earned</span>
            <span style="font-weight:700;color:#d97706;">+${Math.floor(totals.grandTotal*0.1)} Coins</span>
        </div>
    `;
}

function calculateTotal(cart) {
    const subtotal   = cart.reduce((s, i) => s + i.price * i.quantity, 0);
    const shipping   = subtotal >= 500 ? 0 : 40;
    const tax        = Math.round(subtotal * 0.08);
    const grandTotal = subtotal + shipping + tax;
    return { subtotal, shipping, tax, grandTotal };
}

function renderOrderSummary(cart) {
    const list = document.getElementById('checkoutItemsList');
    if (!list) return;
    list.innerHTML = cart.map(item => `
        <div class="order-item">
            <img src="${item.image||''}" alt="${item.title}"
                 onerror="this.src='https://images.unsplash.com/photo-1543362906-acfc16c67564?w=100'">
            <div class="order-item-info">
                <div class="order-item-name">${item.title}</div>
                <div class="order-item-meta">Qty: ${item.quantity} × ${Utils.formatCurrency(item.price)}</div>
            </div>
            <div class="order-item-price">${Utils.formatCurrency(item.price * item.quantity)}</div>
        </div>`).join('');

    const t = calculateTotal(cart);
    const se = id => document.getElementById(id);
    if (se('chkSubtotal')) se('chkSubtotal').textContent = Utils.formatCurrency(t.subtotal);
    if (se('chkShipping')) se('chkShipping').innerHTML   = t.shipping === 0
        ? '<span class="free-shipping-badge">FREE</span>'
        : `<span style="color:var(--danger);font-weight:700;">${Utils.formatCurrency(t.shipping)}</span>`;
    if (se('chkTax'))      se('chkTax').textContent      = Utils.formatCurrency(t.tax);
    if (se('chkGrandTotal')) se('chkGrandTotal').textContent = Utils.formatCurrency(t.grandTotal);
}
