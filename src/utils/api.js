/**
 * API utility functions for BestReviews BD Platform
 * Backend API: Uses VITE_API_URL environment variable in production
 * Falls back to http://localhost:5002 in development
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002';

// Debug logging - remove after testing
console.log('🔧 API Configuration:', {
  VITE_API_URL: import.meta.env.VITE_API_URL,
  API_BASE_URL,
  mode: import.meta.env.MODE,
  prod: import.meta.env.PROD
});

/**
 * Generic fetch wrapper with error handling
 */
async function fetchAPI(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const fullURL = `${API_BASE_URL}${endpoint}`;

  // Debug logging - shows exact URL being called
  console.log('📡 API Request:', {
    endpoint,
    fullURL,
    method: options.method || 'GET',
    hasToken: !!token
  });

  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  };

  try {
    const response = await fetch(fullURL, {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers,
      },
    });

    console.log('📥 API Response:', {
      url: fullURL,
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error('❌ API Error:', {
      url: fullURL,
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}

/**
 * Authentication
 */
export const auth = {
  login: async (username, password) => {
    return fetchAPI('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },

  logout: () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },
};

/**
 * Dashboard data
 */
export const dashboard = {
  getOverview: async () => {
    return fetchAPI('/api/dashboard/overview');
  },

  getPlatformPerformance: async () => {
    return fetchAPI('/api/dashboard/platform-performance');
  },

  getBrandsByPlatform: async (platform) => {
    return fetchAPI(`/api/brands?platform=${encodeURIComponent(platform)}`);
  },

  getWeeklyRevenue: async () => {
    return fetchAPI('/api/dashboard/weekly-revenue');
  },
};

/**
 * Insights data
 */
export const insights = {
  getTrends: async () => {
    return fetchAPI('/api/insights/trends');
  },

  getTopBrands: async () => {
    return fetchAPI('/api/insights/top-brands');
  },

  getTopProducts: async () => {
    return fetchAPI('/api/insights/top-products');
  },
};

/**
 * Admin functions
 */
export const admin = {
  uploadCSV: async (formData) => {
    const token = localStorage.getItem('token');

    const response = await fetch(`${API_BASE_URL}/api/admin/upload`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      let errorMessage = 'Upload failed';
      try {
        const error = await response.json();
        errorMessage = error.message || error.error || errorMessage;
      } catch (e) {
        // If response is not JSON (e.g. 413 Payload Too Large from nginx/proxy)
        errorMessage = `Upload failed: ${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    return response.json();
  },

  getUploadHistory: async () => {
    return fetchAPI('/api/admin/history');
  },
};

/**
 * Proposals
 */
export const proposals = {
  getAll: async () => {
    return fetchAPI('/api/proposals');
  },

  create: async (proposal) => {
    return fetchAPI('/api/proposals', {
      method: 'POST',
      body: JSON.stringify(proposal),
    });
  },

  update: async (id, proposal) => {
    return fetchAPI(`/api/proposals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(proposal),
    });
  },

  delete: async (id) => {
    return fetchAPI(`/api/proposals/${id}`, {
      method: 'DELETE',
    });
  },
};

/**
 * Skimlinks data
 */
export const skimlinks = {
  getMerchants: async (month) => {
    return fetchAPI(`/api/skimlinks/merchants?month=${encodeURIComponent(month)}`);
  },
};
