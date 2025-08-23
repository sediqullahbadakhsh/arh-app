// src/screens/SignUpMerchantScreen.jsx
import React, { useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  FlatList,
  Image,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { Colors } from "../theme/colors";
import AuthHeader from "../components/AuthHeader";
import InputField from "../components/InputField";
import PrimaryButton from "../components/PrimaryButton";
import { COUNTRIES } from "../constants/countries";
import { codeToFlag } from "../utils/flag";
import { merchantSignup } from "../services/merchantApi";

const PROVINCES = ["Kabul", "Herat", "Kandahar", "Nangarhar"];
const DISTRICTS = ["District 1", "District 2", "District 3"];
const LANGS = ["English", "Dari", "Pashto"];

const GAP = 1;

export default function SignUpMerchantScreen({ navigation }) {
  const [step, setStep] = useState(0);

  // Step 1
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [father, setFather] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Step 2
  const defaultAf = useMemo(
    () => COUNTRIES.find((c) => c.code === "AF") || COUNTRIES[0],
    []
  );
  const [country, setCountry] = useState(defaultAf);
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [address, setAddress] = useState("");
  const [lang, setLang] = useState("");
  const [picker, setPicker] = useState({ open: false, type: null });

  // Step 3 (KYC)
  const [photoUri, setPhotoUri] = useState(null);
  const [idFile, setIdFile] = useState(null);

  const next = () => setStep((s) => Math.min(2, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));

  const submit = async () => {
    try {
      const payload = {
        username: email?.split("@")[0] || "merchant",
        email,
        mobileNumber: phone.replace(/[^\d]/g, ""),
        user_type: "merchant",
        status: "active",
        profile_picture: null, // fill with base64 if you want
        country: "4",
        province: "4",
        district: "2",
        address,
        alternativeContact: null,
        messageLanguage: "english",
        accountType: "merchant",
        registrationType: "direct",
        businessType: "1",
        parentAgentId: null,
      };
      await merchantSignup(payload);
      navigation.replace("SignupResult", {
        type: "merchant",
        title: "Application Submitted",
        message:
          "Your application has been submitted. We’ll email you updates.",
        cta: "Go Back",
      });
    } catch (e) {
      alert(e.message);
    }
  };
  // ---- Camera / File pickers ----
  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      alert("Camera permission is required.");
      return;
    }
    const res = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.7,
    });
    if (!res.canceled) {
      const uri = res.assets?.[0]?.uri;
      if (uri) setPhotoUri(uri);
    }
  };

  const pickIdFile = async () => {
    const res = await DocumentPicker.getDocumentAsync({
      type: ["image/*", "application/pdf"],
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (res.canceled) return;
    const file = res.assets ? res.assets[0] : res;
    setIdFile({
      uri: file.uri,
      name: file.name || "document",
      mimeType: file.mimeType,
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
      <AuthHeader
        title="Register"
        onBack={() => (step === 0 ? navigation.goBack() : back())}
      />

      {/* Step indicator */}
      <View style={styles.stepperWrap}>
        <StepDot index={0} current={step} label="Personal" />
        <StepLine active={step >= 1} />
        <StepDot index={1} current={step} label="Additional" />
        <StepLine active={step >= 2} />
        <StepDot index={2} current={step} label="Intermediate" />
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {step === 0 && (
          <>
            <Text style={styles.sectionTitle}>Personal Information</Text>

            <LabeledInput
              label="First Name"
              value={first}
              onChangeText={setFirst}
              placeholder="Enter First Name"
            />
            <LabeledInput
              label="Last Name"
              value={last}
              onChangeText={setLast}
              placeholder="Enter Last Name"
            />
            <LabeledInput
              label="Father Name"
              value={father}
              onChangeText={setFather}
              placeholder="Enter Father Name"
            />
            <LabeledInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="Enter Your Email Address"
              keyboardType="email-address"
            />
            <LabeledInput
              label="Phone Number"
              value={phone}
              onChangeText={setPhone}
              placeholder="Enter Your Phone Number"
              keyboardType="phone-pad"
            />

            {/* Full-width primary button */}
            <PrimaryButton
              label="Continue"
              onPress={next}
              style={styles.fullButton}
            />
          </>
        )}

        {step === 1 && (
          <>
            <Text style={styles.sectionTitle}>Additional Information</Text>

            <DropField
              label="Country"
              value={country?.name || "Select Country"}
              onPress={() => setPicker({ open: true, type: "country" })}
              leftIcon={
                <Text style={{ fontSize: 18 }}>
                  {codeToFlag(country?.code || "AF")}
                </Text>
              }
            />
            <DropField
              label="Province"
              value={province || "Select Province"}
              onPress={() => setPicker({ open: true, type: "province" })}
            />
            <DropField
              label="District"
              value={district || "Select District"}
              onPress={() => setPicker({ open: true, type: "district" })}
            />
            <LabeledInput
              label="Full Address"
              value={address}
              onChangeText={setAddress}
              placeholder="Enter Full Address"
            />
            <DropField
              label="Select Language"
              value={lang || "Select Language"}
              onPress={() => setPicker({ open: true, type: "lang" })}
            />

            {/* Half-width buttons */}
            <View style={styles.rowButtons}>
              <DarkButton
                label="Back"
                onPress={back}
                style={styles.halfButton}
              />
              <PrimaryButton
                label="Continue"
                onPress={next}
                style={styles.halfButton}
              />
            </View>
          </>
        )}

        {step === 2 && (
          <>
            <Text style={styles.sectionTitle}>Intermediate Information</Text>

            <View style={styles.photoBox}>
              {photoUri ? (
                <Image
                  source={{ uri: photoUri }}
                  style={{ width: "100%", height: "100%" }}
                />
              ) : (
                <View style={styles.photoPlaceholder} />
              )}
            </View>

            <TouchableOpacity
              style={styles.takePhotoBtn}
              activeOpacity={0.9}
              onPress={takePhoto}
            >
              <Ionicons name="camera-outline" size={18} color="#fff" />
              <Text style={{ color: "#fff", fontWeight: "600", marginLeft: 8 }}>
                Take Photo
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.uploadBox}
              onPress={pickIdFile}
              activeOpacity={0.9}
            >
              <Ionicons name="cloud-upload-outline" size={20} color="#9E9E9E" />
              <Text style={{ color: "#9E9E9E", marginTop: 8 }}>
                {idFile ? idFile.name : "Upload Your Identify Number"}
              </Text>
            </TouchableOpacity>

            <View style={styles.rowButtons}>
              <DarkButton
                label="Back"
                onPress={back}
                style={styles.halfButton}
              />
              <PrimaryButton
                label="Submit"
                onPress={submit}
                style={styles.halfButton}
              />
            </View>
          </>
        )}
      </ScrollView>

      {/* Picker modal */}
      <Modal
        transparent
        visible={picker.open}
        animationType="fade"
        onRequestClose={() => setPicker({ open: false })}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select</Text>
              <TouchableOpacity
                onPress={() => setPicker({ open: false })}
                style={{ padding: 6 }}
              >
                <Ionicons name="close" size={20} color="#333" />
              </TouchableOpacity>
            </View>

            {picker.type === "country" && (
              <FlatList
                data={COUNTRIES}
                keyExtractor={(it) => it.code}
                ItemSeparatorComponent={() => <View style={{ height: GAP }} />}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.modalRow}
                    onPress={() => {
                      setCountry(item);
                      setPicker({ open: false });
                    }}
                    activeOpacity={0.85}
                  >
                    <Text style={{ fontSize: 18, marginRight: 8 }}>
                      {codeToFlag(item.code)}
                    </Text>
                    <Text
                      style={{
                        flex: 1,
                        fontSize: 15,
                        color: Colors.textPrimary,
                      }}
                    >
                      {item.name}
                    </Text>
                    {item.code === country?.code && (
                      <Ionicons
                        name="checkmark-circle"
                        color={Colors.primary}
                        size={18}
                      />
                    )}
                  </TouchableOpacity>
                )}
              />
            )}

            {picker.type === "province" && (
              <FlatList
                data={PROVINCES}
                keyExtractor={(it) => it}
                ItemSeparatorComponent={() => <View style={{ height: GAP }} />}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.modalRow}
                    onPress={() => {
                      setProvince(item);
                      setPicker({ open: false });
                    }}
                    activeOpacity={0.85}
                  >
                    <Text
                      style={{
                        flex: 1,
                        fontSize: 15,
                        color: Colors.textPrimary,
                      }}
                    >
                      {item}
                    </Text>
                    {item === province && (
                      <Ionicons
                        name="checkmark-circle"
                        color={Colors.primary}
                        size={18}
                      />
                    )}
                  </TouchableOpacity>
                )}
              />
            )}

            {picker.type === "district" && (
              <FlatList
                data={DISTRICTS}
                keyExtractor={(it) => it}
                ItemSeparatorComponent={() => <View style={{ height: GAP }} />}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.modalRow}
                    onPress={() => {
                      setDistrict(item);
                      setPicker({ open: false });
                    }}
                    activeOpacity={0.85}
                  >
                    <Text
                      style={{
                        flex: 1,
                        fontSize: 15,
                        color: Colors.textPrimary,
                      }}
                    >
                      {item}
                    </Text>
                    {item === district && (
                      <Ionicons
                        name="checkmark-circle"
                        color={Colors.primary}
                        size={18}
                      />
                    )}
                  </TouchableOpacity>
                )}
              />
            )}

            {picker.type === "lang" && (
              <FlatList
                data={LANGS}
                keyExtractor={(it) => it}
                ItemSeparatorComponent={() => <View style={{ height: GAP }} />}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.modalRow}
                    onPress={() => {
                      setLang(item);
                      setPicker({ open: false });
                    }}
                    activeOpacity={0.85}
                  >
                    <Text
                      style={{
                        flex: 1,
                        fontSize: 15,
                        color: Colors.textPrimary,
                      }}
                    >
                      {item}
                    </Text>
                    {item === lang && (
                      <Ionicons
                        name="checkmark-circle"
                        color={Colors.primary}
                        size={18}
                      />
                    )}
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/* ---------- atoms ---------- */
function LabeledInput({ label, placeholder, ...rest }) {
  return (
    <View style={{ marginBottom: GAP }}>
      <Text style={styles.label}>
        <Text style={{ color: "#F44336" }}>* </Text>
        {label}
      </Text>
      <InputField placeholder={placeholder} {...rest} />
    </View>
  );
}

function DropField({ label, value, onPress, leftIcon }) {
  return (
    <View style={{ marginBottom: 13 }}>
      <Text style={styles.label}>
        <Text style={{ color: "#F44336" }}>* </Text>
        {label}
      </Text>
      <TouchableOpacity
        style={styles.dropField}
        onPress={onPress}
        activeOpacity={0.85}
      >
        <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
          {leftIcon ? <View style={{ marginRight: 8 }}>{leftIcon}</View> : null}
          <Text style={{ color: "#6B7280", fontSize: 14 }}>{value}</Text>
        </View>
        <Ionicons name="chevron-down" size={18} color="#7A7A7A" />
      </TouchableOpacity>
    </View>
  );
}

function DarkButton({ label, onPress, style, disabled }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      disabled={disabled}
      style={[styles.darkBtn, disabled && { opacity: 0.5 }, style]}
    >
      <Text style={styles.darkBtnText}>{label}</Text>
    </TouchableOpacity>
  );
}

