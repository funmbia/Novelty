const BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:2424";

const API_BASE_URL = `${BASE}/api`;
const API_ADMIN_BASE_URL = `${BASE}/api/admin`;

export default API_BASE_URL;
export { API_BASE_URL, API_ADMIN_BASE_URL };