import React, { useState } from "react";
import { Text, TouchableOpacity, View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../theme/colors";
import { codeToFlag } from "../../utils/flag";
import { useTranslation } from "react-i18next";

function StepCountry({ country, onOpen }) {
  const { t } = useTranslation();
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>{t('selectCountryToSend')}</Text>
      <TouchableOpacity
        style={[
          styles.dropField,
          {
            borderColor: isFocused ? Colors.primary : '#E5E7EB',
            backgroundColor: '#FFFFFF',
            shadowColor: Colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: isFocused ? 0.15 : 0,
            shadowRadius: isFocused ? 10 : 0,
            elevation: isFocused ? 3 : 0,
          }
        ]}
        onPress={onOpen}
        activeOpacity={0.85}
        onPressIn={() => setIsFocused(true)}
        onPressOut={() => setIsFocused(false)}
      >
        <View style={styles.countryContent}>
          <Text style={styles.flag}>
            {codeToFlag(country?.countryCode)}
          </Text>
          <Text style={styles.countryName}>
            {country?.countryName || t('selectCountry')}
          </Text>
        </View>
        <Ionicons name="chevron-down" size={18} color="#7A7A7A" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    marginTop: 16 
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "400",
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  dropField: {
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  countryContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  flag: {
    fontSize: 18,
    marginRight: 8,
  },
  countryName: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontFamily: 'dmsansRegular',
  },
});

export default StepCountry;