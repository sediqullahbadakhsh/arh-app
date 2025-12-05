
import apiClient from "./apiClient";

export const createTicket = async (formData) => {
  return apiClient.post("/ticket-mng", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const getTicketTypes = async () => {
  const res = await apiClient.get("/ticket-types");
  return res.data.data; 
};

export const getMerchantTickets = async (params = {}) => {
  const res = await apiClient.get("/ticket-mng", { params });
  return res.data; 
};

export const getTicketById = async (id) => {
  const res = await apiClient.get(`/ticket-mng/${id}`);
  return res.data.data;
};