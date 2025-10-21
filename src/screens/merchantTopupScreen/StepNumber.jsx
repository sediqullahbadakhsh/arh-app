import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../theme/colors";
import { getSetaraganMnoId } from "../../utils/getCompanyIdForSetaragan";
import { getMnoLogo } from "../../utils/getMnoLogo";
import { useTranslation } from "react-i18next";

export default function StepNumber({
  dial,
  country,
  value,
  onChange,
  amountAfn,
  onAmountChange,
  onEditCountry,
  openContacts,
}) {
  const { t } = useTranslation();
  const formatted = formatLocal(value);
  const operatorId = getSetaraganMnoId(value);

  const handleNumberChange = (text) => {
    const trimmed = value.trim();
    if (text.startsWith("0") && trimmed.length === 0) {
      Alert.alert(
        t('invalidNumber'),
        t('phoneNumberStartWith7')
      );
      const numeric = trimmed.replace(/^0+/, "");
      onChange(numeric);
      return;
    }
    onChange(text.replace(/\D/g, "").slice(0, 9));
  };

  return (
    <View style={styles.container}>
      <View style={styles.editHeader}>
        <Text style={styles.sectionTitle}>{t('mobileNumber')}</Text>
        <View style={styles.editLinks}>
          <TouchableOpacity onPress={openContacts}>
            <Text style={styles.editLink}>{t('contacts')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onEditCountry}>
            <Text style={styles.editLink}>{t('changeCountry')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.phoneRow}>
        <View style={styles.phonePrefix}>
          {value.length > 1 && (
            <View style={styles.operatorLogo}>
              <Image 
                source={getMnoLogo(operatorId)} 
                style={styles.logoImage} 
              />
            </View>
          )}
          <Text style={styles.dialCode}>{dial}</Text>
        </View>
        <TextInput
          value={formatted}
          onChangeText={handleNumberChange}
          keyboardType="number-pad"
          placeholder="700-000-000"
          placeholderTextColor="#B8B8B8"
          style={styles.phoneInput}
        />
        <TouchableOpacity
          onPress={openContacts}
          style={styles.contactButton}
        >
          <Ionicons name="person-circle-outline" size={22} color="#A9A9A9" />
        </TouchableOpacity>
      </View>

      <View style={styles.operatorInfo}>
        {operatorId ? (
          <View>
            {/* Operator info can be added here if needed */}
          </View>
        ) : (
          <Text style={styles.autoDetectText}>
            {t('autoDetectOperator')}
          </Text>
        )}
      </View>

      <View style={styles.amountSection}>
        <Text style={styles.sectionTitle}>{t('amount')}</Text>
        <TextInput
          value={amountAfn}
          onChangeText={onAmountChange}
          placeholder="0.00"
          keyboardType="decimal-pad"
          style={styles.amountInput}
        />
      </View>
    </View>
  );
}

function formatLocal(s) {
  const d = s.replace(/\D/g, "");
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6, 9)}`;
}

const styles = StyleSheet.create({
  container: { marginTop: 12, gap: 16 },
  editHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  editLinks: {
    flexDirection: "row",
    gap: 16,
  },
  editLink: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "400",
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  phoneRow: {
    flexDirection: "row",
    height: 48,
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E6E6E6",
    backgroundColor: "#fff",
  },
  phonePrefix: {
    paddingHorizontal: 0,
    flexDirection: "row",
    alignItems: "center",
    borderRightWidth: 1,
    borderRightColor: "#EEE",
    backgroundColor: "white",
  },
  operatorLogo: {
    width: 52,
    height: 52,
    paddingLeft: 10,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  logoImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
    borderRadius: 100,
  },
  dialCode: {
    fontWeight: "700",
    color: Colors.textPrimary,
    marginRight: 10,
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 14,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  contactButton: {
    paddingHorizontal: 10,
    justifyContent: "center",
  },
  operatorInfo: {
    marginTop: 10,
    minHeight: 24,
  },
  autoDetectText: {
    color: "#9E9E9E",
    fontSize: 12,
  },
  amountSection: {

  },
  amountInput: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 20,
    flex: 1,
    paddingHorizontal: 14,
    fontSize: 14,
    color: Colors.textPrimary,
  },
});