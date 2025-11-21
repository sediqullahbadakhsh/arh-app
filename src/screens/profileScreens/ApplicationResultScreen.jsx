import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../theme/colors";
import PrimaryButton from "../../components/PrimaryButton";
import { scale } from "../../utils/normalizeSize";
import { useTranslation } from "react-i18next";

export default function ApplicationResultScreen({ navigation, route }) {
  const { t } = useTranslation();
  const { title, message, cta } = route.params;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="checkmark-circle" size={80} color={Colors.primary} />
        </View>
        
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
        
        <PrimaryButton
          label={cta || t('done')}
          onPress={() => navigation.navigate("Profile")}
          style={styles.button}
        />
        
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate("Home")}
        >
          <Text style={styles.secondaryButtonText}>{t('goToHome')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: scale.wp(6.2),
  },
  iconContainer: {
    marginBottom: scale.hp(3.1),
  },
  title: {
    fontSize: scale.hp(3.1),
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: scale.hp(2.1),
    textAlign: "center",
  },
  message: {
    fontSize: scale.hp(2.1),
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: scale.hp(4.2),
    lineHeight: scale.hp(3.1),
  },
  button: {
    width: "100%",
    marginBottom: scale.hp(2.1),
  },
  secondaryButton: {
    padding: scale.hp(2.1),
  },
  secondaryButtonText: {
    color: Colors.primary,
    fontSize: scale.hp(2.1),
    fontWeight: "600",
  },
});