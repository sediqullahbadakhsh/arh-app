import api from "./apiClient";

// New auth flow
export const authStart = (identifier) =>
  api.post("/start", { identifier }).then((r) => r.data);

export const loginWithPassword = ({ identifier, password }) =>
  api.post("/login/password", { identifier, password }).then((r) => r.data);

export const loginOtpGenerate = (identifier) =>
  api.post("/login/otp/generate", { identifier }).then((r) => r.data);

export const loginOtpVerify = ({ identifier, otp }) =>
  api.post("/login/otp/verify", { identifier, otp }).then((r) => r.data);

export const signupOtpGenerate = ({ email }) =>
  api.post("/customer/request-otp", { email }).then((r) => r.data);

export const signupOtpVerify = ({ otp }) =>
  api.post("/customer/verify-otp", { otp }).then((r) => r.data);
