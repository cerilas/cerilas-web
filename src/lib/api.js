const API = '/api';

function getToken() {
  return localStorage.getItem('admin_token');
}

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...options.headers,
    },
  });
  if (res.status === 401) {
    localStorage.removeItem('admin_token');
    window.location.href = '/admin';
    throw new Error('Unauthorized');
  }
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  // Auth
  login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  me: () => request('/auth/me'),

  // Projects
  getProjects: () => request('/projects'),
  getProject: (slug) => request(`/projects/${slug}`),
  getAdminProjects: () => request('/projects/admin/all'),
  createProject: (data) => request('/projects', { method: 'POST', body: JSON.stringify(data) }),
  updateProject: (id, data) => request(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProject: (id) => request(`/projects/${id}`, { method: 'DELETE' }),

  // Contact submissions
  getContacts: () => request('/contacts'),
  markContactRead: (id) => request(`/contacts/${id}/read`, { method: 'PATCH' }),
  deleteContact: (id) => request(`/contacts/${id}`, { method: 'DELETE' }),

  // Newsletter subscribers
  getSubscribers: () => request('/newsletter'),
  deleteSubscriber: (id) => request(`/newsletter/${id}`, { method: 'DELETE' }),

  // Upload
  uploadImage: async (file, opts = {}) => {
    const formData = new FormData();
    formData.append('file', file);
    if (opts.quality) formData.append('quality', opts.quality);
    if (opts.maxWidth) formData.append('maxWidth', opts.maxWidth);
    if (opts.maxHeight) formData.append('maxHeight', opts.maxHeight);
    if (opts.format) formData.append('format', opts.format);
    if (opts.cropX != null) formData.append('cropX', Math.round(opts.cropX));
    if (opts.cropY != null) formData.append('cropY', Math.round(opts.cropY));
    if (opts.cropWidth) formData.append('cropWidth', Math.round(opts.cropWidth));
    if (opts.cropHeight) formData.append('cropHeight', Math.round(opts.cropHeight));
    const res = await fetch(`${API}/upload`, {
      method: 'POST',
      headers: authHeaders(),
      body: formData,
    });
    if (res.status === 401) {
      localStorage.removeItem('admin_token');
      window.location.href = '/admin';
      throw new Error('Unauthorized');
    }
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload failed');
    return data;
  },
  cropImage: (body) => request('/upload/crop', { method: 'POST', body: JSON.stringify(body) }),
  getUploads: (page = 1, limit = 30, type = '') => {
    const params = new URLSearchParams({ page, limit });
    if (type) params.set('type', type);
    return request(`/upload?${params}`);
  },
  deleteUpload: (filename) => request(`/upload/${filename}`, { method: 'DELETE' }),
};
