import api from "./apiClient";

export const createTicket = async (formData) => {
  return api.post("/ticket-mng", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const createTicketC = async (formData) => {
  return api.post("/customer", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const getTicketTypes = async () => {
  const res = await api.get("/ticket-types");
  return res.data.data; 
};

export const getTicketTypesC = async () => {
  const res = await api.get("/customer/type");
  return res.data.data; 
};

export const getMerchantTickets = async (params = {}) => {
  const res = await api.get("/ticket-mng", { params });
  return res.data; 
};

export const getCustomerTickets = async (params = {}) => {
  const res = await api.get("/customer", { params });
  return res.data; 
};

export const getTicketById = async (ticketId) => {
  const res = await api.get(`/ticket-mng/${ticketId}`);
  return res.data;
};