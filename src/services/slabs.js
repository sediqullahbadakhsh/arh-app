// services/slabs.js
import apiClient from "./apiClient";

export const getAllSlabsForMerchant = async (params = {}) => {
  const res = await apiClient.get("/slabs/merchant", { params });
  return res.data;
};

export const createSlab = async (data) => {
  const res = await apiClient.post("/slabs", data);
  return res.data;
};

export const updateSlab = async (id, data) => {
  const res = await apiClient.patch(`/slabs/${id}`, data);
  return res.data;
};

export const deleteSlab = async (id) => {
  const res = await apiClient.delete(`/slabs/${id}`);
  return res.data;
};

export const getSingleSlab = async (id) => {
  const res = await apiClient.get(`/slabs/${id}`);
  return res.data;
};