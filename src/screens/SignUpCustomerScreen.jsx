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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../theme/colors";
import AuthHeader from "../components/AuthHeader";
import InputField from "../components/InputField";
import PrimaryButton from "../components/PrimaryButton";
import { COUNTRIES } from "../constants/countries";
import { codeToFlag } from "../utils/flag";

const METHOD = { EMAIL: "email", PHONE: "phone" };

export default function SignUpCustomerScreen({ navigation }) {
  const [method, setMethod] = useState(METHOD.EMAIL);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [countryOpen, setCountryOpen] = useState(false);

  const defaultAf = useMemo(
    () => COUNTRIES.find((c) => c.code === "AF") || COUNTRIES[0],
    []
  );
  const [country, setCountry] = useState(defaultAf);

  const gotoOtp = () => {
    const target = method === METHOD.EMAIL ? email : phone;
    if (!target) return;
    navigation.navigate("OtpVerification", {
      channel: method,
      target,
      mode: "signup_customer", // IMPORTANT: OTP will route to success (not Tabs)
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
      <AuthHeader title="Register" onBack={() => navigation.goBack()} />

      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Create your account</Text>

        {/* Toggle (Email / Phone) */}
        <View style={styles.methodRow}>
          <Chip
            label="Email"
            active={method === METHOD.EMAIL}
            onPress={() => setMethod(METHOD.EMAIL)}
          />
          <View style={{ width: 10 }} />
          <Chip
            label="Phone"
            active={method === METHOD.PHONE}
            onPress={() => setMethod(METHOD.PHONE)}
          />
        </View>

        {method === METHOD.EMAIL ? (
          <InputField
            value={email}
            onChangeText={setEmail}
            placeholder="Enter Your Email Address"
            keyboardType="email-address"
            rightIcon={
              <Ionicons name="mail-outline" size={18} color="#A9A9A9" />
            }
          />
        ) : (
          <View style={styles.phoneWrap}>
            <View style={styles.phoneInputCell}>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="Enter Your Phone Number"
                placeholderTextColor="#B8B8B8"
                keyboardType="phone-pad"
                style={styles.phoneInput}
              />
            </View>
            <TouchableOpacity
              style={styles.phoneCountryCell}
              onPress={() => setCountryOpen(true)}
              activeOpacity={0.85}
            >
              <Text style={{ fontSize: 16, marginRight: 6 }}>
                {codeToFlag(country?.code || "AF")}
              </Text>
              <Text style={styles.phoneCountryCode}>
                {(country?.code || "AFG").toUpperCase()}
              </Text>
              <Ionicons
                name="chevron-down"
                size={16}
                color="#7A7A7A"
                style={{ marginLeft: 6 }}
              />
            </TouchableOpacity>
          </View>
        )}

        <PrimaryButton
          label="Continue"
          onPress={gotoOtp}
          style={{ marginTop: 20 }}
        />
      </View>

      {/* Country modal */}
      <Modal
        visible={countryOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setCountryOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Country</Text>
              <TouchableOpacity
                onPress={() => setCountryOpen(false)}
                style={{ padding: 6 }}
              >
                <Ionicons name="close" size={20} color="#333" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={COUNTRIES}
              keyExtractor={(it) => it.code}
              ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalRow}
                  onPress={() => {
                    setCountry(item);
                    setCountryOpen(false);
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={{ fontSize: 18, marginRight: 8 }}>
                    {codeToFlag(item.code)}
                  </Text>
                  <Text
                    style={{ flex: 1, fontSize: 15, color: Colors.textPrimary }}
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
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function Chip({ label, active, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={[styles.chip, active ? styles.chipActive : styles.chipIdle]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 18,
    backgroundColor: Colors.white,
  },
  sectionTitle: {
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: 10,
    fontWeight: "600",
  },
  methodRow: { flexDirection: "row", marginBottom: 14 },

  chip: {
    paddingHorizontal: 14,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
  },
  chipIdle: { backgroundColor: "#F3F3F4" },
  chipActive: {
    backgroundColor: "#FFE5E5",
    borderWidth: 1,
    borderColor: "#FFC7C7",
  },
  chipText: { fontSize: 13, color: Colors.textSecondary, fontWeight: "600" },
  chipTextActive: { color: Colors.primary },

  phoneWrap: {
    flexDirection: "row",
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E6E6E6",
    overflow: "hidden",
    backgroundColor: "#fff",
  },
  phoneInputCell: { flex: 1, justifyContent: "center", paddingHorizontal: 14 },
  phoneInput: { fontSize: 14, color: Colors.textPrimary },
  phoneCountryCell: {
    width: 112,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderLeftWidth: 1,
    borderLeftColor: "#EEE",
    backgroundColor: "#FAFAFA",
  },
  phoneCountryCode: {
    fontSize: 13,
    color: Colors.textPrimary,
    fontWeight: "600",
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.25)",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    maxHeight: "70%",
    elevation: 4,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  modalTitle: { fontSize: 16, fontWeight: "700", color: Colors.textPrimary },
  modalRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 8,
    backgroundColor: "#fff",
  },
});
