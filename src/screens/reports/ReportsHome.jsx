import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../theme/colors";
import ServiceHeader from "../../components/ServiceHeader";
import { scale } from "../../utils/normalizeSize";
import { useTranslation } from "react-i18next";

const REPORT_TYPES = {
  STATEMENT: {
    key: "STATEMENT",
    title: "statementReport",
    description: "statementReportDescription",
    icon: "document-text-outline",
    color: "#CD0C02",
    gradient: ["#FFE5E5", "#FFF5F5"],
  },
};

export default function ReportsHome({ navigation }) {
  const { t } = useTranslation();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
      <ServiceHeader title={t('reportsAnalytics')} onBack={() => navigation.goBack()} />
      
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('financialReports')}</Text>
          <Text style={styles.subtitle}>
            {t('accessDetailedReports')}
          </Text>
        </View>

        <View style={styles.grid}>
          {Object.values(REPORT_TYPES).map((report) => (
            <TouchableOpacity
              key={report.key}
              style={[
                styles.tile,
                { backgroundColor: report.gradient[1], borderLeftColor: report.color }
              ]}
              activeOpacity={0.9}
              onPress={() => navigation.navigate("StatementReport", { reportType: report.key })}
            >
              <View style={styles.tileHeader}>
                <View style={[styles.iconContainer, { backgroundColor: report.gradient[0] }]}>
                  <Ionicons name={report.icon} size={24} color={report.color} />
                </View>
                <View >
                      <Text style={styles.tileTitle}>{t(report.title)}</Text>
              <Text style={styles.tileDescription}>{t(report.description)}</Text></View>
              </View>
              
        
              
              <View style={styles.tileFooter}>
                <Text style={styles.viewText}>{t('viewReport')}</Text>
                <Ionicons name="chevron-forward" size={16} color={report.color} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: scale.wp(5.2),
    paddingTop: scale.hp(2.1),
  },
  header: {
    marginBottom: scale.hp(3.1),
  },
  title: {
    fontSize: scale.hp(3.1),
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: scale.hp(1.05),
  },
  subtitle: {
    fontSize: scale.hp(1.8),
    color: Colors.textSecondary,
    lineHeight: scale.hp(2.6),
  },
  grid: {
    gap: scale.hp(2.1),
    marginBottom: scale.hp(3.1),
  },
  tile: {
    borderRadius: scale.hp(2.1),
    padding: scale.hp(2.6),
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: scale.hp(0.25),
    },
    shadowOpacity: 0.1,
    shadowRadius: scale.hp(0.5),
    elevation: 5,
  },
  tileHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignContent: "center",
    alignItems: "center",
    marginBottom: scale.hp(2.1),
  },
  iconContainer: {
    width: scale.wp(12.5),
    height: scale.wp(12.5),
    borderRadius: scale.hp(1.55),
    justifyContent: "center",
    marginEnd: scale.hp(2),
    alignItems: "center",
  },
  tileTitle: {
    fontSize: scale.hp(2.35),
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: scale.hp(1.05),
  },
  tileDescription: {
    fontSize: scale.hp(1.8),
    color: Colors.textSecondary, 
    lineHeight: scale.hp(2.6),
    width: scale.wp(65),
    // marginBottom: scale.hp(2.1),
  },
  tileFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  viewText: {
    fontSize: scale.hp(1.8),
    fontWeight: "500",
    color: Colors.textPrimary,
  },
  statsSection: {
    marginBottom: scale.hp(3.1),
  },
  sectionTitle: {
    fontSize: scale.hp(2.35),
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: scale.hp(2.1),
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: scale.wp(3.1),
  },
  statCard: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderRadius: scale.hp(1.55),
    padding: scale.hp(2.1),
    alignItems: "center",
  },
  statValue: {
    fontSize: scale.hp(2.1),
    fontWeight: "700",
    color: Colors.textPrimary,
    marginTop: scale.hp(1.05),
    marginBottom: scale.hp(0.5),
  },
  statLabel: {
    fontSize: scale.hp(1.55),
    color: Colors.textSecondary,
    textAlign: "center",
  },
});