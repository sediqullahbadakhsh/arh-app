// src/services/apiClient.js
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const API_BASE = "http://3.67.144.22/backend/v1";
const DEBUG_NET = __DEV__; // only log in dev builds

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
});

// small helper to avoid leaking tokens in logs
const redact = (obj) => {
  try {
    if (!obj) return obj;
    const clone = JSON.parse(JSON.stringify(obj));
    if (clone.access_token) clone.access_token = "***";
    if (clone.jwtToken) clone.jwtToken = "***";
    if (clone.token) clone.token = "***";
    return clone;
  } catch {
    return obj;
  }
};

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("auth_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;

  if (DEBUG_NET) {
    console.log(
      "[API ⇢]",
      config.method?.toUpperCase(),
      config.baseURL + (config.url || ""),
      { headers: config.headers, data: redact(config.data) }
    );
  }
  return config;
});

api.interceptors.response.use(
  (res) => {
    if (DEBUG_NET) {
      console.log(
        "[API ⇠]",
        res.config?.method?.toUpperCase(),
        res.config?.baseURL + (res.config?.url || ""),
        res.status,
        redact(res.data)
      );
    }
    return res;
  },
  (err) => {
    // Axios error anatomy
    const { config, response, message } = err;
    const status = response?.status;
    const url = (config?.baseURL || "") + (config?.url || "");

    if (DEBUG_NET) {
      console.error(
        "[API ✗]",
        config?.method?.toUpperCase(),
        url,
        status || "",
        redact(response?.data) || message
      );
    }

    const msg =
      response?.data?.message ||
      response?.data?.error ||
      message ||
      "Network error";

    return Promise.reject(new Error(msg));
  }
);

export default api;
