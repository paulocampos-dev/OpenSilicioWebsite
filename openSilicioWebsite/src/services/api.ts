import axios from 'axios';
import type { User, BlogPost, EducationResource, WikiEntry, WikiLink, PaginatedResponse, SiteSettings } from '../types';

const api = axios.create({
  baseURL: '/api',
});

// Development logging
const isDev = import.meta.env.DEV;

// Request interceptor - add token and log requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Log request in development
  if (isDev) {
    const method = config.method?.toUpperCase();
    const url = config.baseURL + config.url;
    const params = config.params ? `?${new URLSearchParams(config.params).toString()}` : '';

    console.group(`🌐 API Request: ${method} ${url}${params}`);
    console.log('📤 Config:', {
      method: config.method,
      url: config.url,
      baseURL: config.baseURL,
      params: config.params,
      data: config.data,
      headers: config.headers,
    });
    console.groupEnd();
  }

  return config;
}, (error) => {
  if (isDev) {
    console.error('❌ Request Error:', error);
  }
  return Promise.reject(error);
});

// Response interceptor - log responses
api.interceptors.response.use((response) => {
  // Log response in development
  if (isDev) {
    const method = response.config.method?.toUpperCase();
    const url = response.config.url;
    const status = response.status;
    const statusColor = status >= 200 && status < 300 ? '✅' : '⚠️';

    console.group(`${statusColor} API Response: ${method} ${url} (${status})`);
    console.log('📥 Data:', response.data);
    console.log('📊 Headers:', response.headers);
    console.log('⏱️ Config:', response.config);
    console.groupEnd();
  }

  return response;
}, (error) => {
  // Log error response in development
  if (isDev) {
    const method = error.config?.method?.toUpperCase();
    const url = error.config?.url;
    const status = error.response?.status;

    console.group(`❌ API Error: ${method} ${url} (${status || 'Network Error'})`);
    console.error('Error Details:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: error.config,
    });
    console.groupEnd();
  }

  return Promise.reject(error);
});

// Auth
export const authApi = {
  login: async (username: string, password: string) => {
    const response = await api.post<{ token: string; user: User }>('/auth/login', {
      username,
      password,
    });
    return response.data;
  },
  verifyToken: async () => {
    const response = await api.get('/auth/verify');
    return response.data;
  },
};

// Blog
export const blogApi = {
  getAll: async (published?: boolean, page = 1, limit = 10) => {
    const response = await api.get<PaginatedResponse<BlogPost>>('/blog', {
      params: {
        ...(published !== undefined ? { published } : {}),
        page,
        limit,
      },
    });
    return response.data;
  },
  getBySlug: async (slug: string) => {
    const response = await api.get<BlogPost>(`/blog/${slug}`);
    return response.data;
  },
  create: async (data: Partial<BlogPost>) => {
    const response = await api.post<BlogPost>('/blog', data);
    return response.data;
  },
  update: async (id: string, data: Partial<BlogPost>) => {
    const response = await api.put<BlogPost>(`/blog/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    await api.delete(`/blog/${id}`);
  },
};

// Education
export const educationApi = {
  getAll: async (published?: boolean, page = 1, limit = 10) => {
    const response = await api.get<PaginatedResponse<EducationResource>>('/education', {
      params: {
        ...(published !== undefined ? { published } : {}),
        page,
        limit,
      },
    });
    return response.data;
  },
  getById: async (id: string) => {
    const response = await api.get<EducationResource>(`/education/${id}`);
    return response.data;
  },
  create: async (data: Partial<EducationResource>) => {
    const response = await api.post<EducationResource>('/education', data);
    return response.data;
  },
  update: async (id: string, data: Partial<EducationResource>) => {
    const response = await api.put<EducationResource>(`/education/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    await api.delete(`/education/${id}`);
  },
};

// Wiki
export const wikiApi = {
  getAll: async (published?: boolean, page = 1, limit = 20) => {
    const response = await api.get<PaginatedResponse<WikiEntry>>('/wiki', {
      params: {
        ...(published !== undefined ? { published } : {}),
        page,
        limit,
      },
    });
    return response.data;
  },
  getBySlug: async (slug: string) => {
    const response = await api.get<WikiEntry>(`/wiki/${slug}`);
    return response.data;
  },
  create: async (data: Partial<WikiEntry>) => {
    const response = await api.post<WikiEntry>('/wiki', data);
    return response.data;
  },
  update: async (id: string, data: Partial<WikiEntry>) => {
    const response = await api.put<WikiEntry>(`/wiki/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    await api.delete(`/wiki/${id}`);
  },
  getLinks: async (contentType: 'blog' | 'education', contentId: string) => {
    const response = await api.get<WikiLink[]>(`/wiki/links/${contentType}/${contentId}`);
    return response.data;
  },
  createLink: async (data: {
    contentType: 'blog' | 'education';
    contentId: string;
    wikiEntryId: string;
    linkText: string;
  }) => {
    const response = await api.post<WikiLink>('/wiki/links', data);
    return response.data;
  },
  deleteLink: async (id: string) => {
    await api.delete(`/wiki/links/${id}`);
  },
};

// Upload
export const uploadApi = {
  uploadFile: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<{
      filename: string;
      url: string;
      mimetype: string;
      size: number;
    }>('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  uploadTeamMemberImage: async (file: File, onUploadProgress?: (progress: number) => void) => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await api.post<{
      filename: string;
      url: string;
      size: number;
      originalSize: number;
      compressionRatio: string;
    }>('/upload/team-member', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onUploadProgress && progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onUploadProgress(percentCompleted);
        }
      },
    });
    return response.data;
  },
};

// Settings
export const settingsApi = {
  getAll: async () => {
    const response = await api.get<SiteSettings>('/settings');
    return response.data;
  },
  update: async (data: Partial<SiteSettings>) => {
    const response = await api.put<SiteSettings>('/settings', data);
    return response.data;
  },
};

export default api;

