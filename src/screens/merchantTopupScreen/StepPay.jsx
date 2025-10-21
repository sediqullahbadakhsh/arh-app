import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Colors } from "../../theme/colors";
import { useTranslation } from "react-i18next";

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
  container: { marginTop: 12 },
  editHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "400",
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  editLink: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: "600",
  },
  summaryCard: {
    marginTop: 18,
    borderWidth: 1,
    borderColor: "#F2DAD7",
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  summaryKey: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  summaryValue: {
    color: Colors.textPrimary,
    fontSize: 13,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#F2F2F2",
    paddingTop: 8,
    marginTop: 6,
  },
  totalKey: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: "700",
  },
  totalValue: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: "700",
  },
});