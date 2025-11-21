import api from "./apiClient";

export const createReverseStockByMerchant = async (formData) => {
  return api.post("/reverse-stock/merchant", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const getReverseStocksForMerchant = async (params = {}) => {
  const res = await api.get("/reverse-stock/merchant", { params });
  return res.data;
};

export const getDownlineAgents = async (parentUserId) => {
  return api.get(`/merchant-downlineAgent/${parentUserId}?lang=en`).then((r) => r.data);
};