import React from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Colors } from "../../theme/colors";
import { Ionicons } from "@expo/vector-icons";

import gameStyles from "./GameSyle";
import ServiceHeader from "../../components/ServiceHeader";
import { useTranslation } from "react-i18next";

export default function GameCoinsScreen({ navigation }) {
  const {t} = useTranslation();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
      <ServiceHeader title="Game Coins" onBack={() => navigation.goBack()} />
      <View style={gameStyles.center}>
        <View style={gameStyles.badge}>
          <Ionicons
            name="game-controller-outline"
            size={28}
            color={Colors.primary}
          />
        </View>
        <Text style={gameStyles.title}>{t("gameCoins")}</Text>
        <Text style={gameStyles.sub}>{t("thisFeatureComingSoon")}</Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={gameStyles.btn}
          activeOpacity={0.85}
        >
          <Text style={gameStyles.btnText}>{t("goBack")}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

