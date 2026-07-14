document.addEventListener('DOMContentLoaded', async () => {
    const loginBox = document.getElementById('login');
    const loginText = document.querySelector('.login-text');
    const loginLink = document.getElementById('login-link');

    if (!loginBox || !loginText) return;

    document.addEventListener('click', (event) => {
        if (!loginBox.contains(event.target)) {
            loginBox.classList.remove('account-menu-open');
        }
    });

    function clearLogoutButton() {
        const oldButton = document.getElementById('logout-btn');
        if (oldButton) oldButton.remove();
        loginBox.classList.remove('account-menu-open');
    }

    function showSignedOutState() {
        clearLogoutButton();
        loginBox.classList.remove('signed-in');
        loginText.textContent = 'Sign in';
        loginBox.title = 'Sign in';
        if (loginLink) loginLink.setAttribute('href', 'loginform.html');
        loginBox.onclick = () => {
            window.location.href = 'loginform.html';
        };
    }

    function showSignedInState(user) {
        clearLogoutButton();
        loginBox.classList.add('signed-in');
        loginText.textContent = user.username;
        loginBox.title = user.email || user.username;
        loginBox.onclick = (event) => {
            event.preventDefault();
            loginBox.classList.toggle('account-menu-open');
        };
        if (loginLink) loginLink.removeAttribute('href');

        const logoutButton = document.createElement('button');
        logoutButton.id = 'logout-btn';
        logoutButton.type = 'button';
        logoutButton.textContent = 'Logout';
        logoutButton.addEventListener('click', async (event) => {
            event.preventDefault();
            event.stopPropagation();
            try {
                const response = await fetch('/api/auth/logout/', { method: 'POST' });
                const result = await response.json();
                if (response.ok && result.success) {
                    showSignedOutState();
                    window.location.href = 'loginform.html';
                    return;
                }
                alert(result.message || 'Logout failed.');
            } catch (error) {
                console.error('Logout failed:', error);
                alert('Logout failed. Please try again.');
            }
        });
        loginBox.appendChild(logoutButton);
    }

    try {
        const response = await fetch('/api/auth/me/');
        const result = await response.json();

        if (result.authenticated && result.user) {
            showSignedInState(result.user);
            return;
        }
    } catch (error) {
        console.error('Auth status check failed:', error);
    }

    showSignedOutState();
});
