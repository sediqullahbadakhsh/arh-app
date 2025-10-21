import React, { useState, useEffect } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
  FlatList,
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
import { useTranslation } from "react-i18next";

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

const BottomSheetSelector = ({ 
  title, 
  selectedValue, 
  onSelect, 
  data, 
  loading = false, 
  getDisplayName,
  placeholder = "Select...",
  editable = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const insets = useSafeAreaInsets();
  const [modalSlideAnim] = useState(new Animated.Value(screenHeight));

  useEffect(() => {
    if (isOpen) {
      Animated.timing(modalSlideAnim, {
        toValue: 0,
        duration: 350,
        easing: Easing.out(Easing.back(1)),
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(modalSlideAnim, {
        toValue: screenHeight,
        duration: 250,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }).start();
    }
  }, [isOpen]);

  const filteredData = searchQuery
    ? data.filter(item =>
        getDisplayName(item)?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : data;

  const handleSelect = (item) => {
    onSelect(item);
    setIsOpen(false);
    setSearchQuery('');
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={ProfileStyles.modalRow} onPress={() => handleSelect(item)}>
      <View style={{ flex: 1 }}>
        <Text style={{ color: Colors.textPrimary, fontSize: 16, fontWeight: '500' }}>
          {getDisplayName(item)}
        </Text>
      </View>
      {selectedValue?.id === item.id && (
        <Ionicons name="checkmark" size={20} color={Colors.primary} />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={{ marginBottom: 10 }}>
      <TouchableOpacity
        style={[
          ProfileStyles.selectorTrigger, 
          loading && ProfileStyles.disabled,
          !editable && ProfileStyles.selectorDisabled
        ]}
        onPress={() => !loading && editable && setIsOpen(true)}
        activeOpacity={editable ? 0.8 : 1}
        disabled={loading || !editable}
      >
        <View style={ProfileStyles.selectorSelected}>
          <Text style={[
            ProfileStyles.selectorText,
            selectedValue && { color: Colors.textPrimary },
            !editable && { color: '#999' }
          ]}>
            {selectedValue ? getDisplayName(selectedValue) : placeholder}
          </Text>
        </View>
        
        {loading ? (
          <ActivityIndicator size="small" color="#7A7A7A" />
        ) : (
          <Ionicons name="chevron-down" size={20} color={editable ? "#7A7A7A" : "#CCCCCC"} />
        )}
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent={true}
        animationType="none"
        statusBarTranslucent={true}
        onRequestClose={() => setIsOpen(false)}
      >
        <View style={ProfileStyles.modalOverlay}>
          <TouchableOpacity 
            style={ProfileStyles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setIsOpen(false)}
          />
          <Animated.View 
            style={[
              ProfileStyles.modalCard,
              { 
                transform: [{ translateY: modalSlideAnim }],
                height: '70%',
                marginBottom: -insets.bottom
              }
            ]}
          >
            <View style={ProfileStyles.modalHeader}>
              <Text style={ProfileStyles.modalTitle}>{title}</Text>
              <TouchableOpacity 
                onPress={() => setIsOpen(false)}
                style={ProfileStyles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={ProfileStyles.searchContainer}>
              <Ionicons name="search" size={20} color="#999" style={ProfileStyles.searchIcon} />
              <TextInput
                placeholder={`Search ${title.toLowerCase()}...`}
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={ProfileStyles.searchInput}
                placeholderTextColor="#999"
              />
            </View>

            <FlatList
              data={filteredData}
              keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
              renderItem={renderItem}
              ItemSeparatorComponent={() => <View style={ProfileStyles.contactSeparator} />}
              ListEmptyComponent={
                <View style={ProfileStyles.emptyContainer}>
                  <Text style={ProfileStyles.emptyText}>
                    {loading ? 'Loading...' : 'No items found'}
                  </Text>
                </View>
              }
            />
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
};

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
  const [originalData, setOriginalData] = useState({});
  const [errors, setErrors] = useState({});
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [scaleAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(screenHeight));
  const [isEditing, setIsEditing] = useState(false);
  const {t} = useTranslation();
  const [countries, setCountries] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);

  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedProvince, setSelectedProvince] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);

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
          
     
          const addressData = {
            alternativeContact: merchantData.alternativeContact || "",
            address: merchantData.address || "",
            country: merchantData.country ? merchantData.country.toString() : "",
            province: merchantData.province ? merchantData.province.toString() : "",
            district: merchantData.district ? merchantData.district.toString() : "",
            messageLanguage: merchantData.messageLanguage || "english",
          };
          
          console.log("Address data:", addressData);
          
          const newFormData = {
            username: userInfo.username || "",
            mobileNumber: userInfo.mobileNumber || "",
            email: userInfo.email || "",
            profile_picture: null,
            ...addressData
          };
          
          setFormData(newFormData);
          setOriginalData(newFormData); 
          
          if (userInfo.profile_picture) {
            const fullImageUrl = userInfo.profile_picture.startsWith('http') 
              ? userInfo.profile_picture
              : `http://3.67.144.22/uploads/profile_pictures/${userInfo.profile_picture}`;
            setAvatar(fullImageUrl);
          }

 
          if (merchantData.countryDetails) {
            setSelectedCountry(merchantData.countryDetails);
          }
          if (merchantData.provinceDetails) {
            setSelectedProvince(merchantData.provinceDetails);
          }
          if (merchantData.districtDetails) {
            setSelectedDistrict(merchantData.districtDetails);
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


  const hasChanges = () => {
    return JSON.stringify(formData) !== JSON.stringify(originalData) || 
           avatar !== (user?.profile_picture ? `http://192.168.0.107:8081/uploads/profile_pictures/${user.profile_picture}` : null);
  };


  useEffect(() => {
    if (countries.length > 0 && formData.country && !selectedCountry) {
      const country = countries.find(c => c.id.toString() === formData.country);
      if (country) {
        console.log("Setting selected country:", country);
        setSelectedCountry(country);
      }
    }
  }, [countries, formData.country]);

  useEffect(() => {
    if (provinces.length > 0 && formData.province && !selectedProvince) {
      const province = provinces.find(p => p.id.toString() === formData.province);
      if (province) {
        console.log("Setting selected province:", province);
        setSelectedProvince(province);
      }
    }
  }, [provinces, formData.province]);

  useEffect(() => {
    if (districts.length > 0 && formData.district && !selectedDistrict) {
      const district = districts.find(d => d.id.toString() === formData.district);
      if (district) {
        console.log("Setting selected district:", district);
        setSelectedDistrict(district);
      }
    }
  }, [districts, formData.district]);

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


  const loadCountries = async () => {
    setLoadingCountries(true);
    try {
      const response = await getCountries();
      if (response.status === true || response.success) {
        const countriesData = response.data || response.data?.data || [];
        setCountries(countriesData);
        console.log("Countries loaded:", countriesData.length);
      }
    } catch (error) {
      console.error("Error loading countries:", error);
    } finally {
      setLoadingCountries(false);
    }
  };


  useEffect(() => {
    if (formData.country) {
      loadProvinces(formData.country);
    } else {
      setProvinces([]);
      setDistricts([]);
      setSelectedProvince(null);
      setSelectedDistrict(null);
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
        console.log("Provinces loaded:", provincesData.length);
      }
    } catch (error) {
      console.error("Error loading provinces:", error);
    } finally {
      setLoadingProvinces(false);
    }
  };


  useEffect(() => {
    if (formData.province) {
      loadDistricts(formData.province);
    } else {
      setDistricts([]);
      setSelectedDistrict(null);
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
        console.log("Districts loaded:", districtsData.length);
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
    if (!isEditing) return;
    
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
    if (!isEditing) return;
    
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
    if (!isEditing) return;
    
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
    } else if (!/^\+?[\d\s\-\(\)]{9,}$/.test(formData.mobileNumber)) {
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
    if (!isEditing) {
      setIsEditing(true);
      return;
    }


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
          const updatedProfile = await getCurrentMerchantProfile();
          if (updatedProfile) {
            updateUser({
              ...user,
              ...updatedProfile.user,
              agentDetail: updatedProfile.agentDetail
            });
          }
        }
        

        setOriginalData(formData);
        setIsEditing(false);
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


    if (field === 'country') {
      setFormData(prev => ({
        ...prev,
        province: "",
        district: ""
      }));
      setSelectedProvince(null);
      setSelectedDistrict(null);
    } else if (field === 'province') {
      setFormData(prev => ({
        ...prev,
        district: ""
      }));
      setSelectedDistrict(null);
    }
  };


  const handleCountrySelect = (country) => {
    setSelectedCountry(country);
    handleChange("country", country.id.toString());
  };


  const handleProvinceSelect = (province) => {
    setSelectedProvince(province);
    handleChange("province", province.id.toString());
  };


  const handleDistrictSelect = (district) => {
    setSelectedDistrict(district);
    handleChange("district", district.id.toString());
  };

  const getOptionDisplayName = (item, nameField = "countryName") => {
    if (!item) return "";
    
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
            <Text style={ProfileStyles.pickerTitle}>{t('chooseProfilePhoto')}</Text>
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
              <Text style={ProfileStyles.optionText}>{t('takePhoto')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={ProfileStyles.optionButton}
              onPress={handleEditAvatar}
            >
              <View style={[ProfileStyles.optionIcon, { backgroundColor: '#34C759' }]}>
                <Ionicons name="images" size={24} color="#fff" />
              </View>
              <Text style={ProfileStyles.optionText}>{t('chooseFromGallery')}</Text>
            </TouchableOpacity>
            
            {avatar && (
              <TouchableOpacity 
                style={ProfileStyles.optionButton}
                onPress={removePhoto}
              >
                <View style={[ProfileStyles.optionIcon, { backgroundColor: '#FF3B30' }]}>
                  <Ionicons name="trash" size={24} color="#fff" />
                </View>
                <Text style={ProfileStyles.optionText}>{t('removePhoto')}</Text>
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
          <Text style={ProfileStyles.successTitle}>{t('success!')}</Text>
          <Text style={ProfileStyles.successMessage}>{t('profileUpdateSuccess')}</Text>
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
              style={[
                ProfileStyles.editBtn,
                !isEditing && ProfileStyles.editBtnDisabled
              ]} 
              onPress={() => isEditing && setShowImagePicker(true)}
              disabled={!isEditing}
            >
              <Ionicons name="camera" size={16} color={isEditing ? "#000" : "#999"} />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <View style={ProfileStyles.formContainer}>
        <ScrollView style={ProfileStyles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={ProfileStyles.scrollContent}>
          <Text style={ProfileStyles.sectionTitle}>{t('personalInformation')}</Text>
          
          <View style={ProfileStyles.inputGroup}>
            <Text style={ProfileStyles.label}>{t('userName')}</Text>
            <View style={[
              ProfileStyles.inputContainer, 
              errors.username && ProfileStyles.inputError,
              !isEditing && ProfileStyles.inputDisabled
            ]}>
              <Ionicons name="person-outline" size={20} color="#666" style={ProfileStyles.inputIcon} />
              <TextInput
                style={ProfileStyles.input}
                placeholder="Enter your username"
                value={formData.username}
                onChangeText={(text) => handleChange("username", text)}
                editable={isEditing}
              />
            </View>
            {errors.username ? <Text style={ProfileStyles.errorText}>{errors.username}</Text> : null}
          </View>

          <View style={ProfileStyles.inputGroup}>
            <Text style={ProfileStyles.label}>{t('emailAddress')}</Text>
            <View style={[ProfileStyles.inputContainer, ProfileStyles.inputDisabled]}>
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
            <Text style={ProfileStyles.label}>{t('mobilenumber')}</Text>
            <View style={[
              ProfileStyles.inputContainer, 
              errors.mobileNumber && ProfileStyles.inputError,
              !isEditing && ProfileStyles.inputDisabled
            ]}>
              <Ionicons name="call-outline" size={20} color="#666" style={ProfileStyles.inputIcon} />
              <TextInput
                style={ProfileStyles.input}
                placeholder="Enter your mobile number"
                value={formData.mobileNumber}
                onChangeText={(text) => handleChange("mobileNumber", text)}
                keyboardType="phone-pad"
                editable={isEditing}
              />
            </View>
            {errors.mobileNumber ? <Text style={ProfileStyles.errorText}>{errors.mobileNumber}</Text> : null}
          </View>

          <View style={ProfileStyles.inputGroup}>
            <Text style={ProfileStyles.label}>{t('alternativeContact')}</Text>
            <View style={[
              ProfileStyles.inputContainer,
              !isEditing && ProfileStyles.inputDisabled
            ]}>
              <Ionicons name="call-outline" size={20} color="#666" style={ProfileStyles.inputIcon} />
              <TextInput
                style={ProfileStyles.input}
                placeholder="Enter alternative contact"
                value={formData.alternativeContact}
                onChangeText={(text) => handleChange("alternativeContact", text)}
                keyboardType="phone-pad"
                editable={isEditing}
              />
            </View>
          </View>

          <View style={ProfileStyles.inputGroup}>
            <Text style={ProfileStyles.label}>{t('messageLanguage')}</Text>
            <View style={[
              ProfileStyles.inputContainer,
              !isEditing && ProfileStyles.inputDisabled
            ]}>
              <Ionicons name="chatbubble-outline" size={20} color="#666" style={ProfileStyles.inputIcon} />
              <TextInput
                style={ProfileStyles.input}
                placeholder="Message language"
                value={formData.messageLanguage}
                onChangeText={(text) => handleChange("messageLanguage", text)}
                editable={isEditing}
              />
            </View>
          </View>

          <Text style={ProfileStyles.sectionTitle}>{t('addressInformation')}</Text>

          <View style={ProfileStyles.inputGroup}>
            <Text style={ProfileStyles.label}>{t('country')}</Text>
            <View style={[
              ProfileStyles.selectorWrapper, 
              errors.country && ProfileStyles.inputError,
              !isEditing && ProfileStyles.selectorDisabled
            ]}>
              <BottomSheetSelector
                title="Select Country"
                selectedValue={selectedCountry}
                onSelect={handleCountrySelect}
                data={countries}
                loading={loadingCountries}
                getDisplayName={(item) => getOptionDisplayName(item, "countryName")}
                placeholder="Select Country"
                editable={isEditing}
              />
            </View>
            {errors.country ? <Text style={ProfileStyles.errorText}>{errors.country}</Text> : null}
          </View>

          <View style={ProfileStyles.inputGroup}>
            <Text style={ProfileStyles.label}>{t('province')}</Text>
            <View style={[
              ProfileStyles.selectorWrapper, 
              errors.province && ProfileStyles.inputError,
              !isEditing && ProfileStyles.selectorDisabled
            ]}>
              <BottomSheetSelector
                title="Select Province"
                selectedValue={selectedProvince}
                onSelect={handleProvinceSelect}
                data={provinces}
                loading={loadingProvinces}
                getDisplayName={(item) => getOptionDisplayName(item, "provinceName")}
                placeholder="Select Province"
                editable={isEditing}
              />
            </View>
            {errors.province ? <Text style={ProfileStyles.errorText}>{errors.province}</Text> : null}
          </View>

          <View style={ProfileStyles.inputGroup}>
            <Text style={ProfileStyles.label}>{t("district")}</Text>
            <View style={[
              ProfileStyles.selectorWrapper, 
              errors.district && ProfileStyles.inputError,
              !isEditing && ProfileStyles.selectorDisabled
            ]}>
              <BottomSheetSelector
                title="Select District"
                selectedValue={selectedDistrict}
                onSelect={handleDistrictSelect}
                data={districts}
                loading={loadingDistricts}
                getDisplayName={(item) => getOptionDisplayName(item, "districtName")}
                placeholder="Select District"
                editable={isEditing}
              />
            </View>
            {errors.district ? <Text style={ProfileStyles.errorText}>{errors.district}</Text> : null}
          </View>

          <View style={ProfileStyles.inputGroup}>
            <Text style={ProfileStyles.label}>Address</Text>
            <View style={[
              ProfileStyles.inputContainer, 
              errors.address && ProfileStyles.inputError,
              !isEditing && ProfileStyles.inputDisabled
            ]}>
              <Ionicons name="location-outline" size={20} color="#666" style={ProfileStyles.inputIcon} />
              <TextInput
                style={[ProfileStyles.input, { height: 80, textAlignVertical: 'top' }]}
                placeholder="Enter your complete address"
                value={formData.address}
                onChangeText={(text) => handleChange("address", text)}
                multiline
                numberOfLines={4}
                editable={isEditing}
              />
            </View>
            {errors.address ? <Text style={ProfileStyles.errorText}>{errors.address}</Text> : null}
          </View>

          <TouchableOpacity 
            style={[
              ProfileStyles.updateButton, 
              loading && ProfileStyles.updateButtonDisabled,
            ]} 
            onPress={handleUpdateProfile}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name={isEditing ? "save" : "create"} size={20} color="#fff" />
                <Text style={ProfileStyles.updateButtonText}>
                  {isEditing ? "Save Changes" : "Update Profile"}
                </Text>
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