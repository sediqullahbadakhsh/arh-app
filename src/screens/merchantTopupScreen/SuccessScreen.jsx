import React from "react";
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../theme/colors";
import PrimaryButton from "../../components/PrimaryButton";
import { useTranslation } from "react-i18next";
import { scale } from "../../utils/normalizeSize";

export default function SuccessScreen({ success, onDone, onTopupMore }) {
  const { t } = useTranslation();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.successCircle}>
        <Ionicons name="checkmark" size={56} color="#4CAF50" />
      </View>
      <Text style={styles.successTitle}>{t('topupSuccessful')}</Text>

      <View style={styles.kv}>
        <Text style={styles.k}>{t('receiverNumber')}</Text>
        <Text style={styles.v}>{success.mobile}</Text>
      </View>
      <View style={styles.kv}>
        <Text style={styles.k}>{t('transactionId')}</Text>
        <Text style={styles.v}>{success.txId}</Text>
      </View>
      <View style={styles.kv}>
        <Text style={styles.k}>{t('date')}</Text>
        <Text style={styles.v}>
          {new Date(success.date).toLocaleString()}
        </Text>
      </View>

      <View style={styles.totalBox}>
        <Text style={styles.totalLabel}>{t('totalAmount')}</Text>
        <Text style={styles.totalValue}>{success.amountUsd} AFN</Text>
      </View>

      <PrimaryButton
        label={t('done')}
        onPress={onDone}
        style={{ width: "100%" }}
      />
      <TouchableOpacity onPress={onTopupMore}>
        <Text style={styles.topupMoreText}>
          {t('topupMore')}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: scale.hp(3.1),
    alignItems: "center",
  },
  successCircle: {
    width: scale.wp(23.4),
    height: scale.wp(23.4),
    borderRadius: scale.wp(11.7),
    backgroundColor: "rgba(76,175,80,0.1)",
    borderWidth: 2,
    borderColor: "rgba(76,175,80,0.35)",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: scale.hp(1.55),
  },
  successTitle: {
    fontSize: scale.hp(2.6),
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: scale.hp(2.1),
  },
  kv: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: scale.hp(0.8),
  },
  k: {
    color: Colors.textSecondary,
    fontSize: scale.hp(1.7),
  },
  v: {
    color: Colors.textPrimary,
    fontSize: scale.hp(1.7),
  },
  totalBox: {
    width: "100%",
    backgroundColor: "#F5F5F7",
    borderRadius: scale.hp(1.55),
    paddingVertical: scale.hp(1.8),
    alignItems: "center",
    marginVertical: scale.hp(2.35),
  },
  totalLabel: {
    color: Colors.textSecondary,
    fontSize: scale.hp(1.55),
  },
  totalValue: {
    color: Colors.textPrimary,
    fontSize: scale.hp(2.6),
    fontWeight: "700",
  },
  topupMoreText: {
    color: Colors.primary,
    marginTop: scale.hp(1.8),
    fontWeight: "600",
  },
});