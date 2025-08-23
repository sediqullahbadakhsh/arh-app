import api from "./apiClient";

export const merchantSignup = (payload) =>
  api.post("/merchant/sign-up", payload).then((r) => r.data);
