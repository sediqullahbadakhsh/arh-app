import api from "./apiClient";


export const getOrdersC = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    
    // Add filters to params
    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        params.append(key, filters[key]);
      }
    });
    
    const res = await api.get(`orders/customer/customer?${params.toString()}`);
    return res.data;
  } catch (error) {
    console.error("Error fetching orders:", error);
    throw error;
  }
};
export const makeRecharge = (payload = {})=>{
  
  return api.post(`/orders/customer?lang=en`,payload).then((r)=>r.data)
}


export const getCurrencies = ()=>{
  return api.get('/exchangeRates/customer').then((r)=>r.data)
}
export const getSlabs= ()=>{
  return api.get('/slabs/customer').then((r)=>r.data)
}


