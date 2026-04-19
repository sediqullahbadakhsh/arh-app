import api from "./apiClient";

export const createPurchaseRequest = async (data, files = []) => {
  const formData = new FormData();
  
  files.forEach(file => {
    formData.append('attachments', {
      uri: file.uri,
      name: file.name || 'attachment.jpg',
      type: file.type || 'image/jpeg'
    });
  });

  Object.entries(data).forEach(([key, value]) => {
    formData.append(key, value);
  });

  try {
    const response = await api.post('/salesRequest/purchase-request', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getPurchaseRequests = async (params = {}) => {
  try {
    const response = await api.get('/purchase-request/merchant-request', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getPurchaseRequestDetails = async (id) => {
  try {
    const response = await api.get(`/purchase-request/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updatePurchaseRequest = async (id, data) => {
  try {
    const response = await api.put(`/purchase-request/${id}`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const deletePurchaseRequest = async (id) => {
  try {
    const response = await api.delete(`/purchase-request/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};