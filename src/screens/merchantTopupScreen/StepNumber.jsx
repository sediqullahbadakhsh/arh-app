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
import { scale } from "../../utils/normalizeSize";

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
  container: {
    marginTop: scale.hp(1.55),
    gap: scale.hp(2.1),
  },
  editHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  editLinks: {
    flexDirection: "row",
    gap: scale.wp(3.9),
  },
  editLink: {
    color: Colors.primary,
    fontSize: scale.hp(1.7),
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: scale.hp(1.8),
    fontWeight: "400",
    color: Colors.textPrimary,
    marginBottom: scale.hp(1.55),
  },
  phoneRow: {
    flexDirection: "row",
    height: scale.hp(6.2),
    borderRadius: scale.hp(3.1),
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
    width: scale.wp(12.65),
    height: scale.wp(12.65),
    paddingLeft: scale.wp(2.4),
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
    marginRight: scale.wp(2.4),
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: scale.wp(3.4),
    fontSize: scale.hp(1.8),
    color: Colors.textPrimary,
  },
  contactButton: {
    paddingHorizontal: scale.wp(2.4),
    justifyContent: "center",
  },
  operatorInfo: {
    marginTop: scale.hp(1.3),
    minHeight: scale.hp(3.1),
  },
  autoDetectText: {
    color: "#9E9E9E",
    fontSize: scale.hp(1.55),
  },
  amountSection: {},
  amountInput: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: scale.hp(2.6),
    flex: 1,
    paddingHorizontal: scale.wp(3.4),
    fontSize: scale.hp(1.8),
    color: Colors.textPrimary,
  },
});