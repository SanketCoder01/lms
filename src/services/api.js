import axios from "axios";

/**
 * Base API URL
 * Local  : http://localhost:5000/api
 * Render : https://lms-l7qm.onrender.com/api
 */
const getBaseUrl = () => {
  // Default to local backend with /api prefix if environmental variable is not set
  // Default to relative /api when hosted on same origin (Vercel)
  let url = process.env.REACT_APP_API_URL || "/api";
  // Remove trailing slash if present to avoid double slashes later
  return url.endsWith('/') ? url.slice(0, -1) : url;
};

export const FILE_BASE_URL = getBaseUrl().replace('/api', '');

const API = axios.create({
  baseURL: getBaseUrl(),
});

// ---------------- TOKEN INTERCEPTOR ----------------
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ---------------- ERROR INTERCEPTOR ----------------
API.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error(
      "API Error:",
      error.response?.data || error.message
    );
    return Promise.reject(error);
  }
);

// ---------------- AUTH ----------------
export const login = (data) => API.post("/auth/login", data);
export const register = (data) => API.post("/auth/register", data);

// ---------------- PROJECTS ----------------
export const getProjects = (params) => API.get("/projects", { params });
export const getProjectLocations = () => API.get("/projects/locations");
export const getProjectById = (id) => API.get(`/projects/${id}`);
export const addProject = (data) =>
  API.post("/projects", data, {
    // Let browser set the Content-Type with boundary for FormData
    headers: { "Content-Type": undefined },
  });
export const updateProject = (id, data) =>
  API.put(`/projects/${id}`, data, {
    headers: { "Content-Type": undefined },
  });
export const deleteProject = (id) =>
  API.delete(`/projects/${id}`);
export const getProjectDashboardStats = () => API.get("/projects/dashboard-stats");

// ---------------- OWNERS ----------------
export const ownerAPI = {
  getOwners: (params) => API.get("/owners", { params }),
  getOwnerLocations: () => API.get("/owners/locations"),
  getKycStats: () => API.get("/owners/stats"),
  exportOwners: () =>
    API.get("/owners/export", { responseType: "blob" }),
  getOwnerById: (id) => API.get(`/owners/${id}`),
  createOwner: (data) => API.post("/owners", data),
  updateOwner: (id, data) => API.put(`/owners/${id}`, data),
  deleteOwner: (id) => API.delete(`/owners/${id}`),
  // New Methods
  getDocuments: (id) => API.get(`/owners/${id}/documents`),
  uploadDocument: (id, data) =>
    API.post(`/owners/${id}/documents`, data, {
      headers: { "Content-Type": undefined },
    }),
  addUnits: (id, data) => API.post(`/owners/${id}/units`, data),
  removeUnit: (id, unitId) => API.delete(`/owners/${id}/units/${unitId}`),
};

// ---------------- UNITS ----------------
export const unitAPI = {
  getUnits: (params) => API.get("/units", { params }),
  getUnitById: (id) => API.get(`/units/${id}`),
  createUnit: (data) => API.post("/units", data),
  updateUnit: (id, data) => API.put(`/units/${id}`, data),
  deleteUnit: (id) => API.delete(`/units/${id}`),
  getUnitsByProject: (projectId, excludeSold = false) =>
    API.get(`/units?projectId=${projectId}${excludeSold ? '&excludeSold=true' : ''}`),
};

// ---------------- UNIT STRUCTURE (Blocks & Floors) ----------------
export const structureAPI = {
  // Blocks
  getBlocks: (project_id) => API.get('/units/structure/blocks', { params: { project_id } }),
  addBlock: (data) => API.post('/units/structure/blocks', data),
  updateBlock: (id, data) => API.put(`/units/structure/blocks/${id}`, data),
  deleteBlock: (id) => API.delete(`/units/structure/blocks/${id}`),
  // Floors
  getFloors: (params) => API.get('/units/structure/floors', { params }),
  addFloor: (data) => API.post('/units/structure/floors', data),
  updateFloor: (id, data) => API.put(`/units/structure/floors/${id}`, data),
  deleteFloor: (id) => API.delete(`/units/structure/floors/${id}`),
};

// ---------------- TENANTS ----------------
export const tenantAPI = {
  getLocations: () => API.get("/tenants/locations"),
  getTenants: (params) => API.get("/tenants", { params }),
  getTenantById: (id) => API.get(`/tenants/${id}`),
  createTenant: (data) => API.post("/tenants", data),
  updateTenant: (id, data) => API.put(`/tenants/${id}`, data),
  deleteTenant: (id) => API.delete(`/tenants/${id}`),
};

// ---------------- SETTINGS ----------------
export const settingsAPI = {
  getSettings: () => API.get("/settings"),
  updateSettings: (data) => API.put("/settings", data),
  uploadPhoto: (id, data) =>
    API.post(`/settings/${id}/photo`, data),
  removePhoto: (id) =>
    API.delete(`/settings/${id}/photo`),
  updatePassword: (id, data) =>
    API.put(`/settings/${id}/password`, data),
};

// ---------------- ROLES ----------------
export const roleAPI = {
  getRoles: () => API.get("/roles"),
  createRole: (data) => API.post("/roles", data),
  deleteRole: (id) => API.delete(`/roles/${id}`),
};

