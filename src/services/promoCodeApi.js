import apiClient from "./apiClient";

export const getCustomerPromoCodeStatus = async () => {
  try {
    const res = await apiClient.get("/promo-code-request/customer/status");
    return res.data;
  } catch (error) {
    console.error("Error fetching promo code status:", error);
    throw error;
  }
};

export const getCustomerPromoCodeUsage = async () => {
  try {
    const res = await apiClient.get("/promoCodeUse/customer/usage");
    return res.data;
  } catch (error) {
    console.error("Error fetching promo code usage:", error);
    throw error;
  }
};

export const applyForPromoCode = async (formData) => {
  try {
    const payload = {
      WhatsApp_number: formData.WhatsApp_number,
      facebook_link: formData.facebook_link,
      tiktok_link: formData.tiktok_link,
      instagram_link: formData.instagram_link,
    };

    console.log('📤 Sending JSON payload:', payload);

    const res = await apiClient.post("/promo-code-request/apply", payload, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return res.data;
  } catch (error) {
    console.error("Error applying for promo code:", error);
    throw error;
  }
};


export const updatePromoCodeRequest = async (id, formData) => {
  try {
    const payload = {
      WhatsApp_number: formData.WhatsApp_number,
      facebook_link: formData.facebook_link,
      tiktok_link: formData.tiktok_link,
      instagram_link: formData.instagram_link,
    };

    const res = await apiClient.patch(`/promo-code-request/applier/${id}`, payload, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return res.data;
  } catch (error) {
    console.error("Error updating promo code request:", error);
    throw error;
  }
};


export const createCashbackRequest = async (cashbackData) => {
  try {
    const res = await apiClient.post("/promo-code-cashback/request", cashbackData);
    return res.data;
  } catch (error) {
    console.error("Error creating cashback request:", error);
    throw error;
  }
};

export const getCustomerCashbackRequests = async () => {
  try {
    const res = await apiClient.get("/promo-code-cashback/customer/requests");
    return res.data;
  } catch (error) {
    console.error("Error fetching cashback requests:", error);
    throw error;
  }
};

export const validatePromoCode = async (validationData) => {
  try {
    const { code, orderAmount } = validationData;
    
    console.log('🔍 Validating promo code:', { code, orderAmount });

    const payload = {
      code: code.trim().toUpperCase(),
      orderAmount: parseFloat(orderAmount) || 0
    };

    const res = await apiClient.post("/promo-code/validatePromoCode", payload, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('✅ Promo code validation response:', res.data);
    return res.data;
  } catch (error) {
    console.error("❌ Error validating promo code:", error);
    

    if (error.response) {
      console.error('Server error response:', error.response.data);
      throw new Error(error.response.data.error || 'Promo code validation failed');
    } else if (error.request) {
      console.error('Network error:', error.request);
      throw new Error('Network error: Unable to validate promo code');
    } else {
      console.error('Validation error:', error.message);
      throw new Error('Failed to validate promo code');
    }
  }
};