/**
 * API utility functions for BestReviews BD Platform
 * Backend API: http://localhost:5002
 */

const API_BASE_URL = '/api';

/**
 * Generic fetch wrapper with error handling
 */
async function fetchAPI(endpoint, options = {}) {
  const token = localStorage.getItem('token');

  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
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
}

/**
 * Authentication
 */
export const auth = {
  login: async (username, password) => {
    return fetchAPI('/auth/login', {
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
    return fetchAPI('/dashboard/overview');
  },

  getPlatformPerformance: async () => {
    return fetchAPI('/dashboard/platform-performance');
  },

  getBrandsByPlatform: async (platform) => {
    return fetchAPI(`/dashboard/brands/${platform}`);
  },
};

/**
 * Insights data
 */
export const insights = {
  getTrends: async () => {
    return fetchAPI('/insights/trends');
  },

  getTopBrands: async () => {
    return fetchAPI('/insights/top-brands');
  },

  getTopProducts: async () => {
    return fetchAPI('/insights/top-products');
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

    const response = await fetch(`${API_BASE_URL}/admin/upload`, {
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
    return fetchAPI('/admin/upload-history');
  },
};

/**
 * Proposals
 */
export const proposals = {
  getAll: async () => {
    return fetchAPI('/proposals');
  },

  create: async (proposal) => {
    return fetchAPI('/proposals', {
      method: 'POST',
      body: JSON.stringify(proposal),
    });
  },

  update: async (id, proposal) => {
    return fetchAPI(`/proposals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(proposal),
    });
  },

  delete: async (id) => {
    return fetchAPI(`/proposals/${id}`, {
      method: 'DELETE',
    });
  },
};
