import api from "./apiClient";
import { buildQueryString } from "./queryBuilder";

export const merchantSignup = (payload) =>
  api.post("/merchant/sign-up?lang=en", payload).then((r) => r.data);

export const applyForMerchant = (payload) =>
  api.post("/apply/create?lang=en", payload).then((r) => r.data);

export const getMyMerchantApplication = () =>
  api.get("/apply/my-application?lang=en").then((r) => r.data);

export const updateMerchantApplication = (id, payload) =>
  api.put(`/apply/update/${id}?lang=en`, payload).then((r) => r.data);

export const getCountries = ()=>{
  return api.get('/country?lang=en').then((r)=>r.data)
}
export const getProvinces = (countryId)=>{
  return api.get(`/province?lang=en&countryId=${countryId}`).then((r)=>r.data)
}

  export const getDistricts = (provinceId)=>{
  return api.get(`/district?lang=en&provinceId=${provinceId}`).then((r)=>r.data)
}

  export const getRecentOrdersOfAgent = ()=>{
  return api.get(`/orders?lang=en&limit=10&page=1`).then((r)=>r.data)
}

export const getProductCategories = (filters = {}) => {
  return api.get(`/productCategory?lang=en`).then((r) => r.data);
};
  export const getMerchantWallets = ()=>{
  return api.get(`/wallet/user/19?lang=en&limit=10&page=1`).then((r)=>r.data)
}
  
export const getAgentDownlineAgents = (parentUserId)=>{
  return api.get(`/merchant-downlineAgent/${parentUserId}?lang=en`).then((r)=>r.data)
}
export const transferStockToDownlineAgent = (payload = {})=>{
  
  return api.post(`/transferStock-toDownline?lang=en`,payload).then((r)=>r.data)
}
export const makeRecharge = (payload = {})=>{
  
  return api.post(`/orders/customer?lang=en`,payload).then((r)=>r.data)
}
export const makeRechargeAgent = (payload = {})=>{
  
  return api.post(`/orders?lang=en`,payload).then((r)=>r.data)
}

export const getDataProducts = (filters = {})=>{
  // const query = buildQueryString({
  //   lang: "en",
  //   ...filters,
  // });
  
  // return api.get(`/product/admin?lang=en&countryId=${filters?.countryId}&productCategoryId=${filters?.productCategoryId}&search=${filters?.search}`).then((r)=>r.data)
  return api.get(`/product/admin?lang=en`).then((r)=>r?.data)
}
// In merchantApi.js
// In merchantApi.js - enhance the products endpoint
export const getDataProductsCustomer = (filters = {}, options = {}) => {
  const params = new URLSearchParams();
  params.append('lang', 'en');
  
  // FORCE FRESH DATA - Always add cache busters
  params.append('_t', Date.now());
  params.append('fresh', 'true');
  params.append('nocache', '1');
  
  // Add filters if they exist
  if (filters.countryId) {
    params.append('countryId', filters.countryId);
  }
  if (filters.productCategoryId) {
    params.append('productCategoryId', filters.productCategoryId);
  }
  if (filters.search) {
    params.append('search', filters.search);
  }
  if (filters.productTypeId) {
    params.append('productTypeId', filters.productTypeId);
  }
  

  params.append('real_time', 'true');
  params.append('skip_cache', 'true');
  
  const url = `/product/admin/customer?${params.toString()}`;
  
  console.log(`🔄 Fetching fresh products from: ${url}`);
  
  return api.get(url).then((r) => {
    console.log(`✅ Products fetched: ${r?.data?.data?.length || 0} items`);
    return r?.data;
  });
};
export const activateDataBundle = (payload = {})=>{

  
  return api.post(`/product-activation?lang=en`, payload).then((r)=>r?.data)
}
export const activateDataBundleCustomer = (payload = {})=>{

  
  return api.post(`/product-activation/customer?lang=en`, payload).then((r)=>r?.data)
}

export const getDataBundleCategory = (filters = {})=>{
  
  return api.get(`/product/admin?lang=en`).then((r)=>r.data)

}

export const getUserWallets = (userId)=>{
  
  return api.get(`/merchant-retailer/getAgentWallets/${userId}?lang=en`).then((r)=>r.data)

}

export const getLatestTransactions = (userId)=>{
  
  return api.get(`/merchant-retailer/getAgentWallets/${userId}?lang=en`).then((r)=>r.data)

}

export const transferApiToMainWallet = (payload = {},userId)=>{

  console.log("🐱‍👓🐱‍👓🐱‍👓🐱‍👓: ", payload, userId)
  
  return api.post(`/wallet/transferApiToMainWallet/${userId}?lang=en`, payload).then((r)=>r.data)

}

export const getStockInOut = ()=>{
  return api.get(`/merchant-retailer/stockInOut?lang=en`).then((r)=>r.data)

}

export const getChildUsers = (parentUserId, filterParams = {}) => {

  console.log("this is filte robject form getCHildUsers: ", filterParams)
  // Create query params dynamically
  const params = new URLSearchParams();

  // Always add lang
  params.append("lang", "en");

  // Add filters only if they exist
  if (filterParams.status) {
    params.append("status", filterParams.status);
  }

  if (filterParams.search) {
    params.append("search", filterParams.search);
  }
  // params.append("status", "inactive")

  // Build final URL
  const queryString = params.toString();
  const url = `/merchant-downlineAgent/${parentUserId}?${queryString}`;

  return api.get(url).then((r) => r.data);
};

export const createDownlineAgent = (payload)=>{
  return api.post(`/merchant-downlineAgent?lang=en`, payload).then((r)=>r.data)

}

export const getStatementReport = ()=>{
  return api.get(`/statement/report?lang=en`).then((r)=>r.data)

}

export const updateCommissionRate = (agentId, payload)=>{
  return api.patch(`/agents/setComission/${agentId}?lang=en`,payload).then((r)=>r.data)

}

export const updateLanguage = (agentId, payload)=>{
  return api.patch(`/agents/${agentId}?lang=en`,payload).then((r)=>r.data)

}

export const deleteDownlineAgent = (agentId) => {
  return api.delete(`/merchant-downlineAgent/${agentId}?lang=en`).then((r) => r.data);
};

export const getAllSlabsForMerchant = async (params = {}) => {
  const res = await api.get("/slabs/merchant", { params });
  return res.data;
};

// export const getAllSlabsForMerchant = (filters = {}) => {
//   const params = new URLSearchParams();
//   params.append("lang", "en");
  
//   if (filters.slabFor) {
//     params.append("slabFor", filters.slabFor);
//   }
//   if (filters.limit) {
//     params.append("limit", filters.limit);
//   }
  
//   return api.get(`/slab?${params.toString()}`).then((r) => r.data);
// };

export const setComission = (agentId, payload) => {
  return api.patch(`/merchant-downlineAgent/${agentId}/set-commission?lang=en`, payload).then((r) => r.data);
};

export const updateAgentDetails = (agentId, payload) => {
  return api.patch(`/merchant-downlineAgent/${agentId}?lang=en`, payload).then((r) => r.data);
};

export const getAgentById = (agentId) => {
  return api.get(`/merchant-downlineAgent/agent/${agentId}?lang=en`).then((r) => r.data);
};

export const getOrderStatus = async (orderId) => {
  try {
    const response = await api.get(`/orders/${orderId}`);
    return response.data;
  } catch (error) {
    console.error('Get order status API error:', error);
    throw error;
  }
};