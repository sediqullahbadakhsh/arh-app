import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Platform,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  Animated,
  Easing,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../theme/colors";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../../auth/AuthProvider";
import { 
  getCurrentMerchantProfile, 
  updateMerchantProfile,
  getCountries,
  getProvincesByCountry,
  getDistrictsByProvince
} from "../../services/merchantProfileService";
import ProfileStyles from "./Styles/ProfileStyle";

const { height: screenHeight } = Dimensions.get('window');

const SkeletonLoader = () => (
  <View style={ProfileStyles.skeletonContainer}>
    <LinearGradient
      colors={["#f5f5f5", "#e0e0e0"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={ProfileStyles.skeletonHeader}
    >
      <View style={ProfileStyles.skeletonAvatarWrapper}>
        <View style={ProfileStyles.skeletonAvatar} />
        <View style={ProfileStyles.skeletonEditButton} />
      </View>
    </LinearGradient>

    <View style={ProfileStyles.skeletonFormContainer}>
      <View style={ProfileStyles.skeletonSectionTitle} />
      
      {[1, 2, 3, 4].map((item) => (
        <View key={item} style={ProfileStyles.skeletonInputGroup}>
          <View style={ProfileStyles.skeletonLabel} />
          <View style={ProfileStyles.skeletonInput} />
        </View>
      ))}
      
      <View style={ProfileStyles.skeletonButton} />
    </View>
  </View>
);

const Shimmer = () => (
  <View style={ProfileStyles.shimmerContainer}>
    <Animated.View style={ProfileStyles.shimmer} />
  </View>
);

export default function ProfileDetailsScreenMerchant({ navigation }) {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [avatar, setAvatar] = useState(null);
  const [formData, setFormData] = useState({
    username: "",
    mobileNumber: "",
    alternativeContact: "",
    address: "",
    email: "",
    country: "",
    province: "",
    district: "",
    messageLanguage: "english",
    profile_picture: null,
  });
  const [errors, setErrors] = useState({});
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [scaleAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(screenHeight));

  // Location data states
  const [countries, setCountries] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);

  console.log(user, "this is user");

  useEffect(() => {
    navigation.setOptions({
      title: "Profile Details",
      headerStyle: {
        backgroundColor: Colors.primary,
      },
      headerTintColor: "#fff",
    });
  }, []);

  useEffect(() => {
    const fetchMerchantData = async () => {
      try {
        setFetching(true);
        const merchantData = await getCurrentMerchantProfile();
        console.log("Merchant data:", merchantData);
        
        if (merchantData) {
          const userInfo = merchantData.user || {};
          const agentDetail = merchantData.agentDetail || {};
          
          setFormData({
            username: userInfo.username || "",
            mobileNumber: userInfo.mobileNumber || "",
            alternativeContact: agentDetail.alternativeContact || "",
            address: agentDetail.address || "",
            email: userInfo.email || "",
            country: agentDetail.country ? agentDetail.country.toString() : "",
            province: agentDetail.province ? agentDetail.province.toString() : "",
            district: agentDetail.district ? agentDetail.district.toString() : "",
            messageLanguage: agentDetail.messageLanguage || "english",
            profile_picture: null,
          });
          
          if (userInfo.profile_picture) {
            setAvatar(userInfo.profile_picture);
          }
        }

        // Load countries for dropdown
        await loadCountries();
      } catch (error) {
        console.error("Error fetching merchant data:", error);
        Alert.alert("Error", "Failed to load profile data");
      } finally {
        setFetching(false);
      }
    };

    fetchMerchantData();
  }, []);

  useEffect(() => {
    requestPermissions();
  }, []);

  useEffect(() => {
    if (showImagePicker) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 350,
        easing: Easing.out(Easing.back(1)),
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: screenHeight,
        duration: 250,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }).start();
    }
  }, [showImagePicker]);

  useEffect(() => {
    if (showSuccess) {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 200,
          easing: Easing.out(Easing.back(1)),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        setShowSuccess(false);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

  // Load countries for dropdown
  const loadCountries = async () => {
    setLoadingCountries(true);
    try {
      const response = await getCountries();
      if (response.status === true || response.success) {
        const countriesData = response.data || response.data?.data || [];
        setCountries(countriesData);
      }
    } catch (error) {
      console.error("Error loading countries:", error);
    } finally {
      setLoadingCountries(false);
    }
  };

  // Load provinces when country changes
  useEffect(() => {
    if (formData.country) {
      loadProvinces(formData.country);
    } else {
      setProvinces([]);
      setDistricts([]);
    }
  }, [formData.country]);

  const loadProvinces = async (countryId) => {
    if (!countryId) return;
    
    setLoadingProvinces(true);
    try {
      const response = await getProvincesByCountry(countryId);
      if (response.status === true || response.success) {
        let provincesData = [];
        
        if (Array.isArray(response.data)) {
          provincesData = response.data;
        } else if (response.data?.data && Array.isArray(response.data.data)) {
          provincesData = response.data.data;
        }
        
        setProvinces(provincesData);
      }
    } catch (error) {
      console.error("Error loading provinces:", error);
    } finally {
      setLoadingProvinces(false);
    }
  };

  // Load districts when province changes
  useEffect(() => {
    if (formData.province) {
      loadDistricts(formData.province);
    } else {
      setDistricts([]);
    }
  }, [formData.province]);

  const loadDistricts = async (provinceId) => {
    if (!provinceId) return;
    
    setLoadingDistricts(true);
    try {
      const response = await getDistrictsByProvince(provinceId);
      if (response.status === true || response.success) {
        let districtsData = [];
        
        if (Array.isArray(response.data)) {
          districtsData = response.data;
        } else if (response.data?.data && Array.isArray(response.data.data)) {
          districtsData = response.data.data;
        }
        
        setDistricts(districtsData);
      }
    } catch (error) {
      console.error("Error loading districts:", error);
    } finally {
      setLoadingDistricts(false);
    }
  };

  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Sorry, we need camera roll permissions to make this work!');
      }
    }
  };

  const handleEditAvatar = async () => {
    setShowImagePicker(false);
    try {
      const { status } = await ImagePicker.getMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        const { status: newStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (newStatus !== 'granted') {
          Alert.alert("Permission required", "Please allow access to your photos to change your profile picture.");
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        allowsMultiple: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setAvatar(result.assets[0].uri);
        setFormData(prev => ({
          ...prev,
          profile_picture: result.assets[0].uri
        }));
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert("Error", "Failed to open image gallery. Please try again.");
    }
  };

  const takePhoto = async () => {
    setShowImagePicker(false);
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert("Permission required", "Please allow camera access to take a photo.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setAvatar(result.assets[0].uri);
        setFormData(prev => ({
          ...prev,
          profile_picture: result.assets[0].uri
        }));
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert("Error", "Failed to open camera. Please try again.");
    }
  };

  const removePhoto = () => {
    setShowImagePicker(false);
    setAvatar(null);
    setFormData(prev => ({
      ...prev,
      profile_picture: null
    }));
  };

  const validateForm = () => {
    let valid = true;
    let newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
      valid = false;
    }

    if (!formData.mobileNumber.trim()) {
      newErrors.mobileNumber = "Mobile number is required";
      valid = false;
    } else if (!/^\+?[\d\s\-\(\)]{10,}$/.test(formData.mobileNumber)) {
      newErrors.mobileNumber = "Please enter a valid mobile number";
      valid = false;
    }

    if (!formData.address.trim()) {
      newErrors.address = "Address is required";
      valid = false;
    }

    if (!formData.country) {
      newErrors.country = "Country is required";
      valid = false;
    }

    if (!formData.province) {
      newErrors.province = "Province is required";
      valid = false;
    }

    if (!formData.district) {
      newErrors.district = "District is required";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleUpdateProfile = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const submitData = {
        ...formData,
        country: parseInt(formData.country),
        province: parseInt(formData.province),
        district: parseInt(formData.district)
      };

      const response = await updateMerchantProfile(submitData);
      console.log("Update response:", response);
      
      if (response.status === "success") {
        if (updateUser && typeof updateUser === 'function') {
          // Update user context with new data
          const updatedProfile = await getCurrentMerchantProfile();
          if (updatedProfile) {
            updateUser({
              ...user,
              ...updatedProfile.user,
              agentDetail: updatedProfile.agentDetail
            });
          }
        }
        
        setShowSuccess(true);
      } else {
        Alert.alert("Error", response.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Update profile error:", error);
      Alert.alert("Error", "An error occurred while updating your profile");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }

    // Reset dependent fields when country or province changes
    if (field === 'country') {
      setFormData(prev => ({
        ...prev,
        province: "",
        district: ""
      }));
    } else if (field === 'province') {
      setFormData(prev => ({
        ...prev,
        district: ""
      }));
    }
  };

  const getOptionDisplayName = (item, nameField = "countryName") => {
    if (!item) return "Select";
    
    const nameObj = item[nameField];
    if (typeof nameObj === 'object') {
      return nameObj.en || nameObj.fa || nameObj.dr || "Unknown";
    }
    return nameObj || item.name || "Unknown";
  };

  const ImagePickerModal = () => (
    <Modal
      visible={showImagePicker}
      transparent={true}
      animationType="none"
      statusBarTranslucent={true}
      onRequestClose={() => setShowImagePicker(false)}
    >
      <View style={ProfileStyles.modalOverlay}>
        <TouchableOpacity 
          style={ProfileStyles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowImagePicker(false)}
        />
        <Animated.View 
          style={[
            ProfileStyles.imagePickerContainer,
            { transform: [{ translateY: slideAnim }] }
          ]}
        >
          <View style={ProfileStyles.pickerHeader}>
            <Text style={ProfileStyles.pickerTitle}>Choose Profile Photo</Text>
            <TouchableOpacity 
              onPress={() => setShowImagePicker(false)}
              style={ProfileStyles.closeButton}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          <View style={ProfileStyles.pickerOptions}>
            <TouchableOpacity 
              style={ProfileStyles.optionButton}
              onPress={takePhoto}
            >
              <View style={[ProfileStyles.optionIcon, { backgroundColor: '#007AFF' }]}>
                <Ionicons name="camera" size={24} color="#fff" />
              </View>
              <Text style={ProfileStyles.optionText}>Take Photo</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={ProfileStyles.optionButton}
              onPress={handleEditAvatar}
            >
              <View style={[ProfileStyles.optionIcon, { backgroundColor: '#34C759' }]}>
                <Ionicons name="images" size={24} color="#fff" />
              </View>
              <Text style={ProfileStyles.optionText}>Choose from Gallery</Text>
            </TouchableOpacity>
            
            {avatar && (
              <TouchableOpacity 
                style={ProfileStyles.optionButton}
                onPress={removePhoto}
              >
                <View style={[ProfileStyles.optionIcon, { backgroundColor: '#FF3B30' }]}>
                  <Ionicons name="trash" size={24} color="#fff" />
                </View>
                <Text style={ProfileStyles.optionText}>Remove Photo</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );

  const SuccessModal = () => (
    <Modal
      visible={showSuccess}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
      onRequestClose={() => setShowSuccess(false)}
    >
      <View style={ProfileStyles.successOverlay}>
        <Animated.View 
          style={[
            ProfileStyles.successContainer,
            { transform: [{ scale: scaleAnim }] }
          ]}
        >
          <View style={ProfileStyles.successIcon}>
            <Ionicons name="checkmark-done" size={48} color="#fff" />
          </View>
          <Text style={ProfileStyles.successTitle}>Success!</Text>
          <Text style={ProfileStyles.successMessage}>Your profile has been updated successfully</Text>
        </Animated.View>
      </View>
    </Modal>
  );

  if (fetching) {
    return <SkeletonLoader />;
  }

  return (
    <View style={ProfileStyles.container}>
      <LinearGradient
        colors={["#9F0901", "#E20E02"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={ProfileStyles.header}
      >
        <View style={ProfileStyles.avatarContainer}>
          <View style={ProfileStyles.avatarWrapper}>
            {avatar ? (
              <Image 
                source={{ uri: avatar }} 
                style={ProfileStyles.avatar} 
                onError={(e) => {
                  console.log('Image load error:', e.nativeEvent.error);
                  setAvatar(null);
                }}
              />
            ) : (
              <View style={ProfileStyles.avatarPlaceholder}>
                <Ionicons name="person" size={48} color="#fff" />
              </View>
            )}
            <TouchableOpacity 
              style={ProfileStyles.editBtn} 
              onPress={() => setShowImagePicker(true)}
            >
              <Ionicons name="camera" size={16} color="#000" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <View style={ProfileStyles.formContainer}>
        <ScrollView style={ProfileStyles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={ProfileStyles.scrollContent}>
          <Text style={ProfileStyles.sectionTitle}>Personal Information</Text>
          
          <View style={ProfileStyles.inputGroup}>
            <Text style={ProfileStyles.label}>Username</Text>
            <View style={[ProfileStyles.inputContainer, errors.username && ProfileStyles.inputError]}>
              <Ionicons name="person-outline" size={20} color="#666" style={ProfileStyles.inputIcon} />
              <TextInput
                style={ProfileStyles.input}
                placeholder="Enter your username"
                value={formData.username}
                onChangeText={(text) => handleChange("username", text)}
              />
            </View>
            {errors.username ? <Text style={ProfileStyles.errorText}>{errors.username}</Text> : null}
          </View>

          <View style={ProfileStyles.inputGroup}>
            <Text style={ProfileStyles.label}>Email Address</Text>
            <View style={ProfileStyles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#666" style={ProfileStyles.inputIcon} />
              <TextInput
                style={[ProfileStyles.input, { color: '#999' }]}
                value={formData.email}
                editable={false}
                selectTextOnFocus={false}
              />
            </View>
          </View>

          <View style={ProfileStyles.inputGroup}>
            <Text style={ProfileStyles.label}>Mobile Number</Text>
            <View style={[ProfileStyles.inputContainer, errors.mobileNumber && ProfileStyles.inputError]}>
              <Ionicons name="call-outline" size={20} color="#666" style={ProfileStyles.inputIcon} />
              <TextInput
                style={ProfileStyles.input}
                placeholder="Enter your mobile number"
                value={formData.mobileNumber}
                onChangeText={(text) => handleChange("mobileNumber", text)}
                keyboardType="phone-pad"
              />
            </View>
            {errors.mobileNumber ? <Text style={ProfileStyles.errorText}>{errors.mobileNumber}</Text> : null}
          </View>

          <View style={ProfileStyles.inputGroup}>
            <Text style={ProfileStyles.label}>Alternative Contact</Text>
            <View style={ProfileStyles.inputContainer}>
              <Ionicons name="call-outline" size={20} color="#666" style={ProfileStyles.inputIcon} />
              <TextInput
                style={ProfileStyles.input}
                placeholder="Enter alternative contact"
                value={formData.alternativeContact}
                onChangeText={(text) => handleChange("alternativeContact", text)}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View style={ProfileStyles.inputGroup}>
            <Text style={ProfileStyles.label}>Message Language</Text>
            <View style={ProfileStyles.inputContainer}>
              <Ionicons name="chatbubble-outline" size={20} color="#666" style={ProfileStyles.inputIcon} />
              <TextInput
                style={ProfileStyles.input}
                placeholder="Message language"
                value={formData.messageLanguage}
                onChangeText={(text) => handleChange("messageLanguage", text)}
              />
            </View>
          </View>

          <Text style={ProfileStyles.sectionTitle}>Address Information</Text>

          <View style={ProfileStyles.inputGroup}>
            <Text style={ProfileStyles.label}>Country</Text>
            <View style={[ProfileStyles.inputContainer, errors.country && ProfileStyles.inputError]}>
              <Ionicons name="location-outline" size={20} color="#666" style={ProfileStyles.inputIcon} />
              <View style={ProfileStyles.selectContainer}>
                <Text style={ProfileStyles.selectValue}>
                  {formData.country 
                    ? getOptionDisplayName(countries.find(c => c.id.toString() === formData.country), "countryName")
                    : "Select Country"
                  }
                </Text>
                <Ionicons name="chevron-down" size={20} color="#666" />
              </View>
              <View style={ProfileStyles.dropdownOptions}>
                {countries.map((country) => (
                  <TouchableOpacity
                    key={country.id}
                    style={ProfileStyles.dropdownOption}
                    onPress={() => handleChange("country", country.id.toString())}
                  >
                    <Text style={ProfileStyles.dropdownOptionText}>
                      {getOptionDisplayName(country, "countryName")}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            {errors.country ? <Text style={ProfileStyles.errorText}>{errors.country}</Text> : null}
          </View>

          <View style={ProfileStyles.inputGroup}>
            <Text style={ProfileStyles.label}>Province</Text>
            <View style={[ProfileStyles.inputContainer, errors.province && ProfileStyles.inputError]}>
              <Ionicons name="location-outline" size={20} color="#666" style={ProfileStyles.inputIcon} />
              <View style={ProfileStyles.selectContainer}>
                <Text style={ProfileStyles.selectValue}>
                  {formData.province 
                    ? getOptionDisplayName(provinces.find(p => p.id.toString() === formData.province), "provinceName")
                    : "Select Province"
                  }
                </Text>
                <Ionicons name="chevron-down" size={20} color="#666" />
              </View>
              <View style={ProfileStyles.dropdownOptions}>
                {provinces.map((province) => (
                  <TouchableOpacity
                    key={province.id}
                    style={ProfileStyles.dropdownOption}
                    onPress={() => handleChange("province", province.id.toString())}
                  >
                    <Text style={ProfileStyles.dropdownOptionText}>
                      {getOptionDisplayName(province, "provinceName")}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            {errors.province ? <Text style={ProfileStyles.errorText}>{errors.province}</Text> : null}
          </View>

          <View style={ProfileStyles.inputGroup}>
            <Text style={ProfileStyles.label}>District</Text>
            <View style={[ProfileStyles.inputContainer, errors.district && ProfileStyles.inputError]}>
              <Ionicons name="location-outline" size={20} color="#666" style={ProfileStyles.inputIcon} />
              <View style={ProfileStyles.selectContainer}>
                <Text style={ProfileStyles.selectValue}>
                  {formData.district 
                    ? getOptionDisplayName(districts.find(d => d.id.toString() === formData.district), "districtName")
                    : "Select District"
                  }
                </Text>
                <Ionicons name="chevron-down" size={20} color="#666" />
              </View>
              <View style={ProfileStyles.dropdownOptions}>
                {districts.map((district) => (
                  <TouchableOpacity
                    key={district.id}
                    style={ProfileStyles.dropdownOption}
                    onPress={() => handleChange("district", district.id.toString())}
                  >
                    <Text style={ProfileStyles.dropdownOptionText}>
                      {getOptionDisplayName(district, "districtName")}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            {errors.district ? <Text style={ProfileStyles.errorText}>{errors.district}</Text> : null}
          </View>

          <View style={ProfileStyles.inputGroup}>
            <Text style={ProfileStyles.label}>Address</Text>
            <View style={[ProfileStyles.inputContainer, errors.address && ProfileStyles.inputError]}>
              <Ionicons name="location-outline" size={20} color="#666" style={ProfileStyles.inputIcon} />
              <TextInput
                style={ProfileStyles.input}
                placeholder="Enter your address"
                value={formData.address}
                onChangeText={(text) => handleChange("address", text)}
                multiline
                numberOfLines={3}
              />
            </View>
            {errors.address ? <Text style={ProfileStyles.errorText}>{errors.address}</Text> : null}
          </View>

          <TouchableOpacity 
            style={[ProfileStyles.updateButton, loading && ProfileStyles.updateButtonDisabled]} 
            onPress={handleUpdateProfile}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={ProfileStyles.updateButtonText}>Update Profile</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ImagePickerModal />
      <SuccessModal />
    </View>
  );
}