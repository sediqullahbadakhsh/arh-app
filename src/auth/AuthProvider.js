import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  authStart,
  loginWithPassword,
  loginOtpGenerate,
  loginOtpVerify,
  signupOtpGenerate,
  signupOtpVerify,
  getCustomerProfile,
} from "../services/authApi";
import { jwtDecode } from 'jwt-decode';

const AuthCtx = createContext({
  user: null,
  role: null,
  pending: null,
  authed: false,
  initializing: true,
  startAuth: async () => {},
  loginPassword: async () => {},
  loginOtpSend: async () => {},
  loginOtpVerify: async () => {},
  signupCustomerSendOtp: async () => {},
  signupCustomerVerifyOtp: async () => {},
  setToken: async () => {},
  setRoleLocal: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setTokenState] = useState(null);
  const [pending, setPending] = useState(null);
  const [initializing, setInitializing] = useState(true);

    const isTokenExpired = (token) => {
    if (!token) return true;
    
    try {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      return decoded.exp < currentTime;
    } catch (error) {
      console.error("❌ Error decoding token:", error);
      return true;
    }
  };

  const fetchUserProfile = async (token) => {
    try {

        if (isTokenExpired(token)) {
        await logout();
        throw new Error("Token expired");
      }
      const response = await getCustomerProfile(token); 
      console.log("❤❤❤ this is user profile:", response);
      return response?.data;
    } catch (err) {
      console.error("❌ Failed to fetch user profile:", err);
      return null;
    }
  };

    useEffect(() => {
    if (token) {
      console.log("🔐 Current token in AuthProvider:", token);
      const checkTokenInterval = setInterval(() => {
        if (isTokenExpired(token)) {
          console.log("🚨 Token expired, logging out...");
          logout();
        }
      }, 60000); 

      return () => clearInterval(checkTokenInterval);
    }
  }, [token]);



useEffect(() => {
    (async () => {
      try {
        const [t, role] = await Promise.all([
          AsyncStorage.getItem("auth_token"),
          AsyncStorage.getItem("auth_role"),
        ]);
        
        if (t) {
          if (isTokenExpired(t)) {
            console.log("🚨 Token expired on app start");
            await logout();
            setInitializing(false);
            return;
          }

          console.log("🔄 Restoring auth from storage...");
          const userProfile = await fetchUserProfile(t);
          
          if (userProfile) {
            await setToken(t, {
              role: role || "b2b",
              id: userProfile.id,
              username: userProfile.username,
              role_id: userProfile.role_id,
              ...userProfile 
            });
          } else {
            await setToken(t, { role });
          }
        }
      } catch (err) {
        console.error("❌ Error restoring auth:", err);
      } finally {
        setInitializing(false);
      }
    })();
  }, []);

 useEffect(() => {
    const originalFetch = global.fetch;
    
    global.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        
  
        if (response.status === 401) {
          console.log("Unauthorized access detected");
          await logout();
          throw new Error("Authentication required");
        }
        
        return response;
      } catch (error) {
        throw error;
      }
    };

    return () => {
      global.fetch = originalFetch;
    };
  }, []);
  const setRoleLocal = async (role) => {
    if (!role) return;
    await AsyncStorage.setItem("auth_role", role);
    setUser((prev) => ({ ...(prev || {}), role }));
  };

  const setToken = async (newToken, meta = {}) => {
    console.log("🔥 setToken() triggered with:", { newToken, meta });

    if (newToken) {
      await AsyncStorage.setItem("auth_token", newToken);
      setTokenState(newToken);
    }

    const role = meta.role || (await AsyncStorage.getItem("auth_role")) || null;


    const u = {
      token: newToken,
      role: role,
      id: meta.id !== undefined ? meta.id : (user?.id !== undefined ? user.id : null),
      username: meta.username !== undefined ? meta.username : (user?.username !== undefined ? user.username : null),
      role_id: meta.role_id !== undefined ? meta.role_id : (user?.role_id !== undefined ? user.role_id : null),
      ...meta,
    };

    delete u.token;
    delete u.role;

    const finalUser = {
      token: newToken,
      role: role,
      ...u
    };

    console.log("✅ AuthProvider: Final user object after login:", finalUser);
    console.log("✅ AuthProvider: Token set:", newToken);
    setUser(finalUser);
  };

  const clearToken = async () => {
    await AsyncStorage.removeItem("auth_token");
    await AsyncStorage.removeItem("auth_role");
    setTokenState(null);
  };

  const startAuthFn = async (identifier) => {
    const data = await authStart(identifier);
    setPending({ identifier, mode: "login" });
    return data;
  };

const loginPasswordFn = async ({ identifier, password }) => {
  const data = await loginWithPassword({ identifier, password });
  
  console.log("Login response:", data); 
  

  const userId = data.id; 
  const username = data.username; 
  
  console.log("User ID from login response:", userId);
  console.log("Username from login response:", username);
  
  await setRoleLocal("b2b");
  await setToken(data.access_token, {
    role: "b2b",
    role_id: data.role_id,
    id: userId, 
    username: username, 
  });
  
  setPending(null);
  return data;
};

  const loginOtpSendFn = async (identifier) => {
    const data = await loginOtpGenerate(identifier);
    await setRoleLocal("b2c");
    setPending({ identifier, mode: "login" });
    return data;
  };

  const loginOtpVerifyFn = async ({ identifier, otp }) => {
    const data = await loginOtpVerify({ identifier, otp });
    console.log(data, "this is data");


    const userProfile = await fetchUserProfile(data.access_token);

    await setRoleLocal("b2c");

    const userData = {
      role: "b2c",
      role_id: data.role_id,
      username: data.fullName,
      id: userProfile?.id || data.customer?.id || data.id,
      fullName: data.fullName || data.customer?.fullName,
      ...data.customer,
      ...data,
      ...userProfile
    };

    await setToken(data.access_token, userData);
    setPending(null);
    return data;
  };

  const signupCustomerSendOtpFn = async ({ identifier }) => {
    const email = identifier;
    const data = await signupOtpGenerate({ email });
    setPending({ identifier: email, mode: "signup_customer" });
    return data;
  };

  const signupCustomerVerifyOtpFn = async ({ identifier, otp }) => {
    const data = await signupOtpVerify({ otp });
    

    const userProfile = await fetchUserProfile(data.access_token);
    
    await setRoleLocal("b2c");
    
    await setToken(data.access_token, {
      role: "b2c",
      id: userProfile?.id,
      username: userProfile?.username,
      ...userProfile
    });
    
    setPending(null);
    return data;
  };

  const logout = async () => {
    await clearToken();
    setUser(null);
    setPending(null);
  };

  const value = useMemo(
    () => ({
      user,
      role: user?.role || null,
      pending,
      authed: !!token,
      initializing,
      startAuth: startAuthFn,
      loginPassword: loginPasswordFn,
      loginOtpSend: loginOtpSendFn,
      loginOtpVerify: loginOtpVerifyFn,
      signupCustomerSendOtp: signupCustomerSendOtpFn,
      signupCustomerVerifyOtp: signupCustomerVerifyOtpFn,
      setToken,
      setRoleLocal,
      logout,
    }),
    [user, token, pending, initializing]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);