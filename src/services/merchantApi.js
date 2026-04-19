import api from "./apiClient";
import { buildQueryString } from "./queryBuilder";

export const merchantSignup = (formData) =>
  api.post("/merchant/sign-up?lang=en", formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }).then((r) => r.data);
export const generateOtpForMerchantSignup = (email) =>
  api.post("/merchant/signup/otp/generate", { email })
    .then((r) => r.data);

export const verifyOtpForMerchantSignup = (email, otp, signupData = null) =>
  api.post("/merchant/signup/otp/verify", { email, otp, signupData })
    .then((r) => r.data);

export const completeMerchantSignup = (formData) =>
  api.post("/merchant/signup/complete", formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }).then((r) => r.data);
export const applyForMerchant = (payload) =>
  api.post("/apply/create?lang=en", payload).then((r) => r.data);

export const getAllGameCategories = (filters = {}) => {
  const params = new URLSearchParams();
  params.append('lang', 'en');
  
  if (filters.search) {
    params.append('search', filters.search);
  }
  if (filters.limit) {
    params.append('limit', filters.limit);
  }
  
  return api.get(`/productCategory/games/all?${params.toString()}`).then((r) => r?.data);
};
export const getAllSocialCategories = (filters = {}) => {
  const params = new URLSearchParams();
  params.append('lang', 'en');
  
  if (filters.search) {
    params.append('search', filters.search);
  }
  if (filters.limit) {
    params.append('limit', filters.limit);
  }
  
  return api.get(`/productCategory/social/all?${params.toString()}`).then((r) => r?.data);
};

export const getAllGamesProductsForUser = (filters = {}) => {
  const params = new URLSearchParams();
  params.append('lang', 'en');
  
  if (filters.search) {
    params.append('search', filters.search);
  }
  if (filters.productCategoryId) {
    params.append('productCategoryId', filters.productCategoryId);
  }
  
 
  params.append('page', filters.page || 2);
  params.append('limit', filters.limit || 50);
  
  return api.get(`/product/customer/games?${params.toString()}`)
    .then((response) => {
      return response?.data;
    })
    .catch((error) => {
      console.error('Error fetching game products:', error);
      throw error;
    });
};
export const getAllSocailProductsForUser = (filters = {}) => {
  const params = new URLSearchParams();
  params.append('lang', 'en');
  
  if (filters.search) {
    params.append('search', filters.search);
  }
  if (filters.productCategoryId) {
    params.append('productCategoryId', filters.productCategoryId);
  }
  
 
  params.append('page', filters.page || 2);
  params.append('limit', filters.limit || 50);

  
  return api.get(`/product/customer/social?${params.toString()}`)
    .then((response) => {
      return response?.data;
    })
    .catch((error) => {
      console.error('Error fetching game products:', error);
      throw error;
    });
};

export const activateBundleByAgent = (payload = {}) => {
  return api.post(`/bundle-activation/agent?lang=en`, payload).then((r) => r?.data);
};
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
export const getStoreRexProducts = (filters = {}) => {
  const params = new URLSearchParams();
  params.append('lang', 'en');

  if (filters.search) {
    params.append('search', filters.search);
  }
  if (filters.category) {
    params.append('category', filters.category);
  }
  if (filters.products_id) {
    params.append('products_id', filters.products_id);
  }
  if (filters.product_type) {
    params.append('product_type', filters.product_type);
  }
  if (filters.base === "1") {
    params.append('base', "1");
  }
  
  return api.get(`/storeRex/products?${params.toString()}`).then((r) => r?.data);
};

export const getStoreRexCategories = () => {
  return api.get(`/storeRex/categories?lang=en`).then((r) => r?.data);
};

export const getStoreRexProfile = () => {
  return api.get(`/storeRex/profile?lang=en`).then((r) => r?.data);
};


export const activateGameByAgent = (payload = {}) => {
  console.log("Activating game as agent with payload:", payload);
  
  return api.post(`/game-activation/agent-activate?lang=en`, payload)
    .then((r) => {
      console.log("Game activation response for agent:", r.data);
      return r?.data;
    })
    .catch((error) => {
      console.error('Error activating game as agent:', error.response?.data || error);
      throw error;
    });
};
export const activateSocialBundleByAgent = (payload = {}) => {
  console.log("Activating social bundle as agent with payload:", payload);
  
  return api.post(`/social/agent?lang=en`, payload)
    .then((r) => {
      console.log("Social bundle activation response for agent:", r.data);
      return r?.data;
    })
    .catch((error) => {
      console.error('Error activating social bundle as agent:', error.response?.data || error);
      throw error;
    });
};
export const activateGameByCustomer = (payload = {}) => {
  console.log("Activating game with payload:", payload);
  
  return api.post(`/game-activation/customer-activate?lang=en`, payload)
    .then((r) => {
      console.log("Game activation response:", r.data);
      return r?.data;
    })
    .catch((error) => {
      console.error('Error activating game:', error.response?.data || error);
      throw error;
    });
};

