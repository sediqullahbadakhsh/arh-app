import api from "./apiClient";


export const getCountries = ()=>{
  return api.get('/country?lang=en').then((r)=>r.data)
}
export const activateBundleByCustomer = async (payload = {}) => {
  try {
    console.log("🔄 Activating bundle for customer with payload:", payload);
    
    const response = await api.post(`/bundle-activation/customer`, payload);
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



export const makeRecharge = (payload = {})=>{
  
  return api.post(`/orders/customer?lang=en`,payload).then((r)=>r.data)
}
export const getOrderStatus = async (orderId) => {
  try {
    const response = await api.get(`/orders/customer/${orderId}`);
    return response.data;
  } catch (error) {
    console.error('Get order status API error:', error);
    throw error;
  }
};

export const getCurrencies = ()=>{
  return api.get('/exchangeRates/customer').then((r)=>r.data)
}
export const getSlabs= ()=>{
  return api.get('/slabs/customer').then((r)=>r.data)
}


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


export const getBundleCategories = () => {
  return api.get('/product-categories/customer').then((r) => r.data);
};


export const getBundleTypes = () => {
  return api.get('/product-types/customer').then((r) => r.data);
};

