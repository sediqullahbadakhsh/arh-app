import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

export const API_BASE = process.env.EXPO_PUBLIC_API_URL || "https://prod-admin.yes-charge.com/backend/v1";

const IS_PRODUCTION = !__DEV__;
const DEBUG_NET = true;

console.log(`[API Config] Base URL: ${API_BASE}, Production: ${IS_PRODUCTION}, Platform: ${Platform.OS}`);

const api = axios.create({
  baseURL: API_BASE,
  timeout: IS_PRODUCTION ? 45000 : 30000, 
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'User-Agent': 'ARH-App/1.0.0',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
  },
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  config.headers['X-Platform'] = Platform.OS;
  config.headers['X-App-Version'] = '1.0.0';
  config.headers['X-Build-Type'] = IS_PRODUCTION ? 'production' : 'development';


  if (config.url?.includes('/product/')) {
    config.params = {
      ...config.params,
      _t: Date.now(),
      nocache: true, 
    };
   
    config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
    config.headers['Pragma'] = 'no-cache';
    config.headers['Expires'] = '0';
  }

  console.log(
    `[API Request] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`,
    `Production: ${IS_PRODUCTION}, Timeout: ${config.timeout}ms`
  );

  return config;
}, (error) => {
  console.error('[API Request Setup Error]', error);
  return Promise.reject(error);
});


api.interceptors.response.use(
  (res) => {
    console.log(
      `[API Success] ${res.config?.method?.toUpperCase()} ${res.config?.baseURL}${res.config?.url} - Status: ${res.status}`
    );
    return res;
  },
  (err) => {
    const { config, response, message, code } = err;
    
    console.error(
      `[API Failure] ${config?.method?.toUpperCase()} ${config?.baseURL}${config?.url}`,
      {
        status: response?.status,
        code: code,
        message: message,
        production: IS_PRODUCTION,
        config: {
          timeout: config?.timeout,
          baseURL: config?.baseURL,
          url: config?.url
        }
      }
    );


    if (IS_PRODUCTION) {
      if (code === 'NETWORK_ERROR' || message?.includes('Network Error')) {
        console.error('🔧 PRODUCTION NETWORK DIAGNOSTICS:');
        console.error('• Check app.json usesCleartextTraffic: true');
        console.error('• Check networkSecurityConfig domains include 3.67.144.22');
        console.error('• Verify backend server is running and accessible');
        console.error('• Check if HTTP (not HTTPS) is required');
      }
    }

    let errorMessage = "Network error";
    
    if (code === 'ECONNABORTED') {
      errorMessage = "Request timeout - server took too long to respond";
    } else if (code === 'NETWORK_ERROR' || message?.includes('Network Error')) {
      errorMessage = "Cannot connect to server. Please check your internet connection.";
    } else if (response?.status === 404) {
      errorMessage = "Server endpoint not found";
    } else if (response?.status >= 500) {
      errorMessage = "Server error - please try again later";
    } else if (response?.status >= 400) {
      errorMessage = response?.data?.message || "Request failed";
    } else {
      errorMessage = response?.data?.message || message || "Unknown network error";
    }

    const error = new Error(errorMessage);
    error.status = response?.status;
    error.code = code;
    error.isProduction = IS_PRODUCTION;
    
    return Promise.reject(error);
  }
);

const redact = (obj) => {
  try {
    if (!obj) return obj;
    const clone = JSON.parse(JSON.stringify(obj));
    const sensitiveFields = ['access_token', 'jwtToken', 'token', 'password', 'Authorization'];
    
    sensitiveFields.forEach(field => {
      if (clone[field]) clone[field] = "***";
      if (clone.headers && clone.headers[field]) clone.headers[field] = "***";
    });
    
    return clone;
  } catch {
    return obj;
  }
};

export default api;