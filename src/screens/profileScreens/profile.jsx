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
  getCustomerProfile, 
  updateCustomerProfile,
  getProfileCompletionStatus 
} from "../../services/authApi";
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


const Shimmer = () => (
  <View style={ProfileStyles.shimmerContainer}>
    <Animated.View style={ProfileStyles.shimmer} />
  </View>
);

export default function ProfileDetailsScreen({ navigation }) {
  const { t } = useTranslation();
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [avatar, setAvatar] = useState(user?.profileImg || null);
  const [formData, setFormData] = useState({
    fullName: "",
    phoneNumber: "",
    address: "",
    email: "",
  });
  const [completionStatus, setCompletionStatus] = useState(null);
  const [errors, setErrors] = useState({});
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [scaleAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(screenHeight));

  useEffect(() => {
    navigation.setOptions({
      title: t('profileDetails'),
      headerStyle: {
        backgroundColor: Colors.primary,
      },
      headerTintColor: "#fff",
    });
  }, [t, navigation]);

  useEffect(() => {
    const fetchCustomerData = async () => {
      try {
        setFetching(true);
        const customerData = await getCustomerProfile();
        console.log("Customer data:", customerData);
        
        if (customerData.success) {
          const customer = customerData.data;
          setFormData({
            fullName: customer.fullName || "",
            phoneNumber: customer.phoneNumber || "",
            address: customer.address || "",
            email: customer.email || "",
          });
          
          if (customer.profileImg) {
            const fullImageUrl = customer.profileImg.startsWith('http') 
              ? customer.profileImg 
              : `http://192.168.0.115:8081/uploads/customer_pictures/${customer.profileImg}`;
            setAvatar(fullImageUrl);
          }
        }

        const statusData = await getProfileCompletionStatus();
        if (statusData.success) {
          setCompletionStatus(statusData.data);
        }
      } catch (error) {
        console.error("Error fetching customer data:", error);
        Alert.alert(t('error'), t('profileLoadError'));
      } finally {
        setFetching(false);
      }
    };

    fetchCustomerData();
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
  }, [showImagePicker, slideAnim]);

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
  }, [showSuccess, scaleAnim]);

  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('galleryPermission'), t('galleryPermissionMessage'));
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
          Alert.alert(t('galleryPermission'), t('galleryPermissionMessage'));
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
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert(t('galleryError'), t('galleryErrorMessage'));
    }
  };

  const takePhoto = async () => {
    setShowImagePicker(false);
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(t('cameraPermission'), t('cameraPermissionMessage'));
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setAvatar(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert(t('cameraError'), t('cameraErrorMessage'));
    }
  };

  const removePhoto = () => {
    setShowImagePicker(false);
    setAvatar(null);
  };

  const validateForm = () => {
    let valid = true;
    let newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = t('fullNameRequired');
      valid = false;
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = t('phoneRequired');
      valid = false;
    } else if (!/^\+?[\d\s\-\(\)]{10,}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = t('invalidPhone');
      valid = false;
    }

    if (!formData.address.trim()) {
      newErrors.address = t('addressRequired');
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleUpdateProfile = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const data = new FormData();
      data.append("fullName", formData.fullName);
      data.append("phoneNumber", formData.phoneNumber);
      data.append("address", formData.address);

      if (avatar && avatar.startsWith("file://")) {
        const filename = avatar.split("/").pop();
        const match = /\.(\w+)$/.exec(filename || "");
        const type = match ? `image/${match[1]}` : "image/jpeg";

        data.append("profileImg", {
          uri: avatar,
          name: filename || `profile-${Date.now()}.jpg`,
          type,
        });
      }

      const response = await updateCustomerProfile(data);
      console.log("Update response:", response);
      
      if (response.success) {
        if (updateUser && typeof updateUser === 'function') {
          updateUser({
            ...user,
            fullName: formData.fullName,
            phoneNumber: formData.phoneNumber,
            address: formData.address,
            profileImg: response.data.profileImg || avatar,
          });
        }
        
        const statusData = await getProfileCompletionStatus();
        if (statusData.success) {
          setCompletionStatus(statusData.data);
        }
        
        setShowSuccess(true);
      } else {
        Alert.alert(t('error'), response.message || t('profileUpdateError'));
      }
    } catch (error) {
      console.error("Update profile error:", error);
      Alert.alert(t('error'), t('genericError'));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
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
          <Text style={ProfileStyles.successTitle}>{t('profileUpdated')}</Text>
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
              style={ProfileStyles.editBtn} 
              onPress={() => setShowImagePicker(true)}
            >
              <Ionicons name="camera" size={16} color="#000" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

 
      <View style={ProfileStyles.formContainer}>
        <ScrollView 
          style={ProfileStyles.scrollView} 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={ProfileStyles.scrollContent}
        >
          <Text style={ProfileStyles.sectionTitle}>{t('personalInformation')}</Text>
          
    
          <View style={ProfileStyles.inputGroup}>
            <Text style={ProfileStyles.label}>{t('fullName')}</Text>
            <View style={[ProfileStyles.inputContainer, errors.fullName && ProfileStyles.inputError]}>
              <Ionicons name="person-outline" size={20} color="#666" style={ProfileStyles.inputIcon} />
              <TextInput
                style={ProfileStyles.input}
                placeholder={t('enterFullName')}
                value={formData.fullName}
                onChangeText={(text) => handleChange("fullName", text)}
                placeholderTextColor="#999"
              />
            </View>
            {errors.fullName ? <Text style={ProfileStyles.errorText}>{errors.fullName}</Text> : null}
          </View>

    
          <View style={ProfileStyles.inputGroup}>
            <Text style={ProfileStyles.label}>{t('emailAddress')}</Text>
            <View style={ProfileStyles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#666" style={ProfileStyles.inputIcon} />
              <TextInput
                style={[ProfileStyles.input, { color: '#999' }]}
                value={formData.email}
                editable={false}
                selectTextOnFocus={false}
                placeholderTextColor="#999"
              />
            </View>
            <Text style={ProfileStyles.helpText}>{t('emailUnchangeable')}</Text>
          </View>

  
          <View style={ProfileStyles.inputGroup}>
            <Text style={ProfileStyles.label}>{t('phoneNumber')}</Text>
            <View style={[ProfileStyles.inputContainer, errors.phoneNumber && ProfileStyles.inputError]}>
              <Ionicons name="call-outline" size={20} color="#666" style={ProfileStyles.inputIcon} />
              <TextInput
                style={ProfileStyles.input}
                placeholder={t('enterPhoneNumber')}
                value={formData.phoneNumber}
                onChangeText={(text) => handleChange("phoneNumber", text)}
                keyboardType="phone-pad"
                placeholderTextColor="#999"
              />
            </View>
            {errors.phoneNumber ? <Text style={ProfileStyles.errorText}>{errors.phoneNumber}</Text> : null}
          </View>

      
          <View style={ProfileStyles.inputGroup}>
            <Text style={ProfileStyles.label}>{t('address')}</Text>
            <View style={[ProfileStyles.inputContainer, errors.address && ProfileStyles.inputError]}>
              <Ionicons name="location-outline" size={20} color="#666" style={ProfileStyles.inputIcon} />
              <TextInput
                style={ProfileStyles.input}
                placeholder={t('enterAddress')}
                value={formData.address}
                onChangeText={(text) => handleChange("address", text)}
                placeholderTextColor="#999"
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
                <Text style={ProfileStyles.updateButtonText}>{t('updateProfile')}</Text>
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