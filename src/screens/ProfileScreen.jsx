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
import { useTranslation } from "react-i18next";
import { isRTL } from "../utils/rtl";
import ValidationModal from "../components/ValidationModal";
import { useModal } from "../hooks/useModal";
import { scale } from "../utils/normalizeSize";

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const [avatar, setAvatar] = useState(null);
  const [customerData, setCustomerData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const {showModal, modal, hideModal} = useModal();
  const fetchCustomerProfile = async () => {
    try {
      setFetching(true);
      const response = await getCustomerProfile();
      if (response.success) {
        setCustomerData(response.data);
        
        if (response.data.profileImg) {
          const fullImageUrl = response.data.profileImg.startsWith('http') 
            ? response.data.profileImg 
            : `http://3.67.144.22/backend/uploads/customer_pictures/${response.data.profileImg}`;
          setAvatar(fullImageUrl);
        }
      }
    } catch (error) {
      console.error("Error fetching customer profile:", error);
      showModal(t('error'), t('errors.loadTransactions'));
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
        Alert.alert(t('error'), t('errors.loadTransactions'));
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
      Alert.alert(t('error'), t('errors.loadTransactions'));
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
        Alert.alert(t('success'), t('status.succeeded'));
        fetchCustomerProfile();
      } else {
        Alert.alert(t('error'), response.message || t('errors.loadTransactions'));
      }
    } catch (error) {
      console.error("Update profile image error:", error);
      Alert.alert(t('error'), t('errors.loadTransactions'));
    } finally {
      setLoading(false);
    }
  };

  const goProfileDetails = () =>
    navigation.navigate("profileDetails", { title: t('profileDetails') });
  const goManageLanguage = () =>
    navigation.navigate("languageScreen", { title: t('manageLanguage') });
  const goSecurity = () =>
    navigation.navigate("securityScreen", { title: t('security') });
  const goMerchant = () =>
    navigation.navigate("MerchantApplication", { title: t('applyForMerchant') });
  const goAboutApp = () => navigation.navigate("aboutAppScreen", { title: t('aboutApp') });
  const goContactUs = () => navigation.navigate("contactUsScreen", { title: t('contactUs') });
  const goAboutUs = () => navigation.navigate("AboutUsScreen", { title: t('aboutUs') });

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
    return t('customer');
  };

  const SkeletonLoader = () => (
    <SafeAreaView style={styles.safeArea}>
           <ValidationModal
              visible={modal.visible}
              title={modal.title}
              message={modal.message}
              onClose={hideModal}
            />
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

          <View style={styles.skeletonCard}>
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
                title={t('profile')}
                subtitle={t('services.title')}
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
                title={t('language')}
                subtitle={t('services.title')}
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
                title={t('security')}
                subtitle={t('services.title')}
                onPress={goSecurity}
              />
              
              <ProfileRow
                icon={
                  <Ionicons
                    name="business-outline"
                    size={22}
                    color={Colors.primary}
                  />
                }
                title={t('applyForMerchant')}
                subtitle={t('services.title')}
                onPress={goMerchant}
              />
              <ProfileRow
  icon={
    <Ionicons name="pricetag-outline" size={22} color={Colors.primary} />
  }
  title={t('promoCodes')}
  subtitle={t('services.title')}
  onPress={() => navigation.navigate('PromoCodes')}
/>
              <ProfileRow
                icon={
                  <Ionicons name="refresh-circle-outline" size={22} color={Colors.primary} />
                }
                title={t('aboutApp')}
                subtitle={t('services.title')}
                onPress={goAboutApp}
              />
              
              <ProfileRow
                icon={
                  <Ionicons name="headset-outline" size={22} color={Colors.primary} />
                }
                title={t('contactUs')}
                subtitle={t('services.title')}
                onPress={goContactUs}
              />
              
              <ProfileRow
                icon={
                  <Ionicons name="information-circle-outline" size={22} color={Colors.primary} />
                }
                title={t('aboutUs')}
                subtitle={t('services.title')}
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
                title={t('logout')}
                subtitle={t('services.title')}
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
      <Ionicons name={isRTL ? "chevron-forward" : "chevron-forward"}  size={18} color="#BDBDBD" />
    </TouchableOpacity>
  );
}

