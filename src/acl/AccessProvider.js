// src/acl/AccessProvider.js
import React, { createContext, useContext, useMemo } from "react";
import { can, canUseScreen } from "./permissions";

// Shape of the “user” while backend is not ready
// Keep role in memory for now; later hydrate from API/auth state
const AccessCtx = createContext({
  role: null,
  setRole: () => {},
  can: () => false,
  canUseScreen: () => false,
});

export function AccessProvider({ role, children }) {
  const value = useMemo(
    () => ({
      role,
      can: (action) => can(role, action),
      canUseScreen: (screen) => canUseScreen(role, screen),
    }),
    [role]
  );

  return <AccessCtx.Provider value={value}>{children}</AccessCtx.Provider>;
}

export function useAccess() {
  return useContext(AccessCtx);
}

// Render children only if allowed
export function Guard({ action, screen, fallback = null, children }) {
  const a = useAccess();
  if (action && !a.can(action)) return fallback;
  if (screen && !a.canUseScreen(screen)) return fallback;
  return children;
}
