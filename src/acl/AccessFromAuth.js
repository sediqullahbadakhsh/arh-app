import React from "react";
import { AccessProvider } from "./AccessProvider";
import { useAuth } from "../auth/AuthProvider";

export default function AccessFromAuth({ children }) {
  const { role } = useAuth();
  return <AccessProvider role={role}>{children}</AccessProvider>;
}
