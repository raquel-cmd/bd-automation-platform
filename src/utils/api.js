/**
 * API utility functions for BestReviews BD Platform
 * Backend API: Uses VITE_API_URL environment variable in production
 * Falls back to http://localhost:5002 in development
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002';

/**
 * Generic fetch wrapper with error handling
 */
async function fetchAPI(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const fullURL = `${API_BASE_URL}${endpoint}`;

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
    return fetchAPI('/api/login', {
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
    return fetchAPI(`/api/dashboard/brands/${platform}`);
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
  uploadCSV: async (file, platform) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('platform', platform);

    const token = localStorage.getItem('token');

    const response = await fetch(`${API_BASE_URL}/api/admin/upload`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    return response.json();
  },

  getUploadHistory: async () => {
    return fetchAPI('/api/admin/upload-history');
  },
};

/**
 * Skimlinks functions
 */
export const skimlinks = {
  uploadCSV: async (csvContent, month) => {
    return fetchAPI('/api/skimlinks/upload', {
      method: 'POST',
      body: JSON.stringify({ csvContent, month }),
    });
  },

  getMerchants: async (month) => {
    return fetchAPI(`/api/skimlinks/merchants?month=${month}`);
  },

  getAvailableMonths: async () => {
    return fetchAPI('/api/skimlinks/months');
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
