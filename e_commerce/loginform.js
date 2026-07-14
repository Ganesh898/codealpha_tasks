document.addEventListener('DOMContentLoaded', () => {
    const toggleLogin = document.getElementById('toggle-login');
    const toggleSignup = document.getElementById('toggle-signup');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const loginFormElement = document.querySelector('#login-form form');
    const signupFormElement = document.querySelector('#signup-form form');
    const loginMessage = document.getElementById('auth-message-login');
    const signupMessage = document.getElementById('auth-message-signup');
    const forgotLink = document.getElementById('forgot-link');
    const forgotBox = document.getElementById('forgot-password-box');
    const recoverButton = document.getElementById('recover-button');
    const resetButton = document.getElementById('reset-button');
    const recoverMessage = document.getElementById('recover-message');
    let resetUserId = null;
    let resetCode = null;

    toggleSignup.addEventListener('click', () => {
        toggleLogin.classList.remove('active');
        toggleSignup.classList.add('active');
        loginForm.classList.remove('active');
        signupForm.classList.add('active');
    });

    toggleLogin.addEventListener('click', () => {
        toggleSignup.classList.remove('active');
        toggleLogin.classList.add('active');
        signupForm.classList.remove('active');
        loginForm.classList.add('active');
    });

    forgotLink.addEventListener('click', (event) => {
        event.preventDefault();
        forgotBox.style.display = 'block';
    });

    recoverButton.addEventListener('click', async () => {
        const identifier = document.getElementById('recover-username').value.trim();
        const response = await fetch('/api/auth/forgot-password/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: identifier })
        });
        const result = await response.json();
        recoverMessage.textContent = result.message || 'Recovery request sent';
        recoverMessage.style.color = result.success ? '#0a7a45' : '#cc0c39';
        if (result.success) {
            resetUserId = result.user_id;
            resetCode = result.reset_code;
        }
    });

    resetButton.addEventListener('click', async () => {
        const code = document.getElementById('reset-code').value.trim();
        const newPassword = document.getElementById('new-password').value;
        const response = await fetch('/api/auth/reset-password/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: resetUserId || '', reset_code: code || resetCode || '', new_password: newPassword })
        });
        const result = await response.json();
        recoverMessage.textContent = result.message || 'Password updated';
        recoverMessage.style.color = result.success ? '#0a7a45' : '#cc0c39';
    });

    loginFormElement.addEventListener('submit', async (event) => {
        event.preventDefault();
        const username = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        const response = await fetch('/api/auth/login/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const result = await response.json();
        loginMessage.textContent = result.message || 'Login complete';
        loginMessage.style.color = result.success ? '#0a7a45' : '#cc0c39';
        if (result.success) window.location.href = 'project1.html';
    });

    signupFormElement.addEventListener('submit', async (event) => {
        event.preventDefault();
        const username = document.getElementById('signup-name').value.trim();
        const email = document.getElementById('signup-email').value.trim();
        const password = document.getElementById('signup-password').value;
        const response = await fetch('/api/auth/register/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });
        const result = await response.json();
        signupMessage.textContent = result.message || 'Account created';
        signupMessage.style.color = result.success ? '#0a7a45' : '#cc0c39';
        if (result.success) window.location.href = 'project1.html';
    });
});