const AVATAR_SIZE = 150;
const EDIT_SIZE = 32;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  menuWrapper: {
    flex: 1,
    backgroundColor: Colors.white,
    marginTop: scale.hp(13),
  },
  header: {
    height: scale.hp(19.4),
    paddingHorizontal: scale.wp(6.2),
    paddingTop: Platform.OS === "android" ? scale.hp(3.1) : 0,
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
    borderWidth: scale.hp(0.4),
    borderColor: "#fff",
  },
  avatarPlaceholder: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: "#000",
    borderWidth: scale.hp(0.4),
    borderColor: "#fff",
    zIndex: 99,
    justifyContent: "center",
    alignItems: "center",
  },
  editBtn: {
    position: "absolute",
    right: scale.wp(-1),
    bottom: scale.hp(-0.5),
    width: EDIT_SIZE,
    height: EDIT_SIZE,
    borderRadius: EDIT_SIZE / 2,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: scale.hp(0.26),
    shadowOffset: { width: 0, height: scale.hp(0.13) },
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
    width: scale.hp(0.8),
    height: scale.hp(0.8),
    borderRadius: scale.hp(0.4),
    backgroundColor: Colors.primary,
  },
  decoration1: {
    position: "absolute",
    top: scale.hp(2),
    right: -186,
    backgroundColor: "#FFFFFF0A",
    height: scale.hp(10.4),
    width: "100%",
    transform: [{ rotate: "130deg" }],
  },
  decoration2: {
    position: "absolute",
    top: scale.hp(2),
    right: -300,
    backgroundColor: "#FFFFFF14",
    height: scale.hp(15.5),
    width: "100%",
    transform: [{ rotate: "130deg" }],
  },
  body: {
    flex: 1,
    paddingHorizontal: scale.wp(6.2),
    paddingBottom: scale.hp(15.5),
  },
  nameRow: {
    flexDirection: "row",
    alignSelf: "center",
    alignItems: "center",
    marginBottom: scale.hp(2.1),
  },
  nameText: {
    color: Colors.textPrimary,
    fontSize: scale.hp(2.6),
    fontWeight: "600",
  },
  skeletonCard: {
    paddingVertical: scale.hp(1.3),
    marginTop: scale.hp(6.5),
    overflow: "hidden",
  },
  card: {
    paddingVertical: scale.hp(1.3),
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    direction: 'ltr',
    gap: scale.wp(2.6),
    paddingVertical: scale.hp(1.55),
    paddingHorizontal: scale.wp(4.2),
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F3F3F3",
    marginBottom: scale.hp(1.3),
    justifyContent: "space-between",
    borderRadius: scale.hp(1.3),
    backgroundColor: '#fff',
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  rowIcon: {
    width: scale.wp(8.3),
    height: scale.wp(8.3),
    borderRadius: scale.hp(0.8),
    backgroundColor: "#FFF5F5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: scale.wp(3.1),
  },
  rowTitle: {
    color: Colors.textPrimary,
    fontSize: scale.hp(1.95),
    fontWeight: "500",
  },
  rowSubtitle: {
    color: "#9E9E9E",
    fontSize: scale.hp(1.55),
    marginTop: scale.hp(0.26),
  },
  skeletonAvatar: {
    backgroundColor: '#E0E0E0',
    borderColor: '#E0E0E0',
  },
  skeletonIcon: {
    width: scale.wp(12.4),
    height: scale.wp(12.4),
    borderRadius: scale.wp(6.2),
    backgroundColor: '#BDBDBD',
  },
  skeletonName: {
    width: scale.wp(31.2),
    height: scale.hp(2.6),
    backgroundColor: '#E0E0E0',
    borderRadius: scale.hp(0.5),
    marginRight: scale.wp(2.1),
  },
  skeletonCheckmark: {
    width: scale.wp(4.2),
    height: scale.wp(4.2),
    backgroundColor: '#E0E0E0',
    borderRadius: scale.wp(2.1),
  },
  skeletonRow: {
    flexDirection: "row",
    gap: scale.wp(2.6),
    paddingVertical: scale.hp(1.55),
    paddingHorizontal: scale.wp(4.2),
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F3F3F3",
    marginBottom: scale.hp(1.3),
    justifyContent: "space-between",
    borderRadius: scale.hp(1.3),
    backgroundColor: '#fff',
  },
  skeletonRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  skeletonIconContainer: {
    width: scale.wp(8.3),
    height: scale.wp(8.3),
    borderRadius: scale.hp(0.8),
    backgroundColor: '#E0E0E0',
    marginRight: scale.wp(3.1),
  },
  skeletonTextContainer: {
    flex: 1,
  },
  skeletonTitle: {
    width: '60%',
    height: scale.hp(1.95),
    backgroundColor: '#E0E0E0',
    borderRadius: scale.hp(0.5),
    marginBottom: scale.hp(0.8),
  },
  skeletonSubtitle: {
    width: '80%',
    height: scale.hp(1.55),
    backgroundColor: '#E0E0E0',
    borderRadius: scale.hp(0.5),
  },
  skeletonChevron: {
    width: scale.wp(4.7),
    height: scale.wp(4.7),
    backgroundColor: '#E0E0E0',
    borderRadius: scale.wp(2.4),
  },
});