// Global state management
const AppState = {
    currentTab: 'submit',
    githubToken: null,
    githubUser: null,
    repositories: [],
    analyses: [],
    selectedRepo: null,
    isAuthenticated: false
};

// API Configuration
const API_CONFIG = {
    baseURL: 'http://localhost:8000/api',
    github: {
        clientId: 'your_github_client_id', // Replace with actual client ID
        scope: 'repo,read:user',
        apiUrl: 'https://api.github.com'
    }
};

// GitHub API helper
class GitHubAPI {
    constructor(token) {
        this.token = token;
        this.baseURL = API_CONFIG.github.apiUrl;
    }

    async request(endpoint, options = {}) {
        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                ...options,
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Accept': 'application/vnd.github+json',
                    'X-GitHub-Api-Version': '2022-11-28',
                    ...options.headers
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`GitHub API error (${response.status}): ${errorData.message || response.statusText}`);
            }

            return response.json();
        } catch (error) {
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('Network error: Unable to connect to GitHub API. Please check your internet connection.');
            }
            throw error;
        }
    }

    async validateToken() {
        try {
            const user = await this.request('/user');
            return { valid: true, user };
        } catch (error) {
            return { valid: false, error: error.message };
        }
    }

    async getUserRepos(page = 1, perPage = 100) {
        const params = new URLSearchParams({
            sort: 'updated',
            direction: 'desc',
            per_page: perPage.toString(),
            page: page.toString(),
            type: 'all' // Include all repos (owner, collaborator, organization_member)
        });
        
        return this.request(`/user/repos?${params}`);
    }

    async getRepoBranches(owner, repo) {
        return this.request(`/repos/${owner}/${repo}/branches`);
    }

    async getUser() {
        return this.request('/user');
    }

    async getRateLimit() {
        return this.request('/rate_limit');
    }
}

// RepoIQ API helper
class RepoIQAPI {
    constructor(baseURL) {
        this.baseURL = baseURL;
    }

