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

  // Use cases
  getUseCases: (params = {}) => request(`/use-cases?${new URLSearchParams(params)}`),
  getUseCaseTags: (params = {}) => request(`/use-cases/tags?${new URLSearchParams(params)}`),
  getUseCase: (slug) => request(`/use-cases/${slug}`),
  getAdminUseCases: (params = {}) => request(`/use-cases/admin/all?${new URLSearchParams(params)}`),
  getAdminUseCase: (id) => request(`/use-cases/admin/${id}`),
  createUseCase: (data) => request('/use-cases', { method: 'POST', body: JSON.stringify(data) }),
  updateUseCase: (id, data) => request(`/use-cases/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteUseCase: (id) => request(`/use-cases/${id}`, { method: 'DELETE' }),

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
  bulkDeleteUploads: (filenames) => request('/upload/bulk-delete', { method: 'POST', body: JSON.stringify({ filenames }) }),
  bulkDownloadUploads: async (filenames) => {
    const res = await fetch(`${API}/upload/bulk-download`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ filenames }),
    });
    if (!res.ok) throw new Error('Download failed');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cerilas-media-${Date.now()}.zip`;
    a.click();
    URL.revokeObjectURL(url);
  },

  // Job Applications
  submitApplication: async (formData) => {
    const res = await fetch(`${API}/applications`, {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Submit failed');
    return data;
  },
  getApplications: () => request('/applications'),
  updateApplicationStatus: (id, status) => request(`/applications/${id}/review`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  deleteApplication: (id) => request(`/applications/${id}`, { method: 'DELETE' }),
  downloadCV: async (id) => {
    const res = await fetch(`${API}/applications/${id}/cv`, {
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error('Download failed');
    const disposition = res.headers.get('content-disposition');
    const filename = disposition?.match(/filename="?([^"]+)"?/)?.[1] || `cv-${id}.pdf`;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  },

  // Job Listings
  getJobListings: () => request('/job-listings'),
  getAdminJobListings: () => request('/job-listings/admin/all'),
  createJobListing: (data) => request('/job-listings', { method: 'POST', body: JSON.stringify(data) }),
  updateJobListing: (id, data) => request(`/job-listings/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  toggleJobListing: (id) => request(`/job-listings/${id}/toggle`, { method: 'PATCH' }),
  deleteJobListing: (id) => request(`/job-listings/${id}`, { method: 'DELETE' }),

  // Users
  getUsers: () => request('/users'),
  createUser: (data) => request('/users', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (id, data) => request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteUser: (id) => request(`/users/${id}`, { method: 'DELETE' }),

  // Stats
  getStats: () => request('/stats'),

  // Mail
  getSenders: () => request('/mail/senders'),
  createSender: (data) => request('/mail/senders', { method: 'POST', body: JSON.stringify(data) }),
  updateSender: (id, data) => request(`/mail/senders/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSender: (id) => request(`/mail/senders/${id}`, { method: 'DELETE' }),
  sendMail: (data) => request('/mail/send', { method: 'POST', body: JSON.stringify(data) }),
  getMailSettings: () => request('/mail/settings'),
  updateMailSettings: (data) => request('/mail/settings', { method: 'PUT', body: JSON.stringify(data) }),
};
