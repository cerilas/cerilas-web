const API = '/api';
const ACCOUNTS_VAULT_TOKEN_KEY = 'accounts_vault_token';

function getToken() {
  return localStorage.getItem('admin_token');
}

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function getAccountsVaultToken() {
  return sessionStorage.getItem(ACCOUNTS_VAULT_TOKEN_KEY);
}

function accountsVaultHeaders() {
  const token = getAccountsVaultToken();
  return token ? { 'X-Vault-Token': token } : {};
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
  if (res.status === 423 && data.code === 'VAULT_LOCKED') {
    sessionStorage.removeItem(ACCOUNTS_VAULT_TOKEN_KEY);
    window.dispatchEvent(new CustomEvent('accounts-vault-locked'));
  }
  if (!res.ok) {
    const error = new Error(data.error || 'Request failed');
    error.status = res.status;
    error.code = data.code;
    throw error;
  }
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
  getSettings: () => request('/users/settings/me'),
  updateSettings: (data) => request('/users/settings/me', { method: 'PUT', body: JSON.stringify(data) }),

  // Stats
  getStats: () => request('/stats'),
  getAnalyticsSummary: (days = 30) => request(`/analytics/summary?days=${days}`),

  // Expenses
  getExpenses: () => request('/expenses'),
  createExpense: (data) => request('/expenses', { method: 'POST', body: JSON.stringify(data) }),
  updateExpense: (id, data) => request(`/expenses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteExpense: (id) => request(`/expenses/${id}`, { method: 'DELETE' }),

  // Saved accounts
  hasSavedAccountsVaultSession: () => Boolean(getAccountsVaultToken()),
  unlockSavedAccounts: async (password) => {
    const data = await request('/accounts/unlock', {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
    sessionStorage.setItem(ACCOUNTS_VAULT_TOKEN_KEY, data.token);
    return data;
  },
  lockSavedAccounts: () => {
    sessionStorage.removeItem(ACCOUNTS_VAULT_TOKEN_KEY);
  },
  getSavedAccounts: () => request('/accounts', { headers: accountsVaultHeaders() }),
  getSavedAccountPassword: (id) => request(`/accounts/${id}/password`, { headers: accountsVaultHeaders() }),
  createSavedAccount: (data) => request('/accounts', {
    method: 'POST',
    headers: accountsVaultHeaders(),
    body: JSON.stringify(data),
  }),
  updateSavedAccount: (id, data) => request(`/accounts/${id}`, {
    method: 'PUT',
    headers: accountsVaultHeaders(),
    body: JSON.stringify(data),
  }),
  deleteSavedAccount: (id) => request(`/accounts/${id}`, {
    method: 'DELETE',
    headers: accountsVaultHeaders(),
  }),

  // Documents
  getDocuments: (params = {}) => request(`/documents?${new URLSearchParams(params)}`),
  uploadDocument: async (formData) => {
    const res = await fetch(`${API}/documents`, {
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
    if (!res.ok) throw new Error(data.error || 'Belge yüklenemedi');
    return data;
  },
  updateDocument: (id, data) => request(`/documents/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  trashDocument: (id) => request(`/documents/${id}`, { method: 'DELETE' }),
  restoreDocument: (id) => request(`/documents/${id}/restore`, { method: 'POST' }),
  permanentlyDeleteDocument: (id) => request(`/documents/${id}/permanent`, { method: 'DELETE' }),
  getDocumentFolders: () => request('/documents/folders'),
  createDocumentFolder: (data) => request('/documents/folders', { method: 'POST', body: JSON.stringify(data) }),
  updateDocumentFolder: (id, data) => request(`/documents/folders/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteDocumentFolder: (id) => request(`/documents/folders/${id}`, { method: 'DELETE' }),
  getDocumentShare: (id) => request(`/documents/${id}/share`),
  createDocumentShare: (id) => request(`/documents/${id}/share`, { method: 'POST' }),
  revokeDocumentShare: (id) => request(`/documents/${id}/share`, { method: 'DELETE' }),
  fetchDocumentFile: async (id, download = false) => {
    const res = await fetch(`${API}/documents/${id}/file?download=${download}`, {
      headers: authHeaders(),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Belge açılamadı');
    }
    const disposition = res.headers.get('content-disposition') || '';
    const encodedName = disposition.match(/filename\\*=UTF-8''([^;]+)/i)?.[1];
    return {
      blob: await res.blob(),
      filename: encodedName ? decodeURIComponent(encodedName) : `belge-${id}`,
    };
  },
  getPublicDocument: async (token) => {
    const res = await fetch(`${API}/documents/public/${encodeURIComponent(token)}`);
    const data = await res.json();
    if (!res.ok) {
      const error = new Error(data.error || 'Paylaşılan belge açılamadı');
      error.code = data.code;
      throw error;
    }
    return data;
  },
  fetchPublicDocumentFile: async (token, download = false) => {
    const res = await fetch(`${API}/documents/public/${encodeURIComponent(token)}/file?download=${download}`);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Paylaşılan belge açılamadı');
    }
    const disposition = res.headers.get('content-disposition') || '';
    const encodedName = disposition.match(/filename\\*=UTF-8''([^;]+)/i)?.[1];
    return {
      blob: await res.blob(),
      filename: encodedName ? decodeURIComponent(encodedName) : 'cerilas-belge',
    };
  },

  // Mail
  getSenders: () => request('/mail/senders'),
  createSender: (data) => request('/mail/senders', { method: 'POST', body: JSON.stringify(data) }),
  updateSender: (id, data) => request(`/mail/senders/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSender: (id) => request(`/mail/senders/${id}`, { method: 'DELETE' }),
  sendMail: (data) => request('/mail/send', { method: 'POST', body: JSON.stringify(data) }),
  getMailSettings: () => request('/mail/settings'),
  updateMailSettings: (data) => request('/mail/settings', { method: 'PUT', body: JSON.stringify(data) }),

  // SMS
  sendSms: (data) => request('/sms/send', { method: 'POST', body: JSON.stringify(data) }),
  getSmsSettings: () => request('/sms/settings'),
  updateSmsSettings: (data) => request('/sms/settings', { method: 'PUT', body: JSON.stringify(data) }),
  getSmsHeaders: (data) => request('/sms/headers', { method: 'POST', body: JSON.stringify(data) }),

  // Opportunities
  getOpportunities: () => request('/opportunities'),
  getOpportunity: (id) => request(`/opportunities/${id}`),
  createOpportunity: (data) => request('/opportunities', { method: 'POST', body: JSON.stringify(data) }),
  updateOpportunity: (id, data) => request(`/opportunities/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteOpportunity: (id) => request(`/opportunities/${id}`, { method: 'DELETE' }),
  addOpportunityPayment: (id, data) => request(`/opportunities/${id}/payments`, { method: 'POST', body: JSON.stringify(data) }),
  deleteOpportunityPayment: (id, paymentId) => request(`/opportunities/${id}/payments/${paymentId}`, { method: 'DELETE' }),
  addOpportunityTodo: (id, data) => request(`/opportunities/${id}/todos`, { method: 'POST', body: JSON.stringify(data) }),
  toggleOpportunityTodo: (id, todoId, is_completed) => request(`/opportunities/${id}/todos/${todoId}`, { method: 'PATCH', body: JSON.stringify({ is_completed }) }),
  deleteOpportunityTodo: (id, todoId) => request(`/opportunities/${id}/todos/${todoId}`, { method: 'DELETE' }),
  reorderOpportunityTodos: (id, items) => request(`/opportunities/${id}/todos/reorder/bulk`, { method: 'PATCH', body: JSON.stringify({ items }) }),
  getExchangeRates: () => request('/opportunities/rates'),

  // Opportunity Tracking
  getTrackedOpportunities: () => request('/opportunity-tracking'),
  createTrackedOpportunity: (data) => request('/opportunity-tracking', { method: 'POST', body: JSON.stringify(data) }),
  updateTrackedOpportunity: (id, data) => request(`/opportunity-tracking/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTrackedOpportunity: (id) => request(`/opportunity-tracking/${id}`, { method: 'DELETE' }),

  // Pomodoro
  getPomodoroToday: () => request('/pomodoro/today'),
  getPomodoroStats: () => request('/pomodoro/stats'),
  getPomodoroHistory: (days = 7) => request(`/pomodoro/history?days=${days}`),
  getPomodoroDailySessions: (date) => request(`/pomodoro/sessions?date=${date}`),
  savePomodoroSession: (data) => request('/pomodoro', { method: 'POST', body: JSON.stringify(data) }),
  deletePomodoroSession: (id) => request(`/pomodoro/sessions/${id}`, { method: 'DELETE' }),
};
