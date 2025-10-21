import React from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../theme/colors";
import ServiceHeader from "../../components/ServiceHeader";

const REPORT_TYPES = {
  STATEMENT: {
    key: "STATEMENT",
    title: "Statement Report",
    description: "View transaction history, balances, and financial statements",
    icon: "document-text-outline",
    color: "#CD0C02",
    gradient: ["#FFE5E5", "#FFF5F5"],
  },
  TRANSACTION: {
    key: "TRANSACTION",
    title: "Transaction Report",
    description: "Detailed transaction analysis and summaries",
    icon: "swap-horizontal-outline",
    color: "#3B82F6",
    gradient: ["#E0F2FE", "#F0F9FF"],
  },
  AGENT: {
    key: "AGENT",
    title: "Agent Report",
    description: "Agent performance and commission reports",
    icon: "people-outline",
    color: "#10B981",
    gradient: ["#D1FAE5", "#ECFDF5"],
  },
};

export default function ReportsHome({ navigation }) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
      <ServiceHeader title="Reports & Analytics" onBack={() => navigation.goBack()} />
      
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Financial Reports</Text>
          <Text style={styles.subtitle}>
            Access detailed reports and analytics for your business
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
              </View>
              
              <Text style={styles.tileTitle}>{report.title}</Text>
              <Text style={styles.tileDescription}>{report.description}</Text>
              
              <View style={styles.tileFooter}>
                <Text style={styles.viewText}>View Report</Text>
                <Ionicons name="chevron-forward" size={16} color={report.color} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Stats Section */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Quick Overview</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="arrow-down-circle-outline" size={20} color="#EF4444" />
              <Text style={styles.statValue}>AFN 12,450</Text>
              <Text style={styles.statLabel}>Total Debit</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="arrow-up-circle-outline" size={20} color="#10B981" />
              <Text style={styles.statValue}>AFN 8,720</Text>
              <Text style={styles.statLabel}>Total Credit</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="wallet-outline" size={20} color="#3B82F6" />
              <Text style={styles.statValue}>AFN 45,230</Text>
              <Text style={styles.statLabel}>Current Balance</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  grid: {
    gap: 16,
    marginBottom: 24,
  },
  tile: {
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  tileHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  tileTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  tileDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  tileFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  viewText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.textPrimary,
  },
  statsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: "center",
  },
});