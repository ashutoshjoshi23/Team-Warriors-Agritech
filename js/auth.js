/**
 * AUTH.JS
 * Requires utils.js. Handles login and registration routing, error display, 
 * and toggling the role selector on the signup page.
 */

document.addEventListener('DOMContentLoaded', () => {

    const session = Utils.getStorage('fc_session');

    // Signup Submission
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = signupForm.querySelector('button[type="submit"]');
            if(btn) {
                btn.disabled = true;
                btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';
            }
            
            const name = document.getElementById('signupName') ? document.getElementById('signupName').value.trim() : '';
            const email = document.getElementById('signupEmail') ? document.getElementById('signupEmail').value.trim().toLowerCase() : '';
            const password = document.getElementById('signupPassword') ? document.getElementById('signupPassword').value : '';
            const roleSelect = document.getElementById('signupRole');
            const selectedRole = roleSelect ? roleSelect.value.toUpperCase() : 'BUYER';
            
            try {
                const response = await fetch('http://localhost:8090/api/auth/signup', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ name, email, password, role: selectedRole })
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    showError(errorText || "Signup failed.");
                    if(btn) {
                        btn.disabled = false;
                        btn.textContent = 'Sign Up';
                    }
                    return;
                }

                const data = await response.json();
                const newUser = data.user;
                
                Utils.logAction('User Registered', { role: selectedRole, email });
                Utils.setStorage('fc_session', { isLoggedIn: true, user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role } });
                
                window.location.href = 'dashboard.html';
            } catch (error) {
                console.error('Error during signup:', error);
                showError("Could not connect to the server. Is the backend running?");
                if(btn) {
                    btn.disabled = false;
                    btn.textContent = 'Sign Up';
                }
            }
        });
    }

    // Login Submission
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = loginForm.querySelector('button[type="submit"]');
            if(btn) {
                btn.disabled = true;
                btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Authenticating...';
            }
            
            const email = document.getElementById('loginEmail') ? document.getElementById('loginEmail').value.trim().toLowerCase() : '';
            const password = document.getElementById('loginPassword') ? document.getElementById('loginPassword').value : '';
            
            try {
                const response = await fetch('http://localhost:8090/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password })
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    showError(errorText || "Invalid email or password.");
                    if(btn){
                        btn.disabled = false;
                        btn.textContent = 'Login';
                    }
                    return;
                }

                const data = await response.json();
                const validUser = data.user;
                
                Utils.logAction('User Logged In', { role: validUser.role, email });
                Utils.setStorage('fc_session', { isLoggedIn: true, user: { id: validUser.id, name: validUser.name, email: validUser.email, role: validUser.role } });
                
                window.location.href = 'dashboard.html';
            } catch (error) {
                console.error('Error during login:', error);
                showError("Could not connect to the server. Is the backend running?");
                if(btn){
                    btn.disabled = false;
                    btn.textContent = 'Login';
                }
            }
        });
    }

    function showError(msg) {
        const errBox = document.getElementById('errorBox') || document.createElement('div');
        if(errBox.id !== 'errorBox') {
            errBox.id = 'errorBox';
            errBox.style.color = 'var(--danger)';
            errBox.style.marginTop = '15px';
            errBox.style.textAlign = 'center';
            if(document.querySelector('.auth-container')) document.querySelector('.auth-container').appendChild(errBox);
        }
        errBox.textContent = msg;
        errBox.style.display = 'block';
    }
});
