// =========================
// Authentication & Download Manager
// Sample Scratcher - Phase 4
// =========================

// State Management
const AppState = {
  isAuthenticated: false,
  user: null,
  token: null,
  hasLicense: false,
  downloadsToday: 0,
  downloadsRemaining: 5,
  canDownload: true,
};

// Load token from localStorage on page load
function initAuth() {
  const savedToken = localStorage.getItem('ss_auth_token');
  const savedUser = localStorage.getItem('ss_user');

  if (savedToken && savedUser) {
    AppState.token = savedToken;
    AppState.user = JSON.parse(savedUser);
    AppState.isAuthenticated = true;

    // Set default auth header for all axios requests
    axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;

    // Check session validity
    checkSession();
  }

  updateUI();
}

// Check session and download stats
async function checkSession() {
  try {
    const response = await axios.get(`/api/license/check`);

    if (response.data) {
      AppState.hasLicense = response.data.hasLicense;

      if (response.data.downloads) {
        AppState.downloadsToday = response.data.downloads.downloadsToday;
        AppState.downloadsRemaining = response.data.downloads.downloadsRemaining;
        AppState.canDownload = response.data.downloads.canDownload;
      }

      updateUI();
    }
  } catch (error) {
    console.error('Session check failed:', error);

    // If unauthorized, clear session
    if (error.response?.status === 401) {
      logout();
    }
  }
}

// Login function
async function login(email, password) {
  try {
    const response = await axios.post(`/api/auth/login`, {
      email,
      password
    });

    if (response.data.token) {
      // Save token and user
      AppState.token = response.data.token;
      AppState.user = response.data.user;
      AppState.isAuthenticated = true;
      AppState.hasLicense = response.data.user.hasLicense;

      localStorage.setItem('ss_auth_token', response.data.token);
      localStorage.setItem('ss_user', JSON.stringify(response.data.user));

      // Set default auth header
      axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;

      // Get download stats
      await checkSession();

      updateUI();
      hideAuthModal();

      return { success: true };
    }
  } catch (error) {
    console.error('Login failed:', error);
    return {
      success: false,
      error: error.response?.data?.error || 'Login failed'
    };
  }
}

// Register function
async function register(email, password, name) {
  try {
    const response = await axios.post(`/api/auth/signup`, {
      email,
      password,
      name,
      origin: 'sample-scratcher'
    });

    if (response.data.user) {
      // Auto-login after registration
      return await login(email, password);
    }
  } catch (error) {
    console.error('Registration failed:', error);
    return {
      success: false,
      error: error.response?.data?.error || 'Registration failed'
    };
  }
}

// Logout function
function logout() {
  AppState.isAuthenticated = false;
  AppState.user = null;
  AppState.token = null;
  AppState.hasLicense = false;
  AppState.downloadsToday = 0;
  AppState.downloadsRemaining = 5;
  AppState.canDownload = true;

  localStorage.removeItem('ss_auth_token');
  localStorage.removeItem('ss_user');

  delete axios.defaults.headers.common['Authorization'];

  updateUI();
}

// Check download eligibility before download
async function checkDownloadEligibility() {
  try {
    const response = await axios.get(`/api/downloads/check`);

    if (response.data) {
      AppState.downloadsToday = response.data.downloadsToday;
      AppState.downloadsRemaining = response.data.remaining;
      AppState.canDownload = response.data.allowed;
      AppState.hasLicense = response.data.isPremium;

      updateUI();

      return response.data;
    }
  } catch (error) {
    console.error('Download check failed:', error);

    if (error.response?.status === 401) {
      showAuthModal('login');
      return { allowed: false };
    }

    return { allowed: false };
  }
}

// Track download after successful generation
async function trackDownload(presetName) {
  try {
    const response = await axios.post(`/api/downloads/track`, {
      presetName
    });

    if (response.data.success) {
      AppState.downloadsRemaining = response.data.remaining;
      updateUI();
    }

    return response.data;
  } catch (error) {
    console.error('Track download failed:', error);

    // If limit exceeded, show upgrade modal
    if (error.response?.status === 403) {
      showUpgradeModal();
    }

    return { success: false };
  }
}

// =========================
// UI Functions
// =========================

// Update UI based on auth state
function updateUI() {
  const userMenu = document.getElementById('userMenu');
  const loginBtn = document.getElementById('loginBtn');
  const userInfo = document.getElementById('userInfo');
  const userName = document.getElementById('userName');
  const downloadStatus = document.getElementById('downloadStatus');
  const upgradeBtn = document.getElementById('upgradeBtn');

  if (!userMenu || !loginBtn) return; // UI not ready

  if (AppState.isAuthenticated) {
    // Hide login button, show user info
    loginBtn.style.display = 'none';
    userInfo.style.display = 'flex';
    userName.textContent = AppState.user?.name || AppState.user?.email || 'User';

    // Show/hide the upgrade button based on license
    if (AppState.hasLicense) {
      if (upgradeBtn) upgradeBtn.style.display = 'none';
      downloadStatus.innerHTML = `
        <span class="premium-badge">Unlimited</span>`;
    } else {
      if (upgradeBtn) upgradeBtn.style.display = 'inline-block';
      const remaining = AppState.downloadsRemaining;
      const color =
        remaining === 0 ? '#ef4444' :
        remaining <= 2 ? '#f59e0b' :
        '#22c55e';
      downloadStatus.innerHTML = `
        <span style="color:${color}">${remaining}/5</span> downloads today
      `;
    }
  } else {
    // Logged out
    loginBtn.style.display = 'block';
    userInfo.style.display = 'none';
    if (upgradeBtn) upgradeBtn.style.display = 'none';
  }
}