// ---------------- USERS ----------------
export const userAPI = {
  getUsers: (params) => API.get("/users", { params }),
  createUser: (data) => API.post("/users", data),
  updateUser: (id, data) => API.put(`/users/${id}`, data),
  deleteUser: (id) => API.delete(`/users/${id}`),
};

// ---------------- MANAGEMENT ----------------
export const managementAPI = {
  getDashboardStats: () =>
    API.get("/management/dashboard"),
  getReports: (params) =>
    API.get("/management/reports", { params }),
  exportReports: (params) =>
    API.get("/management/reports/export", {
      params,
      responseType: "blob",
    }),
  getDocuments: (params) =>
    API.get("/management/documents", { params }),
  getNotifications: (params) =>
    API.get("/management/notifications", { params }),
  uploadDocument: (data) =>
    API.post("/management/documents", data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
};

// ---------------- DASHBOARD ----------------
export const getDashboardStats = (params) =>
  API.get("/dashboard/stats", { params });

// ---------------- ACTIVITY LOG ----------------
export const getActivityLogs = (
  page = 1,
  limit = 50,
  filters = {}
) => {
  const query = new URLSearchParams({
    page,
    limit,
    ...filters,
  }).toString();
  return API.get(`/activity/activity-logs?${query}`);
};

export const exportActivityLogs = (filters = {}) => {
  const query = new URLSearchParams(filters).toString();
  return API.get(`/activity/export?${query}`, {
    responseType: "blob",
  });
};

// ---------------- LEASE ----------------
export const leaseAPI = {
  getAllLeases: (params) =>
    API.get("/leases", { params }),
  getLeaseById: (id) =>
    API.get(`/leases/${id}`),
  createLease: (data) =>
    API.post("/leases", data, { headers: { "Content-Type": undefined } }),
  updateLease: (id, data) =>
    API.put(`/leases/${id}`, data, { headers: { "Content-Type": undefined } }),
  deleteLease: (id) =>
    API.delete(`/leases/${id}`),
  // Dashboard & Stats
  getLeaseDashboardStats: () => API.get("/leases/stats"),
  getNeedAttentionLeases: () => API.get("/leases/need-attention"),
  getLeaseReportStats: () => API.get("/leases/report-stats"),
  getLeaseTrackerStats: () => API.get("/leases/tracker-stats"),
  getLeaseNotifications: () => API.get("/leases/notifications"),
  // Specific Lists
  getPendingLeases: () => API.get("/leases/pending"),
  getExpiringLeases: () => API.get("/leases/expiring"), // kept for compatibility
  approveLease: (id) =>
    API.put(`/leases/approve/${id}`),
  rejectLease: (id, data) =>
    API.put(`/leases/reject/${id}`, data),
  sendLeaseReminder: (data) =>
    API.post("/leases/reminders/send", data),
  markAllNotificationsRead: () =>
    API.put("/leases/notifications/read-all"),
  deleteAllNotifications: () =>
    API.delete("/leases/notifications"),
  getLeaseManagerStats: () => API.get("/leases/manager-stats"), // Fixed endpoint to match controller
  // Issue 38: Get main lessee for sub-lease
  getMainLesseeForUnit: (unitId) => API.get(`/leases/unit/${unitId}/main-lessee`),
  // Issue 69: Effective rent as of today
  getEffectiveRent: (id) => API.get(`/leases/${id}/effective-rent`),
  // Issue 70: Export CSV
  exportLeases: (params) => API.get("/leases/export/csv", { params, responseType: "blob" }),
};

// ---------------- PARTIES (NEW) ----------------
export const partyAPI = {
  getAllParties: (params) => API.get("/parties", { params }),
  getPartyById: (id) => API.get(`/parties/${id}`),
  createParty: (data) => API.post("/parties", data),
  updateParty: (id, data) => API.put(`/parties/${id}`, data),
  deleteParty: (id) => API.delete(`/parties/${id}`),
};

// ---------------- OWNERSHIP (NEW) ----------------
export const ownershipAPI = {
  getAllOwnerships: (params) => API.get("/ownerships/search", { params }),
  assignOwner: (data) => API.post("/ownerships/assign", data),
  removeOwner: (data) => API.post("/ownerships/remove", data),
  getOwnersByUnit: (unitId) => API.get(`/ownerships/unit/${unitId}`),
  getUnitsByParty: (partyId) => API.get(`/ownerships/party/${partyId}`),
  // Document Chain
  getDocumentTypes: () => API.get("/ownerships/document-types"),
  addDocumentType: (data) => API.post("/ownerships/document-types", data),
  uploadDocument: (data) => API.post("/ownerships/documents", data, {
    headers: { "Content-Type": undefined },
  }),
  getDocuments: (unitId, partyId) => API.get(`/ownerships/documents/${unitId}/${partyId}`),
};

// ---------------- FILTERS ----------------
export const filterAPI = {
  getFilterOptions: (category) => API.get(`/filters${category ? '?category=' + category : ''}`),
  addFilterOption: (data) => API.post("/filters", data),
  updateFilterOption: (id, data) => API.put(`/filters/${id}`, data),
  deleteFilterOption: (id) => API.delete(`/filters/${id}`),
};

// Backward compatibility
export const getLeaseStats = leaseAPI.getLeaseDashboardStats;
export const getPendingLeases = leaseAPI.getPendingLeases;
export const getExpiringLeases = leaseAPI.getExpiringLeases;
export const getNotifications = leaseAPI.getLeaseNotifications;
export const approveLease = leaseAPI.approveLease;

export default API;
