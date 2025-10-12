import api from "./apiClient";

export const getAppContents = (filters = {}) => {
  const params = new URLSearchParams();
  
  Object.keys(filters).forEach(key => {
    if (filters[key] !== undefined && filters[key] !== null) {
      params.append(key, filters[key]);
    }
  });
  
  return api.get(`/appContent?${params.toString()}`).then((r) => r.data);
};

export const getAppContentById = (id) => {
  return api.get(`/appContent/${id}`).then((r) => r.data);
};

export const createAppContent = (payload) => {
  return api.post('/appContent', payload).then((r) => r.data);
};

export const updateAppContent = (id, payload) => {
  return api.patch(`/appContent/${id}`, payload).then((r) => r.data);
};

export const deleteAppContent = (id) => {
  return api.delete(`/appContent/${id}`).then((r) => r.data);
};

export const toggleAppContentStatus = (id) => {
  return api.patch(`/appContent/toggle-status/${id}`).then((r) => r.data);
};

// Convenience functions
export const getActiveOffers = (lang = 'en') => {
  return getAppContents({ 
    active: true, 
    type: 'offer',
    lang 
  });
};

export const getContentByType = (type, lang = 'en') => {
  return getAppContents({ 
    active: true, 
    type,
    lang 
  });
};