/**
 * AUTH.JS — v2.0
 * Login, Signup, and Amazon-style Guest→User cart merge on login.
 */

document.addEventListener('DOMContentLoaded', () => {

    // ── SIGNUP ──
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = signupForm.querySelector('button[type="submit"]');
            setBtnLoading(btn, true, 'Processing...');

            const name     = document.getElementById('signupName')?.value.trim() || '';
            const email    = document.getElementById('signupEmail')?.value.trim().toLowerCase() || '';
            const password = document.getElementById('signupPassword')?.value || '';
            const role     = document.getElementById('signupRole')?.value.toUpperCase() || 'BUYER';

            try {
                const res = await fetch('/api/auth/signup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password, role })
                });

                if (!res.ok) {
                    showError(await res.text() || 'Signup failed.');
                    setBtnLoading(btn, false, 'Sign Up');
                    return;
                }

                const data = await res.json();
                saveSessionAndMergeCart(data.user);
                window.location.href = 'products.html'; // new user → shop!

            } catch (err) {
                showError('Could not connect to server. Is the backend running?');
                setBtnLoading(btn, false, 'Sign Up');
            }
        });
    }

    // ── LOGIN ──
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = loginForm.querySelector('button[type="submit"]');
            setBtnLoading(btn, true, 'Signing in...');

            const email    = document.getElementById('loginEmail')?.value.trim().toLowerCase() || '';
            const password = document.getElementById('loginPassword')?.value || '';

            try {
                const res = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                if (!res.ok) {
                    showError(await res.text() || 'Invalid email or password.');
                    setBtnLoading(btn, false, 'Login');
                    return;
                }

                const data = await res.json();
                saveSessionAndMergeCart(data.user);

                // Redirect: if cart has items → go to cart, else dashboard
                const cartKey  = `fc_cart_${data.user.id}`;
                const userCart = JSON.parse(localStorage.getItem(cartKey) || '[]');
                window.location.href = userCart.length > 0 ? 'cart.html' : 'dashboard.html';

            } catch (err) {
                showError('Could not connect to server. Is the backend running?');
                setBtnLoading(btn, false, 'Login');
            }
        });
    }

    // ──────────────────────────────────────────────────
    // AMAZON-STYLE CART MERGE: guest cart → user cart
    // ──────────────────────────────────────────────────
    function saveSessionAndMergeCart(user) {
        // 1. Save session
        Utils.setStorage('fc_session', {
            isLoggedIn: true,
            user: { id: user.id, name: user.name, email: user.email, role: user.role }
        });

        // 2. Read guest cart (items added before login)
        const guestKey  = 'fc_cart_guest';
        const userKey   = `fc_cart_${user.id}`;
        const guestCart = JSON.parse(localStorage.getItem(guestKey)  || '[]');
        const userCart  = JSON.parse(localStorage.getItem(userKey)   || '[]');

        if (guestCart.length === 0) return; // nothing to merge

        // 3. Merge: add guest items into user cart
        const mergedCart = [...userCart];
        guestCart.forEach(gItem => {
            const idx = mergedCart.findIndex(u => String(u.id) === String(gItem.id));
            if (idx > -1) {
                // Item already in user cart → add quantity
                mergedCart[idx].quantity += gItem.quantity;
            } else {
                // New item → push
                mergedCart.push(gItem);
            }
        });

        // 4. Save merged cart to user key, clear guest key
        localStorage.setItem(userKey,  JSON.stringify(mergedCart));
        localStorage.removeItem(guestKey);

        Utils.logAction('Cart Merged', {
            guestItems: guestCart.length,
            userItems:  userCart.length,
            merged:     mergedCart.length
        });
    }

    // ── Helpers ──
    function setBtnLoading(btn, loading, text) {
        if (!btn) return;
        btn.disabled  = loading;
        btn.innerHTML = loading
            ? `<i class="fa-solid fa-spinner fa-spin"></i> ${text}`
            : text;
    }

    function showError(msg) {
        let box = document.getElementById('errorBox');
        if (!box) {
            box = document.createElement('div');
            box.id = 'errorBox';
            box.style.cssText = 'color:var(--danger);margin-top:15px;text-align:center;font-weight:600;font-size:0.9rem;';
            const container = document.querySelector('.auth-container') || document.body;
            container.appendChild(box);
        }
        box.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> ${msg}`;
        box.style.display = 'block';
    }
});
