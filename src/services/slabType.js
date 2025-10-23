// services/slabType.js
import apiClient from "./apiClient";

export const getAllSlabTypesForMerchant = async (params = {}) => {
  const res = await apiClient.get("/slabTypes/merchant", { params });
  return res.data;
};

export const createSlabTypeByMerchant = async (data) => {
  const res = await apiClient.post("/slabTypes/merchant", data);
  return res.data;
};

export const updateSlabType = async (id, data) => {
  const res = await apiClient.patch(`/slabTypes/${id}`, data);
  return res.data;
};

export const deleteSlabType = async (id) => {
  const res = await apiClient.delete(`/slabTypes/${id}`);
  return res.data;
};

export const getSingleSlabType = async (id) => {
  const res = await apiClient.get(`/slabTypes/${id}`);
  return res.data;
};