// Show auth modal
function showAuthModal(mode = 'login') {
  const modal = document.getElementById('authModal');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const loginTab = document.getElementById('loginTab');
  const registerTab = document.getElementById('registerTab');

  modal.style.display = 'flex';

  if (mode === 'login') {
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
    loginTab.classList.add('active');
    registerTab.classList.remove('active');
  } else {
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
    loginTab.classList.remove('active');
    registerTab.classList.add('active');
  }

  // Clear any previous errors
  document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
}

// Hide auth modal
function hideAuthModal() {
  const modal = document.getElementById('authModal');
  modal.style.display = 'none';

  // Clear forms
  document.getElementById('loginEmail').value = '';
  document.getElementById('loginPassword').value = '';
  document.getElementById('registerName').value = '';
  document.getElementById('registerEmail').value = '';
  document.getElementById('registerPassword').value = '';

  // Clear errors
  document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
}

// Show upgrade modal
function showUpgradeModal() {
  const modal = document.getElementById('upgradeModal');
  modal.style.display = 'flex';
}

// Hide upgrade modal
function hideUpgradeModal() {
  const modal = document.getElementById('upgradeModal');
  modal.style.display = 'none';
}

function showUpgradePromoModal() {
  const modal = document.getElementById('upgradePromoModal');
  if (modal) modal.style.display = 'flex';
}

function hideUpgradePromoModal() {
  const modal = document.getElementById('upgradePromoModal');
  if (modal) modal.style.display = 'none';
}

// =========================
// Event Handlers
// =========================

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  initAuth();

  // Login button (show modal)
  const loginBtn = document.getElementById('loginBtn');
  if (loginBtn) {
    loginBtn.addEventListener('click', () => showAuthModal('login'));
  }

  // Logout button
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
  }

  const upgradeBtn = document.getElementById('upgradeBtn');
  if (upgradeBtn) {
    upgradeBtn.addEventListener('click', showUpgradePromoModal);
  }

  // Tab switching
  const loginTab = document.getElementById('loginTab');
  const registerTab = document.getElementById('registerTab');

  if (loginTab) {
    loginTab.addEventListener('click', () => showAuthModal('login'));
  }

  if (registerTab) {
    registerTab.addEventListener('click', () => showAuthModal('register'));
  }

  const upgradePromoModal = document.getElementById('upgradePromoModal');
  if (upgradePromoModal) {
    upgradePromoModal.addEventListener('click', (e) => {
      if (e.target === upgradePromoModal) hideUpgradePromoModal();
    });
  }

  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => {
      hideUpgradeModal();
      hideUpgradePromoModal();
    });
  });

  // Login form submit
  const loginFormEl = document.getElementById('loginForm');
  if (loginFormEl) {
    loginFormEl.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = document.getElementById('loginEmail').value;
      const password = document.getElementById('loginPassword').value;
      const errorEl = document.getElementById('loginError');
      const submitBtn = e.target.querySelector('button[type="submit"]');

      submitBtn.disabled = true;
      submitBtn.textContent = 'Logging in...';
      errorEl.textContent = '';

      const result = await login(email, password);

      if (!result.success) {
        errorEl.textContent = result.error;
        submitBtn.disabled = false;
        submitBtn.textContent = 'Login';
      }
    });
  }

  // Register form submit
  const registerFormEl = document.getElementById('registerForm');
  if (registerFormEl) {
    registerFormEl.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = document.getElementById('registerName').value;
      const email = document.getElementById('registerEmail').value;
      const password = document.getElementById('registerPassword').value;
      const errorEl = document.getElementById('registerError');
      const submitBtn = e.target.querySelector('button[type="submit"]');

      submitBtn.disabled = true;
      submitBtn.textContent = 'Creating account...';
      errorEl.textContent = '';

      const result = await register(email, password, name);

      if (!result.success) {
        errorEl.textContent = result.error;
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Account';
      }
    });
  }

  // Close modal on overlay click
  const authModal = document.getElementById('authModal');
  if (authModal) {
    authModal.addEventListener('click', (e) => {
      if (e.target === authModal) {
        hideAuthModal();
      }
    });
  }

  const upgradeModal = document.getElementById('upgradeModal');
  if (upgradeModal) {
    upgradeModal.addEventListener('click', (e) => {
      if (e.target === upgradeModal) {
        hideUpgradeModal();
      }
    });
  }

  // Shorten Upgrade button text on small screens
function updateUpgradeButtonText() {
  const upgradeBtn = document.getElementById('upgradeBtn');
  if (!upgradeBtn) return;

  if (window.innerWidth <= 600) {
    upgradeBtn.textContent = 'Upgrade';
  } else {
    upgradeBtn.textContent = 'Upgrade to Unlimited';
  }
}

// Run on load and resize
updateUpgradeButtonText();
window.addEventListener('resize', updateUpgradeButtonText);

  // Close buttons
  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => {
      hideAuthModal();
      hideUpgradeModal();
    });
  });
});
