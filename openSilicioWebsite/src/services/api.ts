import axios from 'axios';
import type { User, BlogPost, EducationResource, WikiEntry, WikiLink, PaginatedResponse, SiteSettings } from '../types';

const api = axios.create({
  baseURL: '/api',
});

// Adicionar token a todas as requisições
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
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