    async request(endpoint, options = {}) {
        const response = await fetch(`${this.baseURL}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(error.message || `HTTP ${response.status}`);
        }

        if (response.status === 204) {
            return null;
        }

        return response.json();
    }

    async createRepository(data) {
        return this.request('/repositories', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async listRepositories() {
        return this.request('/repositories');
    }

    async createAnalysis(repositoryId, data) {
        return this.request(`/repositories/${repositoryId}/analyses`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async listAnalyses(repositoryId) {
        return this.request(`/repositories/${repositoryId}/analyses`);
    }

    async getAnalysisStatus(repositoryId, analysisId) {
        return this.request(`/repositories/${repositoryId}/analyses/${analysisId}/status`);
    }

    async getAnalysisResults(repositoryId, analysisId, options = {}) {
        const params = new URLSearchParams();
        if (options.limit) params.append('limit', options.limit);
        if (options.offset) params.append('offset', options.offset);
        if (options.severity) params.append('severity', options.severity);
        
        const query = params.toString() ? `?${params.toString()}` : '';
        return this.request(`/repositories/${repositoryId}/analyses/${analysisId}/results${query}`);
    }
}

// Initialize API instances
const repoIQAPI = new RepoIQAPI(API_CONFIG.baseURL);
let githubAPI = null;

// DOM Elements
const elements = {
    navLinks: document.querySelectorAll('.nav-link'),
    tabContents: document.querySelectorAll('.tab-content'),
    githubConnectBtn: document.getElementById('github-connect'),
    authStatus: document.getElementById('auth-status'),
    repoSelection: document.getElementById('repo-selection'),
    repoSelect: document.getElementById('repo-select'),
    analysisForm: document.getElementById('analysis-form'),
    runsList: document.getElementById('runs-list'),
    refreshStatusBtn: document.getElementById('refresh-status'),
    statusFilter: document.getElementById('status-filter'),
    archiveList: document.getElementById('archive-list'),
    searchArchiveBtn: document.getElementById('search-archive'),
    analyticsRepo: document.getElementById('analytics-repo'),
    analyticsPeriod: document.getElementById('analytics-period'),
    backToStatusBtn: document.getElementById('back-to-status'),
    resultsDetail: document.getElementById('results-detail'),
    resultsContent: document.getElementById('results-content'),
    runningJobsCount: document.getElementById('running-jobs'),
    totalAnalysesCount: document.getElementById('total-analyses'),
    // Sub-tab elements
    subTabBtns: document.querySelectorAll('.sub-tab-btn'),
    subTabContents: document.querySelectorAll('.sub-tab-content'),
    runningJobsList: document.getElementById('running-jobs-list'),
    pastJobsList: document.getElementById('past-jobs-list'),
    refreshRunningBtn: document.getElementById('refresh-running'),
    refreshPastBtn: document.getElementById('refresh-past'),
    pastStatusFilter: document.getElementById('past-status-filter'),
    // New page control elements
    runsRepoSelect: document.getElementById('runs-repo-select'),
    runsTimePeriod: document.getElementById('runs-time-period'),
    archiveRepoSelect: document.getElementById('archive-repo-select'),
    archiveDateFrom: document.getElementById('archive-date-from'),
    archiveDateTo: document.getElementById('archive-date-to'),
    loggedUser: document.getElementById('logged-user')
};

// Check login status and redirect if not logged in
function checkLoginStatus() {
    const loginData = sessionStorage.getItem('repoIQ_login');
    
    if (!loginData) {
        // Not logged in, redirect to login page
        window.location.href = 'index.html';
        return false;
    }
    
    try {
        const data = JSON.parse(loginData);
        // Update user info in header
        if (elements.loggedUser) {
            elements.loggedUser.textContent = data.username;
        }
        return true;
    } catch (error) {
        // Invalid login data, clear it and redirect
        sessionStorage.removeItem('repoIQ_login');
        window.location.href = 'index.html';
        return false;
    }
}

// Logout function
function logout() {
    sessionStorage.removeItem('repoIQ_login');
    window.location.href = 'index.html';
}

// Settings function
function openSettings() {
    // Close dropdown first
    toggleUserDropdown(false);
    
    // Show settings modal or redirect to settings page
    showNotification('Settings feature coming soon!', 'info');
}

// User dropdown functionality
function toggleUserDropdown(show = null) {
    const dropdown = document.querySelector('.user-dropdown');
    if (!dropdown) return;
    
    if (show === null) {
        dropdown.classList.toggle('active');
    } else if (show) {
        dropdown.classList.add('active');
    } else {
        dropdown.classList.remove('active');
    }
}

// Close dropdown when clicking outside
function handleClickOutside(event) {
    const dropdown = document.querySelector('.user-dropdown');
    const userMenuBtn = document.getElementById('user-menu-btn');
    
    if (dropdown && !dropdown.contains(event.target)) {
        dropdown.classList.remove('active');
    }
}

// Tab Navigation
function switchTab(tabName) {
    // Update navigation
    elements.navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.dataset.tab === tabName) {
            link.classList.add('active');
        }
    });

    // Update content
    elements.tabContents.forEach(content => {
        content.classList.remove('active');
        if (content.id === `${tabName}-tab`) {
            content.classList.add('active');
        }
    });

    AppState.currentTab = tabName;

    // Load tab-specific data
    switch (tabName) {
        case 'status':
            switchSubTab('running'); // Default to running jobs
            break;
        case 'archive':
            loadArchivedRuns();
            break;
        case 'analytics':
            loadAnalytics();
            break;
    }
}

// Sub-tab Navigation
function switchSubTab(subTabName) {
    // Update sub-tab buttons
    elements.subTabBtns.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.subtab === subTabName) {
            btn.classList.add('active');
        }
    });

    // Update sub-tab content
    elements.subTabContents.forEach(content => {
        content.classList.remove('active');
        if (content.id === `${subTabName}-subtab`) {
            content.classList.add('active');
        }
    });

    // Load sub-tab specific data
    switch (subTabName) {
        case 'running':
            loadRunningJobs();
            break;
        case 'past':
            loadPastJobs();
            break;
        case 'runs-analytics':
            loadRunsAnalytics();
            break;
    }
}

// GitHub Authentication
async function connectToGitHub() {
    try {
        // Show loading state
        const btn = elements.githubConnectBtn;
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connecting...';
        btn.disabled = true;

        // For demo purposes, we'll use a simple token input
        // In production, use OAuth flow
        const token = prompt(`Enter your GitHub Personal Access Token:

To create a token:
1. Go to GitHub Settings > Developer settings > Personal access tokens
2. Click "Generate new token (classic)"
3. Select scopes: repo, read:user
4. Copy the generated token

Enter token:`);
        
        if (!token) {
            btn.innerHTML = originalText;
            btn.disabled = false;
            return;
        }

        githubAPI = new GitHubAPI(token);
        
        // Validate the token and get user info
        const validation = await githubAPI.validateToken();
        
        if (!validation.valid) {
            throw new Error(validation.error);
        }
        
        AppState.githubToken = token;
        AppState.isAuthenticated = true;
        AppState.githubUser = validation.user;
        
        updateAuthStatus(true, validation.user);
        await loadUserRepositories();
        
        showNotification(`Successfully connected as ${validation.user.login}!`, 'success');
        
    } catch (error) {
        console.error('GitHub authentication failed:', error);
        showNotification(`GitHub authentication failed: ${error.message}`, 'error');
        updateAuthStatus(false);
        
        // Reset button state
        const btn = elements.githubConnectBtn;
        btn.innerHTML = '<i class="fab fa-github"></i> Connect to GitHub';
        btn.disabled = false;
    }
}

function updateAuthStatus(connected, user = null) {
    const status = elements.authStatus;
    const btn = elements.githubConnectBtn;
    
    if (connected && user) {
        status.innerHTML = `
            <span>Connected as <strong>${user.login}</strong></span>
            <button class="btn-disconnect" onclick="disconnectGitHub()" title="Disconnect">
                <i class="fas fa-times"></i>
            </button>
        `;
        status.className = 'auth-status connected';
        btn.innerHTML = '<i class="fas fa-check"></i> Connected';
        btn.disabled = true;
        elements.repoSelection.style.display = 'block';
    } else {
        status.textContent = 'Not connected';
        status.className = 'auth-status disconnected';
        btn.innerHTML = '<i class="fab fa-github"></i> Connect to GitHub';
        btn.disabled = false;
        elements.repoSelection.style.display = 'none';
    }
}

// Disconnect from GitHub
function disconnectGitHub() {
    AppState.githubToken = null;
    AppState.githubUser = null;
    AppState.repositories = [];
    AppState.isAuthenticated = false;
    githubAPI = null;
    
    updateAuthStatus(false);
    
    // Clear repository selectors
    const selectors = [
        elements.repoSelect,
        elements.analyticsRepo,
        elements.runsRepoSelect,
        elements.archiveRepoSelect
    ];
    
    selectors.forEach(selector => {
        if (selector) {
            if (selector === elements.repoSelect) {
                selector.innerHTML = '<option value="">Choose a repository...</option>';
            } else {
                selector.innerHTML = '<option value="">All Repositories</option>';
            }
        }
    });
    
    showNotification('Disconnected from GitHub', 'info');
}

// Load user repositories from GitHub
async function loadUserRepositories() {
    try {
        showNotification('Loading repositories...', 'info');
        
        // Get rate limit info
        const rateLimit = await githubAPI.getRateLimit();
        console.log('GitHub API Rate Limit:', rateLimit);
        
        let allRepos = [];
        let page = 1;
        const perPage = 100;
        
        // Fetch all repositories (GitHub paginates at 100 per page)
        while (true) {
            const repos = await githubAPI.getUserRepos(page, perPage);
            allRepos = allRepos.concat(repos);
            
            // If we got less than perPage results, we've reached the end
            if (repos.length < perPage) {
                break;
            }
            page++;
            
            // Safety check to prevent infinite loops
            if (page > 10) {
                console.warn('Stopped fetching repositories after 10 pages (1000 repos)');
                break;
            }
        }
        
        AppState.repositories = allRepos;
        
        // Sort repositories by last updated (most recent first)
        allRepos.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
        
        const select = elements.repoSelect;
        select.innerHTML = '<option value="">Choose a repository...</option>';
        
        allRepos.forEach(repo => {
            const option = document.createElement('option');
            option.value = repo.clone_url;
            option.textContent = `${repo.full_name} (${repo.private ? 'Private' : 'Public'}) - ${repo.language || 'No language'}`;
            option.dataset.repoData = JSON.stringify(repo);
            select.appendChild(option);
        });
        
        // Populate all repository selectors
        const repoSelectors = [
            elements.analyticsRepo,
            elements.runsRepoSelect,
            elements.archiveRepoSelect
        ];
        
        repoSelectors.forEach(selector => {
            if (selector) {
                selector.innerHTML = '<option value="">All Repositories</option>';
                allRepos.forEach(repo => {
                    const option = document.createElement('option');
                    option.value = repo.full_name;
                    option.textContent = `${repo.full_name} (${repo.language || 'No language'})`;
                    selector.appendChild(option);
                });
            }
        });
        
        showNotification(`Loaded ${allRepos.length} repositories successfully!`, 'success');
        
    } catch (error) {
        console.error('Failed to load repositories:', error);
        showNotification(`Failed to load repositories: ${error.message}`, 'error');
    }
}

// Placeholder functions for the rest of the functionality
async function submitAnalysis(formData) {
    showNotification('Analysis submission feature coming soon!', 'info');
}

async function loadRunningJobs() {
    if (elements.runningJobsList) {
        elements.runningJobsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <p>No running jobs</p>
            </div>
        `;
    }
}

async function loadPastJobs() {
    if (elements.pastJobsList) {
        elements.pastJobsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <p>No past jobs</p>
            </div>
        `;
    }
}

async function loadRunsAnalytics() {
    // Update metrics with placeholder data
    const metrics = {
        'runs-metric-running': '0',
        'runs-metric-completed': '0',
        'runs-metric-failed': '0',
        'runs-metric-success': '0%'
    };
    
    Object.entries(metrics).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    });
}

async function loadArchivedRuns() {
    if (elements.archiveList) {
        elements.archiveList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-archive"></i>
                <p>No archived runs</p>
            </div>
        `;
    }
}

async function loadAnalytics() {
    // Update metrics with placeholder data
    const metrics = {
        'metric-runs': '0',
        'metric-tokens': '0',
        'metric-cost': '$0.00',
        'metric-issues': '0'
    };
    
    Object.entries(metrics).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    });
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="${type}-message">
            <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'exclamation-triangle' : 'info'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Remove after 5 seconds
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    if (!checkLoginStatus()) {
        return; // Will redirect to login page
    }
    
    // Navigation
    elements.navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const tabName = link.dataset.tab;
            switchTab(tabName);
        });
    });
    
    // GitHub connection
    if (elements.githubConnectBtn) {
        elements.githubConnectBtn.addEventListener('click', connectToGitHub);
    }
    
    // Form submission
    if (elements.analysisForm) {
        elements.analysisForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            await submitAnalysis(formData);
        });
    }
    
    // Sub-tab navigation
    elements.subTabBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const subTabName = btn.dataset.subtab;
            switchSubTab(subTabName);
        });
    });
    
    // Additional refresh buttons
    if (elements.refreshRunningBtn) {
        elements.refreshRunningBtn.addEventListener('click', loadRunningJobs);
    }
    if (elements.refreshPastBtn) {
        elements.refreshPastBtn.addEventListener('click', loadPastJobs);
    }
    
    // Initialize with default tab
    switchTab('submit');
    
    // User dropdown functionality
    const userMenuBtn = document.getElementById('user-menu-btn');
    if (userMenuBtn) {
        userMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleUserDropdown();
        });
    }
    
    // Close dropdown when clicking outside
    document.addEventListener('click', handleClickOutside);
});

// Export for global access
window.logout = logout;
window.openSettings = openSettings;
window.switchTab = switchTab;
window.switchSubTab = switchSubTab;
window.disconnectGitHub = disconnectGitHub;