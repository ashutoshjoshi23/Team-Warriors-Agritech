document.addEventListener('DOMContentLoaded', () => {
    // 1. Session Auth Check
    const session = Utils.getStorage('fc_session');
    if (!session || !session.isLoggedIn) {
        Utils.showToast('Please log in to checkout!', 'info');
        setTimeout(() => window.location.href = 'login.html', 1500);
        return;
    }

    // Pre-fill user data
    const nameInput = document.getElementById('chkName');
    if (nameInput) nameInput.value = session.user.name;

    // 2. Load Cart Data
    const cart = Utils.getStorage('fc_cart', []);
    if (cart.length === 0) {
        window.location.href = 'cart.html';
        return;
    }

    renderOrderSummary(cart);

    // 3. Handle Submission
    const checkoutForm = document.getElementById('checkoutForm');
    if(checkoutForm) {
        checkoutForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const btn = document.getElementById('placeOrderBtn');
            const originalBtnText = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Initializing Payment...';
            btn.disabled = true;

            const totals = calculateTotal(cart);

            try {
                // Step 1: Create Order in Backend
                const orderData = {
                    buyer: { id: session.user.id },
                    totalAmount: totals.grandTotal,
                    status: 'PENDING_PAYMENT',
                    items: cart.map(item => ({
                        product: { id: item.id },
                        quantity: item.quantity,
                        price: item.price
                    }))
                };

                const orderResponse = await fetch('http://localhost:8090/api/orders', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(orderData)
                });

                if (!orderResponse.ok) throw new Error('Failed to create order');
                const savedOrder = await orderResponse.json();

                // Step 2: Create Razorpay Order
                const razorpayOrderResponse = await fetch(`http://localhost:8090/api/payments/create-order/${savedOrder.id}`, {
                    method: 'POST'
                });

                if (!razorpayOrderResponse.ok) throw new Error('Failed to create Razorpay order');
                const razorpayOrder = await razorpayOrderResponse.json();

                // Step 3: Open Razorpay Checkout
                const options = {
                    "key": "rzp_test_placeholder", 
                    "amount": razorpayOrder.amount,
                    "currency": "INR",
                    "name": "Farmer Marketplace",
                    "description": "Purchase Fresh Produce",
                    "order_id": razorpayOrder.id,
                    "handler": async function (response) {
                        // Step 4: Verify Payment
                        const verifyResponse = await fetch('http://localhost:8090/api/payments/verify-payment', {
                            method: 'POST',
                            headers: { 
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature
                            })
                        });

                        if (verifyResponse.ok) {
                            Utils.setStorage('fc_cart', []);
                            Utils.showToast('Payment Successful! Order Confirmed.');
                            setTimeout(() => window.location.href = 'orders.html', 2000);
                        } else {
                            Utils.showToast('Payment verification failed. Please contact support.', 'error');
                            btn.disabled = false;
                            btn.innerHTML = originalBtnText;
                        }
                    },
                    "prefill": {
                        "name": session.user.name,
                        "email": session.user.email,
                        "contact": document.getElementById('chkPhone').value
                    },
                    "theme": {
                        "color": "#2D6A4F"
                    }
                };

                const rzp1 = new Razorpay(options);
                rzp1.open();
                
                rzp1.on('payment.failed', function (response) {
                    Utils.showToast('Payment Failed: ' + response.error.description, 'error');
                    btn.disabled = false;
                    btn.innerHTML = originalBtnText;
                });

            } catch (error) {
                console.error('Checkout Error:', error);
                Utils.showToast('Error during checkout: ' + error.message, 'error');
                btn.disabled = false;
                btn.innerHTML = originalBtnText;
            }
        });
    }
});

function calculateTotal(cart) {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = subtotal > 50 ? 0 : 5.99;
    const tax = subtotal * 0.08;
    const grandTotal = subtotal + shipping + tax;
    return { subtotal, shipping, tax, grandTotal };
}

function renderOrderSummary(cart) {
    const list = document.getElementById('checkoutItemsList');
    if (!list) return;

    list.innerHTML = '';
    cart.forEach(item => {
        const row = document.createElement('div');
        row.className = 'chk-item';
        row.innerHTML = `
            <img src="${item.image}" alt="${item.title}" class="chk-item-img">
            <div class="chk-item-details">
                <div class="chk-item-title">${item.title}</div>
                <div class="chk-item-meta">Qty: ${item.quantity} x ${Utils.formatCurrency(item.price)}</div>
            </div>
            <div style="font-weight:500; color:var(--text-main);">
                ${Utils.formatCurrency(item.price * item.quantity)}
            </div>
        `;
        list.appendChild(row);
    });

    const totals = calculateTotal(cart);
    document.getElementById('chkSubtotal').textContent = Utils.formatCurrency(totals.subtotal);
    document.getElementById('chkShipping').textContent = totals.shipping === 0 ? 'Free' : Utils.formatCurrency(totals.shipping);
    document.getElementById('chkTax').textContent = Utils.formatCurrency(totals.tax);
    document.getElementById('chkGrandTotal').textContent = Utils.formatCurrency(totals.grandTotal);
}
