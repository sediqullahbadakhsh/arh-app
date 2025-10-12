import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../theme/colors";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../auth/AuthProvider";
import { getCustomerProfile, updateCustomerProfile } from "../services/authApi";

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [avatar, setAvatar] = useState(null);
  const [customerData, setCustomerData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const fetchCustomerProfile = async () => {
    try {
      setFetching(true);
      const response = await getCustomerProfile();
      if (response.success) {
        setCustomerData(response.data);
        
        if (response.data.profileImg) {
          const fullImageUrl = response.data.profileImg.startsWith('http') 
            ? response.data.profileImg 
            : `http://192.168.0.115:8081/uploads/customer_pictures/${response.data.profileImg}`;
          setAvatar(fullImageUrl);
        }
      }
    } catch (error) {
      console.error("Error fetching customer profile:", error);
      Alert.alert("Error", "Failed to load profile data");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchCustomerProfile();
  }, []);

  const handleEditAvatar = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission required", "Please allow access to your photos to change your profile picture.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setAvatar(result.assets[0].uri);
        await uploadProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert("Error", "Failed to open image gallery. Please try again.");
    }
  };

  const uploadProfileImage = async (imageUri) => {
    try {
      setLoading(true);
      const data = new FormData();
      
      if (imageUri.startsWith("file://")) {
        const filename = imageUri.split("/").pop();
        const match = /\.(\w+)$/.exec(filename || "");
        const type = match ? `image/${match[1]}` : "image/jpeg";

        data.append("profileImg", {
          uri: imageUri,
          name: filename || `profile-${Date.now()}.jpg`,
          type,
        });
      }

      const response = await updateCustomerProfile(data);
      if (response.success) {
        Alert.alert("Success", "Profile picture updated successfully");
        fetchCustomerProfile();
      } else {
        Alert.alert("Error", response.message || "Failed to update profile picture");
      }
    } catch (error) {
      console.error("Update profile image error:", error);
      Alert.alert("Error", "An error occurred while updating your profile picture");
    } finally {
      setLoading(false);
    }
  };

  const goProfileDetails = () =>
    navigation.navigate("profileDetails", { title: "Profile Details" });
  const goManageLanguage = () =>
    navigation.navigate("languageScreen", { title: "Manage Language" });
  const goSecurity = () =>
    navigation.navigate("securityScreen", { title: "Security" });
    const goMerchant = () =>
    navigation.navigate("MerchantApplication", { title: "Apply For Merchant Account" });
  const goAboutApp = () => navigation.navigate("aboutAppScreen", { title: "About App" });
  const goContactUs = () => navigation.navigate("contactUsScreen", { title: "Contact Us" });
  const goAboutUs = () => navigation.navigate("AboutUsScreen", { title: "About Us" });

  const handleLogout = async () => {
    try {
      await logout();
      navigation.reset({ index: 0, routes: [{ name: "Login" }] });
    } catch (e) {
      navigation.reset({ index: 0, routes: [{ name: "Login" }] });
    }
  };

  const getUserName = () => {
    if (customerData?.fullName) return customerData.fullName;
    if (customerData?.username) return customerData.username;
    if (user?.fullName) return user.fullName;
    if (user?.username) return user.username;
    return "Customer";
  };


  const SkeletonLoader = () => (
    <SafeAreaView style={styles.safeArea}>
   
      <LinearGradient
        colors={["#9F0901", "#E20E02"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.avatarWrapper}>
          <View style={[styles.avatarPlaceholder, styles.skeletonAvatar]}>
            <View style={styles.skeletonIcon} />
          </View>
        </View>
        
        <View style={styles.decoration1}></View>
        <View style={styles.decoration2}></View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.body}>
   
          <View style={styles.nameRow}>
            <View style={styles.skeletonName} />
            <View style={styles.skeletonCheckmark} />
          </View>

    
          <View style={styles.card}>
            {[1, 2, 3, 4, 5, 6, 7].map((item) => (
              <View key={item} style={styles.skeletonRow}>
                <View style={styles.skeletonRowLeft}>
                  <View style={styles.skeletonIconContainer} />
                  <View style={styles.skeletonTextContainer}>
                    <View style={styles.skeletonTitle} />
                    <View style={styles.skeletonSubtitle} />
                  </View>
                </View>
                <View style={styles.skeletonChevron} />
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );

  if (fetching) {
    return <SkeletonLoader />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={["#9F0901", "#E20E02"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.avatarWrapper}>
          {avatar ? (
            <Image 
              source={{ uri: avatar }} 
              style={styles.avatar}
              onError={(e) => {
                console.log('Image load error:', e.nativeEvent.error);
                setAvatar(null);
              }}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={48} color="#fff" />
            </View>
          )}

           <View style={styles.nameRow}>
            <Text style={styles.nameText}>{getUserName()}</Text>
            <Ionicons
              name="checkmark-circle"
              size={16}
              color={Colors.primary}
              style={{ marginLeft: 4 }}
            />
          </View>
        </View>
        
        <View style={styles.decoration1}></View>
        <View style={styles.decoration2}></View>
      </LinearGradient>
      <View style={styles.menuWrapper}>

      
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.body}>
          <View style={styles.card}>
            <ProfileRow
              icon={
                <Ionicons
                  name="person-circle-outline"
                  size={22}
                  color={Colors.primary}
                />
              }
              title="Profile"
              subtitle="View Your Profile and update"
              onPress={goProfileDetails}
            />

            <ProfileRow
              icon={
                <Ionicons
                  name="globe-outline"
                  size={22}
                  color={Colors.primary}
                />
              }
              title="Language"
              subtitle="Manage your language"
              onPress={goManageLanguage}
            />

            <ProfileRow
              icon={
                <Ionicons
                  name="key-outline"
                  size={22}
                  color={Colors.primary}
                />
              }
              title="Security"
              subtitle="setup your security"
              onPress={goSecurity}
            />
                <ProfileRow
              icon={
                <Ionicons
                  name="key-outline"
                  size={22}
                  color={Colors.primary}
                />
              }
              title="Apply for merchant account"
              subtitle="setup your security"
              onPress={goMerchant}
            />

            <ProfileRow
              icon={
                <Ionicons name="refresh-circle-outline" size={22} color={Colors.primary} />
              }
              title="About App"
              subtitle="Access additional features and informations."
              onPress={goAboutApp}
            />
            
            <ProfileRow
              icon={
                <Ionicons name="headset-outline" size={22} color={Colors.primary} />
              }
              title="Contact Us"
              subtitle="Access additional features and informations."
              onPress={goContactUs}
            />
            
            <ProfileRow
              icon={
                <Ionicons name="information-circle-outline" size={22} color={Colors.primary} />
              }
              title="About Us"
              subtitle="Access additional features and informations."
              onPress={goAboutUs}
            />

            <ProfileRow
              icon={
                <Ionicons
                  name="log-out-outline"
                  size={22}
                  color={Colors.primary}
                />
              }
              title="Logout"
              subtitle="Logout form eWallet"
              onPress={handleLogout}
            />
          </View>
        </View>
      </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function ProfileRow({ icon, title, subtitle, onPress }) {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
    >
      <View style={styles.rowLeft}>
        <View style={styles.rowIcon}>{icon}</View>
        <View>
          <Text style={styles.rowTitle}>{title}</Text>
          <Text style={styles.rowSubtitle}>{subtitle}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#BDBDBD" />
    </TouchableOpacity>
  );
}

const AVATAR_SIZE = 150;
const EDIT_SIZE = 32;

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: Colors.white 
  },
  menuWrapper: {
    flex: 1,
    backgroundColor: Colors.white,
    marginTop:   100,
  },
  header: {
    height: 150,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "android" ? 24 : 0,
    justifyContent: "flex-end",
    alignItems: "center",
    position: 'relative',
  },
  avatarWrapper: {
    position: "absolute",
    bottom: -AVATAR_SIZE / 2,
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 3,
    borderColor: "#fff",
  },
  avatarPlaceholder: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: "#000",
    borderWidth: 3,
    borderColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  editBtn: {
    position: "absolute",
    right: -4,
    bottom: -4,
    width: EDIT_SIZE,
    height: EDIT_SIZE,
    borderRadius: EDIT_SIZE / 2,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  editBtnDisabled: {
    opacity: 0.7,
  },
  loadingEdit: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  decoration1: {
    position: "absolute", 
    top: 15, 
    right: -186, 
    backgroundColor: "#FFFFFF0A", 
    height: 80, 
    width: "100%",
    transform: [{ rotate: "130deg" }],
  },
  decoration2: {
    position: "absolute", 
    top: 15, 
    right: -300, 
    backgroundColor: "#FFFFFF14", 
    height: 120, 
    width: "100%",
    transform: [{ rotate: "130deg" }],
  },
  body: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 120,
  },
  nameRow: {
    flexDirection: "row",
    alignSelf: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  nameText: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: "600",
  },
  card: {
    paddingVertical: 8,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F3F3F3",
    marginBottom: 10,
    justifyContent: "space-between",
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  rowLeft: { 
    flexDirection: "row", 
    alignItems: "center", 
    flex: 1 
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: "#FFF5F5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  rowTitle: { 
    color: Colors.textPrimary, 
    fontSize: 14, 
    fontWeight: "500" 
  },
  rowSubtitle: { 
    color: "#9E9E9E", 
    fontSize: 11, 
    marginTop: 2 
  },

  // Skeleton Styles
  skeletonAvatar: {
    backgroundColor: '#E0E0E0',
    borderColor: '#E0E0E0',
  },
  skeletonIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#BDBDBD',
  },
  skeletonName: {
    width: 120,
    height: 20,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginRight: 8,
  },
  skeletonCheckmark: {
    width: 16,
    height: 16,
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
  },
  skeletonRow: {
    flexDirection: "row",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F3F3F3",
    marginBottom: 10,
    justifyContent: "space-between",
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  skeletonRowLeft: { 
    flexDirection: "row", 
    alignItems: "center", 
    flex: 1 
  },
  skeletonIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#E0E0E0',
    marginRight: 12,
  },
  skeletonTextContainer: {
    flex: 1,
  },
  skeletonTitle: {
    width: '60%',
    height: 14,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: 6,
  },
  skeletonSubtitle: {
    width: '80%',
    height: 11,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
  },
  skeletonChevron: {
    width: 18,
    height: 18,
    backgroundColor: '#E0E0E0',
    borderRadius: 9,
  },
});