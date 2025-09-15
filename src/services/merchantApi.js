import api from "./apiClient";
import { buildQueryString } from "./queryBuilder";

export const merchantSignup = (payload) =>
  api.post("/merchant/sign-up?lang=en", payload).then((r) => r.data);


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

export const getDataProducts = (filters = {})=>{
  // const query = buildQueryString({
  //   lang: "en",
  //   ...filters,
  // });
  
  // return api.get(`/product/admin?lang=en&countryId=${filters?.countryId}&productCategoryId=${filters?.productCategoryId}&search=${filters?.search}`).then((r)=>r.data)
  return api.get(`/product/admin?lang=en`).then((r)=>r?.data)
}

export const activateDataBundle = (payload = {})=>{

  
  return api.post(`/product-activation?lang=en`, payload).then((r)=>r?.data)
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
 
  const params = new URLSearchParams();


  params.append("lang", "en");


  if (filterParams.status) {
    params.append("status", filterParams.status);
  }

  if (filterParams.search) {
    params.append("search", filterParams.search);
  }
 


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