export const checkGameOrderStatus = async (orderId) => {
 try {
    const response = await api.get(`/orders/customer/${orderId}`);
    return response.data;
  } catch (error) {
    console.error('Get order status API error:', error);
    throw error;
  }
};

export const checkBundleOrderStatus = async (orderId) => {
 try {
    const response = await api.get(`/orders/customer/${orderId}`);
    return response.data;
  } catch (error) {
    console.error('Get order status API error:', error);
    throw error;
  }
};

export const getStoreRexProductsForCustomer = (filters = {}) => {
  const params = new URLSearchParams();
  params.append('lang', 'en');
  
  if (filters.search) {
    params.append('search', filters.search);
  }
  if (filters.category) {
    params.append('category', filters.category);
  }
  if (filters.product_type) {
    params.append('product_type', filters.product_type);
  }
  
  return api.get(`/storeRex/products/customer?${params.toString()}`).then((r) => r?.data);
};
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



export const getBundleCategories = (filters = {}) => {
  const params = new URLSearchParams();
  params.append('lang', 'en');
  
  if (filters.search) {
    params.append('search', filters.search);
  }
  
  return api.get(`/productCategory/bundles/all?${params.toString()}`).then((r) => r.data);
};

export const getBundleTypes = (filters = {}) => {
  const params = new URLSearchParams();
  params.append('lang', 'en');
  
  if (filters.search) {
    params.append('search', filters.search);
  }
  
  return api.get(`/productTypes/bundles/all?${params.toString()}`).then((r) => r.data);
};

export const activateSocialProductByCustomer = async (payload = {}) => {
  console.log("Activating social product with payload:", payload);
  
  return api.post(`/social/customer?lang=en`, payload)
    .then((r) => {
      console.log("Social product activation response:", r.data);
      return r?.data;
    })
    .catch((error) => {
      console.error('Error activating social product:', error.response?.data || error);
      throw error;
    });
};
export const getDataProducts = (filters = {}) => {
  const params = new URLSearchParams();
  params.append('lang', 'en');
  
  if (filters.countryId) {
    params.append('countryId', filters.countryId);
  }
  if (filters.productCategoryId) {
    params.append('productCategoryId', filters.productCategoryId);
  }
  if (filters.productTypeId) {
    params.append('productTypeId', filters.productTypeId);
  }
  if (filters.search) {
    params.append('search', filters.search);
  }

  if (filters.prefix) {
    params.append('prefix', filters.prefix);  
  }
  
  params.append('_t', Date.now());
  params.append('fresh', 'true');
    if (options.page) {
    params.append('page', options.page || 2);
  }
  params.append('limit', options.limit || 50);

  
  return api.get(`/product/agent/data?${params.toString()}`).then((r) => r?.data);
};

export const getTopupProductsCustomer = (filters = {}, options = {}) => {
  const params = new URLSearchParams();
  params.append('lang', 'en');

  params.append('_t', Date.now());
  params.append('fresh', 'true');
  params.append('nocache', '1');
  

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
    if (options.page) {
    params.append('page', options.page || 2);
  }
  params.append('limit', options.limit || 50);

  
  const url = `/product/customer/topup?${params.toString()}`;
  
  console.log(`Fetching fresh products from: ${url}`);
  
  return api.get(url).then((r) => {
    console.log(`Products fetched: ${r?.data?.data?.length || 0} items`);
    return r?.data;
  });
};

export const getDataProductsCustomer = (filters = {}, options = {}) => {
  const params = new URLSearchParams();
  params.append('lang', 'en');

  params.append('_t', Date.now());
  params.append('fresh', 'true');
  params.append('nocache', '1');
  

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
   if (options.page) {
    params.append('page', options.page || 2);
  }
  params.append('limit', options.limit || 50);

  
  const url = `/product/customer/data?${params.toString()}`;
  
  console.log(`Fetching fresh products from: ${url}`);
  
  return api.get(url).then((r) => {
    console.log(`Products fetched: ${r?.data?.data?.length || 0} items`);
    return r?.data;
  });
};
export const getProductsCustomer = (filters = {}, options = {}) => {
  const params = new URLSearchParams();
  params.append('lang', 'en');

  params.append('_t', Date.now());
  params.append('fresh', 'true');
  params.append('nocache', '1');
  

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
  
  console.log(`Fetching fresh products from: ${url}`);
  
  return api.get(url).then((r) => {
    console.log(`Products fetched: ${r?.data?.data?.length || 0} items`);
    return r?.data;
  });
};
export const activateDataBundle = (payload = {}) => {
  return api.post(`/bundle-activation/agent/?lang=en`, payload).then((r) => r?.data);
};

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