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
    const res = await apiClient.get("/promo-code-use/customer/usage");
    return res.data;
  } catch (error) {
    console.error("Error fetching promo code usage:", error);
    throw error;
  }
};

export const applyForPromoCode = async (formData) => {
  try {
    const data = new FormData();
    
    data.append("customerId", formData.customerId);
    data.append("WhatsApp_number", formData.WhatsApp_number);
    data.append("facebook_link", formData.facebook_link);
    data.append("tiktok_link", formData.tiktok_link);
    data.append("instagram_link", formData.instagram_link);
    
    if (formData.document) {
      data.append("document", {
        uri: formData.document,
        type: 'image/jpeg',
        name: `document_${Date.now()}.jpg`,
      });
    }

    const res = await apiClient.post("/promo-code-request/apply", data, {
      headers: {
        'Content-Type': 'multipart/form-data',
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
    const data = new FormData();
    
    data.append("WhatsApp_number", formData.WhatsApp_number);
    data.append("facebook_link", formData.facebook_link);
    data.append("tiktok_link", formData.tiktok_link);
    data.append("instagram_link", formData.instagram_link);
    
    if (formData.document) {
      data.append("document", {
        uri: formData.document,
        type: 'image/jpeg',
        name: `document_${Date.now()}.jpg`,
      });
    }

    const res = await apiClient.patch(`/promo-code-request/apply/${id}`, data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  } catch (error) {
    console.error("Error updating promo code request:", error);
    throw error;
  }
};