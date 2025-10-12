import apiClient from "./apiClient";

export const getCurrentMerchantProfile = async () => {
  const lang = "en"; // Default to English for mobile app
  try {
    const res = await apiClient.get(`agents/profile/me?lang=${lang}`);
    console.log("Merchant profile response:", res.data);
    return res.data?.data;
  } catch (error) {
    console.error("Error fetching merchant profile:", error);
    throw error;
  }
};

export const updateMerchantProfile = async (payload) => {
  const lang = "en";
  
  try {
    const formData = new FormData();
    
    // Append user data
    if (payload.username) formData.append('username', payload.username);
    if (payload.email) formData.append('email', payload.email);
    if (payload.mobileNumber) formData.append('mobileNumber', payload.mobileNumber);
    
    // Append agent detail data
    if (payload.country) formData.append('country', payload.country);
    if (payload.province) formData.append('province', payload.province);
    if (payload.district) formData.append('district', payload.district);
    if (payload.address) formData.append('address', payload.address);
    if (payload.alternativeContact) formData.append('alternativeContact', payload.alternativeContact);
    if (payload.messageLanguage) formData.append('messageLanguage', payload.messageLanguage);
    
    // Handle profile picture
    if (payload.profile_picture && typeof payload.profile_picture === 'string') {
      // For React Native, we need to handle the image URI
      const filename = payload.profile_picture.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';
      
      formData.append('profile_picture', {
        uri: payload.profile_picture,
        name: filename,
        type,
      });
    }

    const res = await apiClient.patch(
      `agents/profile/update?lang=${lang}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    
    return res.data;
  } catch (error) {
    console.error("Error updating merchant profile:", error);
    throw error;
  }
};

export const getCountries = async () => {
  try {
    const res = await apiClient.get(`/country?lang=en`);
    return res.data;
  } catch (error) {
    console.error("Error fetching countries:", error);
    throw error;
  }
};

export const getProvincesByCountry = async (countryId) => {
  try {
    const res = await apiClient.get(`/province?lang=en&countryId=${countryId}`);
    return res.data;
  } catch (error) {
    console.error("Error fetching provinces:", error);
    throw error;
  }
};

export const getDistrictsByProvince = async (provinceId) => {
  try {
    const res = await apiClient.get(`/district?lang=en&provinceId=${provinceId}`);
    return res.data;
  } catch (error) {
    console.error("Error fetching districts:", error);
    throw error;
  }
};