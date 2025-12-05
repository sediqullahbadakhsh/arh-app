import { Text, TouchableOpacity, View, Image } from "react-native";
import TopUpStyles from "./TopupStyle";
import { useState } from "react";
import { Colors } from "../../theme/colors";
import { codeToFlag } from "../../utils/flag";
import { DIAL_CODES } from "../../constants/dialing";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { scale } from "../../utils/normalizeSize";

function StepCountry({ country, onOpen }) {
  const { t } = useTranslation();
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={{ marginTop: 16, flex: 1 }}>
      <Text style={TopUpStyles.sectionTitle}>{t('selectCountry')}</Text>
      <TouchableOpacity
        style={[
          TopUpStyles.dropField,
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
      >
        <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
          <Text style={{ fontSize: 24, marginEnd: 12 }}>
            {codeToFlag(country?.countryCode)}
          </Text>
          <View>
            <Text style={{ color: Colors.textPrimary, fontSize: 16, fontWeight: '500', fontFamily: 'dmsansRegular' }}>
              {country?.countryName}
            </Text>
            <Text style={{ color: Colors.textSecondary, fontSize: 14, fontFamily: 'dmsansRegular' }}>
              {DIAL_CODES[country?.countryCode] || ""}
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-down" size={20} color="#7A7A7A" />
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

const styles = {
  watermarkContainer: {
    position: 'absolute',
    top: scale.hp(42), 
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: -1,
  },
  watermarkLogo: {
    width: scale.wp(67.5),  
    height: scale.wp(67.5),
    opacity: 0.1,
  },

};

export default StepCountry;