function StepDot({ index, current, label }) {
  const active = current === index;
  const done = current > index;
  return (
    <View style={styles.stepItem}>
      <View
        style={[
          styles.stepDot,
          active && {
            backgroundColor: Colors.primary,
            borderColor: Colors.primary,
          },
          done && { backgroundColor: Colors.primary },
        ]}
      >
        {done ? (
          <Ionicons name="checkmark" size={12} color="#fff" />
        ) : (
          <Text style={[styles.stepNum, active && { color: "#fff" }]}>
            {index + 1}
          </Text>
        )}
      </View>
      <Text style={styles.stepLabel} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

function StepLine({ active }) {
  return (
    <View
      style={[styles.stepLine, active && { backgroundColor: Colors.primary }]}
    />
  );
}

/* ---------- styles ---------- */
const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 24,
    gap: GAP,
    backgroundColor: Colors.white,
  },

  // Stepper
  stepperWrap: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 10,
    backgroundColor: Colors.white,
  },
  stepItem: { alignItems: "center" },
  stepDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  stepNum: { fontSize: 12, color: Colors.textPrimary, fontWeight: "700" },
  stepLabel: {
    fontSize: 10,
    marginTop: 4,
    color: Colors.textSecondary,
    width: 72,
    textAlign: "center",
  },
  stepLine: {
    height: 2,
    width: 28,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 8,
  },

  sectionTitle: {
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: 6,
    fontWeight: "600",
  },
  label: { fontSize: 13, color: Colors.textPrimary, marginBottom: 4 },

  dropField: {
    height: 46,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 12,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
  },

  photoBox: {
    height: 200,
    borderRadius: 8,
    backgroundColor: "#E5E7EB",
    marginTop: GAP,
    overflow: "hidden",
  },
  photoPlaceholder: { flex: 1, backgroundColor: "#BDBDBD" },

  takePhotoBtn: {
    alignSelf: "center",
    marginVertical: 12,
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  uploadBox: {
    height: 84,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#D7D7D7",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },

  // Buttons
  fullButton: { marginTop: 12 }, // full width PrimaryButton
  rowButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },
  halfButton: { width: "48%" }, // ~half width for both buttons
  darkBtn: {
    height: 50,
    borderRadius: 25,
    backgroundColor: "#2B2B2B",
    alignItems: "center",
    justifyContent: "center",
  },
  darkBtnText: { color: "#fff", fontSize: 15, fontWeight: "600" },
});
