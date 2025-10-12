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


  useEffect(() => {
    (async () => {
      try {
        const [t, role] = await Promise.all([
          AsyncStorage.getItem("auth_token"),
          AsyncStorage.getItem("auth_role"),
        ]);
        if (t) {
         const userProfile = await fetchUserProfile(t);
await setToken(t, {
  role,
  id: userProfile?.id,
  username: userProfile?.fullName,
  role_id: userProfile?.roleData?.id,
});
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

    const u = {
      ...(user || {}),
      ...meta,
      token: newToken,
      role,
      role_id: meta.role_id ?? user?.role_id,
      username: meta.username ?? user?.username,
      id: meta.id ?? user?.id,
    };

    console.log("✅ AuthProvider: Final user object after login:", u);
    console.log("✅ AuthProvider: Token set:", newToken);
    setUser(u);
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
    await setRoleLocal("b2b");
    await setToken(data.access_token, {
      role: "b2b",
      role_id: data.role_id,
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

    await setRoleLocal("b2c");

    const userData = {
      role: "b2c",
      role_id: data.role_id,
      username: data.fullName,
      ...data.customer,
      ...data,
      id: data.customer?.id || data.id,
      fullName: data.fullName || data.customer?.fullName,
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
    await setRoleLocal("b2c");
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