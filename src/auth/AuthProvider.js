// // src/auth/AuthProvider.jsx
// import React, { createContext, useContext, useMemo, useState } from "react";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import {
//   authStart,
//   loginWithPassword,
//   loginOtpGenerate,
//   loginOtpVerify,
//   signupOtpGenerate,
//   signupOtpVerify,
// } from "../services/authApi";

// const AuthCtx = createContext({
//   user: null,
//   role: null,
//   pending: null,
//   startAuth: async () => {},
//   loginPassword: async () => {},
//   loginOtpSend: async () => {},
//   loginOtpVerify: async () => {},
//   signupCustomerSendOtp: async () => {},
//   signupCustomerVerifyOtp: async () => {},
//   setToken: async () => {},
//   setRoleLocal: async () => {}, // <-- NEW
//   logout: async () => {},
// });

// export function AuthProvider({ children }) {
//   const [user, setUser] = useState(null);
//   const [pending, setPending] = useState(null);

//   const setRoleLocal = async (role) => {
//     if (!role) return;
//     await AsyncStorage.setItem("auth_role", role);
//     setUser((prev) => ({ ...(prev || {}), role }));
//   };

//   const setToken = async (token, meta = {}) => {
//     if (token) await AsyncStorage.setItem("auth_token", token);
//     const role = meta.role || (await AsyncStorage.getItem("auth_role")) || null;
//     const u = { role, role_id: meta.role_id };
//     setUser(u);
//   };

//   const clearToken = async () => {
//     await AsyncStorage.removeItem("auth_token");
//     await AsyncStorage.removeItem("auth_role");
//   };

//   // 1) start auth
//   const startAuthFn = async (identifier) => {
//     const data = await authStart(identifier);
//     // no token yet — we *hint* role only when we actually choose a path or log in
//     setPending({ identifier, mode: "login" });
//     return data;
//   };

//   // 2) Password login → always B2B
//   const loginPasswordFn = async ({ identifier, password }) => {
//     const data = await loginWithPassword({ identifier, password });
//     await setRoleLocal("b2b"); // <-- enforce b2b for password flow
//     await setToken(data.access_token, {
//       role: data.role ?? "b2b",
//       role_id: data.role_id,
//     });
//     setPending(null);
//     return data;
//   };

//   // 3) OTP login → always B2C
//   const loginOtpSendFn = async (identifier) => {
//     const data = await loginOtpGenerate(identifier);
//     // set early hint so other parts of the app can read intended role
//     await setRoleLocal("b2c"); // <-- hint b2c as soon as OTP path is chosen
//     setPending({ identifier, mode: "login" });
//     return data;
//   };

//   const loginOtpVerifyFn = async ({ identifier, otp }) => {
//     const data = await loginOtpVerify({ identifier, otp });
//     await setRoleLocal("b2c"); // <-- enforce b2c for OTP flow
//     await setToken(data.access_token, {
//       role: data.role ?? "b2c",
//       role_id: data.role_id,
//     });
//     setPending(null);
//     return data;
//   };

//   // 4) Customer signup OTP (kept same; if you want, you can set b2c here too)
//   const signupCustomerSendOtpFn = async ({ identifier }) => {
//     const email = identifier;
//     const data = await signupOtpGenerate({ email });
//     setPending({ identifier: email, mode: "signup_customer" });
//     return data;
//   };

//   const signupCustomerVerifyOtpFn = async ({ identifier, otp }) => {
//     const data = await signupOtpVerify({ otp });
//     // Optional: role hint for post-signup flows
//     await setRoleLocal("b2c");
//     setPending(null);
//     return data;
//   };

//   const logout = async () => {
//     await clearToken();
//     setUser(null);
//     setPending(null);
//   };

//   const value = useMemo(
//     () => ({
//       user,
//       role: user?.role || null,
//       pending,
//       startAuth: startAuthFn,
//       loginPassword: loginPasswordFn,
//       loginOtpSend: loginOtpSendFn,
//       loginOtpVerify: loginOtpVerifyFn,
//       signupCustomerSendOtp: signupCustomerSendOtpFn,
//       signupCustomerVerifyOtp: signupCustomerVerifyOtpFn,
//       setToken,
//       setRoleLocal, // <-- expose
//       logout,
//     }),
//     [user, pending]
//   );

//   return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
// }

// export const useAuth = () => useContext(AuthCtx);
// src/auth/AuthProvider.jsx
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
  const [user, setUser] = useState(null); // { role, role_id, ... }
  const [token, setTokenState] = useState(null); // keep token in memory
  const [pending, setPending] = useState(null);
  const [initializing, setInitializing] = useState(true);

  // Bootstrap from storage on app start
  useEffect(() => {
    (async () => {
      try {
        const [t, role] = await Promise.all([
          AsyncStorage.getItem("auth_token"),
          AsyncStorage.getItem("auth_role"),
        ]);
        console.log(t, role, "role and t");
        if (t) {
          setTokenState(t);
          setUser({ role: role || null });
        }
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
    if (newToken) {
      await AsyncStorage.setItem("auth_token", newToken);
      setTokenState(newToken);
    }
    const role = meta.role || (await AsyncStorage.getItem("auth_role")) || null;
    const u = { role, role_id: meta.role_id ?? null };
    setUser(u);
  };

  const clearToken = async () => {
    await AsyncStorage.removeItem("auth_token");
    await AsyncStorage.removeItem("auth_role");
    setTokenState(null);
  };

  // -------- API wrappers --------
  const startAuthFn = async (identifier) => {
    const data = await authStart(identifier);
    setPending({ identifier, mode: "login" });
    return data;
  };

  // Password flow => B2B
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

  // OTP flow => B2C
  const loginOtpSendFn = async (identifier) => {
    const data = await loginOtpGenerate(identifier);
    await setRoleLocal("b2c"); // early hint
    setPending({ identifier, mode: "login" });
    return data;
  };

  const loginOtpVerifyFn = async ({ identifier, otp }) => {
    const data = await loginOtpVerify({ identifier, otp });
    await setRoleLocal("b2c");
    await setToken(data.access_token, {
      role: "b2c",
      role_id: data.role_id,
    });
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
