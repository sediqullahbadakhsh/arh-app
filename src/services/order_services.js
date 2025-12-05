import api from "./apiClient";


export const getOrdersC = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    

    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        params.append(key, filters[key]);
      }
    });
    
    const res = await api.get(`/orders/customer/customer?${params.toString()}`);
    return res.data;
  } catch (error) {
    console.error("Error fetching orders:", error);
    throw error;
  }
};
export const makeRecharge = (payload = {})=>{
  
  return api.post(`/orders/customer?lang=en`,payload).then((r)=>r.data)
}
export const activateBundleByCustomer = async (payload = {}) => {
  try {
    console.log("🔄 Activating bundle for customer with payload:", payload);
    
    const response = await api.post(`/bundle/customer`, payload);
    console.log("✅ Bundle activation response:", response.data);
    
    return response.data;
  } catch (error) {
    console.error("❌ Bundle activation error:", error);
    

    if (error.response) {
      throw new Error(error.response.data.error || error.response.data.message || "Bundle activation failed");
    } else if (error.request) {
      throw new Error("Network error: Unable to connect to server");
    } else {
      throw new Error(error.message || "Bundle activation failed");
    }
  }
};


export const getOrderStatus = async (orderId) => {
  try {
    const response = await api.get(`/orders/${orderId}/status`);
    return response.data;
  } catch (error) {
    console.error("Error fetching order status:", error);
    throw error;
  }
};

export const getCurrencies = ()=>{
  return api.get('/exchangeRates/customer').then((r)=>r.data)
}
export const getSlabs= ()=>{
  return api.get('/slabs/customer').then((r)=>r.data)
}

export const getCountries = () => {
  return api.get('/countries/customer').then((r) => r.data);
};

// Get Products for Customer
export const getDataProductsCustomer = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null) {
        params.append(key, filters[key]);
      }
    });
    
    const response = await api.get(`/products/customer?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching products for customer:", error);
    throw error;
  }
};

// Get Bundle Categories for Customer
export const getBundleCategories = () => {
  return api.get('/product-categories/customer').then((r) => r.data);
};

// Get Bundle Types for Customer
export const getBundleTypes = () => {
  return api.get('/product-types/customer').then((r) => r.data);
};
