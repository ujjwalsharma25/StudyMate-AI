import axios from "axios";

const api = axios.create({ baseURL: "/api" });

// Attach the JWT (set on login/signup) to every request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("studymate_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If a protected route ever comes back 401, the session is dead —
// clear it so the app doesn't keep pretending the user is logged in.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response && err.response.status === 401) {
      localStorage.removeItem("studymate_token");
    }
    return Promise.reject(err);
  }
);

export default api;
