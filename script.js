// Simple login functionality for repoIQ
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form');
    const submitButton = loginForm.querySelector('button[type="submit"]');
    
    // Handle form submission
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form data
        const formData = new FormData(loginForm);
        const username = formData.get('username');
        const password = formData.get('password');
        const token = formData.get('token');
        
        // Validate required fields
        if (!username || !password) {
            showMessage('Please enter both username and password', 'error');
            return;
        }
        
        // Show loading state
        setLoadingState(true);
        
        // Simulate login process (for now, accept any credentials)
        setTimeout(() => {
            // Store login data (in a real app, this would be handled securely)
            const loginData = {
                username: username,
                timestamp: new Date().toISOString(),
                token: token || null
            };
            
            // Store in sessionStorage for this session
            sessionStorage.setItem('repoIQ_login', JSON.stringify(loginData));
            
            // Show success message
            showMessage(`Welcome, ${username}! Redirecting...`, 'success');
            
            // Redirect to the portal page
            setTimeout(() => {
                window.location.href = 'portal.html';
            }, 1500);
            
        }, 1000); // Simulate network delay
    });
    
    // No need to check login status on login page
    
    function setLoadingState(loading) {
        if (loading) {
            submitButton.disabled = true;
            submitButton.classList.add('loading');
            submitButton.innerHTML = '<i class="fas fa-spinner"></i> Signing In...';
        } else {
            submitButton.disabled = false;
            submitButton.classList.remove('loading');
            submitButton.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In';
        }
    }
    
    function showMessage(text, type) {
        // Remove existing messages
        const existingMessages = document.querySelectorAll('.message');
        existingMessages.forEach(msg => msg.remove());
        
        // Create new message
        const message = document.createElement('div');
        message.className = `message ${type}`;
        message.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-triangle'}"></i>
            <span>${text}</span>
        `;
        
        // Insert before form
        loginForm.parentNode.insertBefore(message, loginForm);
        
        // Auto-remove error messages after 5 seconds
        if (type === 'error') {
            setTimeout(() => {
                if (message.parentNode) {
                    message.remove();
                }
            }, 5000);
        }
    }
    
    function checkLoginStatus() {
        const loginData = sessionStorage.getItem('repoIQ_login');
        
        if (loginData) {
            try {
                const data = JSON.parse(loginData);
                // If user is already logged in, redirect to portal
                window.location.href = 'portal.html';
            } catch (error) {
                // Invalid login data, clear it
                sessionStorage.removeItem('repoIQ_login');
            }
        }
    }
    
    // Check if user is already logged in when page loads
    checkLoginStatus();
    
    // Global logout function
    window.logout = function() {
        sessionStorage.removeItem('repoIQ_login');
        window.location.reload();
    };
});
