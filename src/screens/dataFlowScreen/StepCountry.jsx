import { useState } from "react";
import DataStyles from "./DataStyles";
import { Image, Text, TouchableOpacity, View, StyleSheet } from "react-native";
import { codeToFlag } from "../../utils/flag";
import { DIAL_CODES } from "../../constants/dialing";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../theme/colors";
import { useTranslation } from "react-i18next";

function StepCountry({ country, onOpen, loading }) {
  const [isFocused, setIsFocused] = useState(false);
  const { t } = useTranslation();

  return (
    <View style={{ marginTop: 16 }}>
      <Text style={DataStyles.sectionTitle}>
        {t('selectCountryYouWantToSend')}
      </Text>
      <TouchableOpacity
        style={[
          DataStyles.dropField,
          {
            borderColor: isFocused ? Colors.primary : '#E4E7EC',
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
        disabled={loading}
      >
        <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
          {country ? (
            <>
              <Text style={{ fontSize: 24, marginEnd: 12 }}>
                {codeToFlag(country?.countryCode)}
              </Text>
              <View>
                <Text style={{ color: Colors.textPrimary, fontSize: 16, fontWeight: '500' }}>
                  {country?.countryName}
                </Text>
                <Text style={{ color: Colors.textSecondary, fontSize: 14 }}>
                  {DIAL_CODES[country?.countryCode] || ""}
                </Text>
              </View>
            </>
          ) : (
            <Text style={{ color: Colors.textSecondary }}>
              {loading ? t('loading') : t('selectCountry')}
            </Text>
          )}
        </View>
        <Ionicons 
          name="chevron-down" 
          size={20} 
          color={loading ? "#CCCCCC" : "#7A7A7A"} 
        />
      </TouchableOpacity>
      <View style={styles.watermarkContainer}>
        <Image 
          source={require('../../../assets/logo4.png')} 
          style={styles.watermarkLogo}
          resizeMode="contain"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  watermarkContainer: {
    position: 'absolute',
    top: 300,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: -1,
  },
  watermarkLogo: {
    width: 270,
    height: 270,
    opacity: 0.1, 
  }
});

export default StepCountry;