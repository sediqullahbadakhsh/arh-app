import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Colors } from "../../theme/colors";
import { useTranslation } from "react-i18next";
import { scale } from "../../utils/normalizeSize";

export default function StepPay({ summary, onEditNumber }) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={styles.editHeader}>
        <Text style={styles.sectionTitle}>{t('confirmTopup')}</Text>
        <TouchableOpacity onPress={onEditNumber}>
          <Text style={styles.editLink}>{t('changeNumber')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryKey}>{t('mobileNumber')}</Text>
          <Text style={styles.summaryValue}>{summary.mobile}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryKey}>{t('amount')}</Text>
          <Text style={styles.summaryValue}>{summary.amount} AFN</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalKey}>{t('totalAmount')}</Text>
          <Text style={styles.totalValue}>{summary.amount} AFN</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: scale.hp(1.55),
  },
  editHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: scale.hp(1.05),
  },
  sectionTitle: {
    fontSize: scale.hp(1.8),
    fontWeight: "400",
    color: Colors.textPrimary,
    marginBottom: scale.hp(1.55),
  },
  editLink: {
    color: Colors.primary,
    fontSize: scale.hp(1.7),
    fontWeight: "600",
  },
  summaryCard: {
    marginTop: scale.hp(2.35),
    borderWidth: 1,
    borderColor: "#F2DAD7",
    backgroundColor: "#FFF",
    borderRadius: scale.hp(1.55),
    padding: scale.hp(1.55),
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: scale.hp(0.5),
  },
  summaryKey: {
    color: Colors.textSecondary,
    fontSize: scale.hp(1.7),
  },
  summaryValue: {
    color: Colors.textPrimary,
    fontSize: scale.hp(1.7),
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#F2F2F2",
    paddingTop: scale.hp(1.05),
    marginTop: scale.hp(0.8),
  },
  totalKey: {
    color: Colors.textSecondary,
    fontSize: scale.hp(1.7),
    fontWeight: "700",
  },
  totalValue: {
    color: Colors.primary,
    fontSize: scale.hp(1.7),
    fontWeight: "700",
  },
});