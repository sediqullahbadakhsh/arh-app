import React, { createContext, useContext, useMemo, useState } from "react";
import { ROLES } from "../acl/permissions";

// --- Static users (demo only) ---
const USERS = [
  {
    id: "u1",
    role: ROLES.B2C,
    name: "Customer Demo",
    email: "customer@arh.demo",
    phone: "AF:+93700123456",
    otp: "1111",
  },
  {
    id: "u2",
    role: ROLES.B2B,
    name: "Merchant Demo",
    email: "merchant@arh.demo",
    phone: "AF:+93700987654",
    otp: "2222",
  },
];

// helpers
const normalizePhone = (s = "") => s.replace(/[^\d]/g, "");
const matchUser = ({ channel, value }) => {
  if (channel === "email") {
    const v = (value || "").trim().toLowerCase();
    return USERS.find((u) => u.email.toLowerCase() === v);
  }
  // value can be "AF:+93...." or just a number; compare normalized digits
  const v = normalizePhone(value || "");
  return USERS.find((u) => normalizePhone(u.phone) === v);
};

const AuthCtx = createContext({
  user: null, // logged-in user or null
  role: null, // convenience alias
  pending: null, // user awaiting OTP
  sendOtp: async () => {}, // ({ channel: 'email'|'phone', value: string }) -> { userId, otp }
  verifyOtp: async () => {}, // (code: string) -> boolean
  logout: () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [pending, setPending] = useState(null);

  const sendOtp = async ({ channel, value }) => {
    const found = matchUser({ channel, value });
    if (!found) throw new Error("User not found in demo data.");
    setPending(found);
    // In real app we wouldn't return the OTP—here it helps testing.
    return { userId: found.id, otp: found.otp };
  };

  const verifyOtp = async (code) => {
    if (!pending) return false;
    if (code === pending.otp) {
      setUser(pending);
      setPending(null);
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    setPending(null);
  };

  const value = useMemo(
    () => ({
      user,
      role: user?.role || null,
      pending,
      sendOtp,
      verifyOtp,
      logout,
    }),
    [user, pending]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);
