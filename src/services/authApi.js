import api from "./apiClient";


export const authStart = (identifier) =>
  api.post("/start", { identifier }).then((r) => r.data);

export const loginWithPassword = ({ identifier, password }) =>
  api.post("/login", { identifier, password }).then((r) => r.data);

export const loginOtpGenerate = (identifier) =>
  api.post("/login/otp/generate", { identifier }).then((r) => r.data); // ← Change endpoint and parameter

export const loginOtpVerify = ({ identifier, otp }) =>
  api.post("/login/otp/verify", { identifier, otp }).then((r) => r.data);

export const signupOtpGenerate = ({ email }) =>
  api.post("/customer/request-otp", { email }).then((r) => r.data);

export const signupOtpVerify = ({ otp }) =>
  api.post("/customer/verify-otp", { otp }).then((r) => r.data);


export const getCustomerProfile = async () => {
  try {
    const response = await api.get("/customer/me");
    return response.data;
  } catch (error) {
    console.error("Get customer profile error:", error);
    throw error;
  }
};

export const updateCustomerProfile = async (formData) => {
  try {
    const response = await api.put("/customer/me", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Update customer profile error:", error);
    throw error;
  }
};

export const getProfileCompletionStatus = async () => {
  try {
    const response = await api.get("/customer/me/completion-status");
    return response.data;
  } catch (error) {
    console.error("Get profile completion status error:", error);
    throw error;
  }
};

export const updateCustomerEmail = async (otp, email) => {
  try {
    const response = await api.post("/customer/verify-otp-update-email", { otp, email });
    return response.data;
  } catch (error) {
    console.error("Update customer email error:", error);
    throw error;
  }
};


export const getCustomerById = async (customerId) => {
  try {
    const response = await api.get(`/customer/${customerId}`);
    return response.data;
  } catch (error) {
    console.error("Get customer by ID error:", error);
    throw error;
  }
};

export const updateCustomerProfileAdmin = async (customerId, formData) => {
  try {
    const response = await api.patch(`/customer/${customerId}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Update customer profile admin error:", error);
    throw error;
  }
};

export const profile = () =>
  api.get("/profile").then((r) => r.data);