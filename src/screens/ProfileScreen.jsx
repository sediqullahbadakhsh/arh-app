import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { Colors } from "../theme/colors";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../auth/AuthProvider";
import { useUser } from "../context/userContext";

export default function ProfileScreen({ navigation }) {
  const {user} = useUser()
  const [avatar, setAvatar] = useState(null);
  const { logout } = useAuth();
  const userName = user?.username;

  const handleEditAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaType.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setAvatar(result.assets[0].uri);
    }
  };

  const goProfileDetails = () =>
    navigation.navigate("profileDetails", { title: "Profile Details" });
  const goManageLanguage = () =>
    navigation.navigate("languageScreen", { title: "Manage Language" });
  const goSecurity = () =>
    navigation.navigate("securityScreen", { title: "Security" });
  const goAboutApp = () => navigation.navigate("aboutAppScreen", { title: "About App" });
  const goContactUs = () => navigation.navigate("contactUsScreen", { title: "Contact Us" });
  const goAboutUs = () => navigation.navigate("AboutUsScreen", { title: "About Us" });

  const handleLogout = async () => {
    try {
      await logout(); // clears auth_token + auth_role + resets user
      navigation.reset({ index: 0, routes: [{ name: "Login" }] });
    } catch (e) {
      // fallback: still force to Login
      navigation.reset({ index: 0, routes: [{ name: "Login" }] });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Gradient Header */}
      <LinearGradient
        colors={["#9F0901", "#E20E02"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        {/* Avatar overlaps bottom of header */}
        <View style={styles.avatarWrapper}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={48} color="#fff" />
            </View>
          )}

          <TouchableOpacity style={styles.editBtn} onPress={handleEditAvatar}>
            <Ionicons name="create-outline" size={16} color="#000" />
          </TouchableOpacity>
        </View>
            <View style={{position: "absolute",  top:15, right: -186, backgroundColor: "#FFFFFF0A", height: 80, width: "100%",transform: [{ rotate: "130deg" }], // Rotate 45 degrees
                    justifyContent: "center",
                    alignItems: "center",}}></View>
                    
                          <View style={{position: "absolute",  top:15, right: -300, backgroundColor: "#FFFFFF14", height: 120, width: "100%",transform: [{ rotate: "130deg" }], // Rotate 45 degrees
                    justifyContent: "center",
                    alignItems: "center",}}></View>
      </LinearGradient>

      {/* Body */}
      <View style={styles.body}>
        {/* Name below avatar now */}
        <View style={styles.nameRow}>
          <Text style={styles.nameText}>{userName}</Text>
          <Ionicons
            name="checkmark-circle"
            size={16}
            color={Colors.primary}
            style={{ marginLeft: 4 }}
          />
        </View>

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
            isLast
            onPress={handleLogout}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

function ProfileRow({ icon, title, subtitle, onPress, isLast }) {
  return (
    <TouchableOpacity
      style={styles.row }
      // style={[styles.row, isLast && { borderBottomWidth: 0 }]}
      onPress={onPress}
    >
      <View style={styles.rowLeft}>
        <View style={styles.rowIcon}>{icon}</View>
        <View>
          <Text style={styles.rowTitle}>{title}</Text>
          {/* <Text style={styles.rowSubtitle}>{subtitle}</Text> */}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#BDBDBD" />
    </TouchableOpacity>
  );
}

const AVATAR_SIZE = 150; // slightly larger
const EDIT_SIZE = 32;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.white },

  header: {
    height: 200,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "android" ? 24 : 0,
    justifyContent: "flex-end",
    alignItems: "center",
  },

  avatarWrapper: {
    position: "absolute",
    bottom: -AVATAR_SIZE / 2, // overlap half
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

  // Dark placeholder background so it stands out
  avatarPlaceholder: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: "#000", // <- black background
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

  body: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: AVATAR_SIZE / 2 + 24, // space for overlapping avatar
  },

  // Name row moved into body, centered
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
    // backgroundColor: "#fff",
    // borderRadius: 20,
    // borderWidth: 1,
    // borderColor: "#F2F2F2",
    paddingVertical: 8,
    overflow: "hidden",
  },

  row: {
    flexDirection: "row",
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F3F3F3",
    marginBottom:10,
    justifyContent: "space-between",
    borderRadius: 10
  },
  rowLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: "#FFF5F5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  rowTitle: { color: Colors.textPrimary, fontSize: 14, fontWeight: "500" },
  rowSubtitle: { color: "#9E9E9E", fontSize: 11, marginTop: 2 },
});
