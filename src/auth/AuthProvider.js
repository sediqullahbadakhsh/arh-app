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

  const fetchUserProfile = async (token) => {
    try {
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
    }
  }, [token]);

  // Initialize auth state
  useEffect(() => {
    (async () => {
      try {
        const [t, role] = await Promise.all([
          AsyncStorage.getItem("auth_token"),
          AsyncStorage.getItem("auth_role"),
        ]);
        
        if (t) {
          console.log("🔄 Restoring auth from storage...");
          const userProfile = await fetchUserProfile(t);
          
          if (userProfile) {
            // Use the actual user profile data
            await setToken(t, {
              role: role || "b2b",
              id: userProfile.id,
              username: userProfile.username,
              role_id: userProfile.role_id,
              ...userProfile // Include all profile data
            });
          } else {
            // Fallback: set token with basic info
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

    // Create user object - prioritize meta data over existing user data
    const u = {
      token: newToken,
      role: role,
      id: meta.id !== undefined ? meta.id : (user?.id !== undefined ? user.id : null),
      username: meta.username !== undefined ? meta.username : (user?.username !== undefined ? user.username : null),
      role_id: meta.role_id !== undefined ? meta.role_id : (user?.role_id !== undefined ? user.role_id : null),
      // Include any additional profile data
      ...meta,
    };

    // Remove duplicate token and role if they exist in meta spread
    delete u.token;
    delete u.role;
    
    // Final user object with correct structure
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
    
    // Fetch user profile after login to get complete user data
    const userProfile = await fetchUserProfile(data.access_token);
    
    await setRoleLocal("b2b");
    await setToken(data.access_token, {
      role: "b2b",
      role_id: data.role_id,
      id: userProfile?.id,
      username: userProfile?.username,
      ...userProfile // Include all profile data
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

    // Fetch user profile after OTP verification
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
      ...userProfile // Include profile data
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
    
    // Fetch user profile after signup
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