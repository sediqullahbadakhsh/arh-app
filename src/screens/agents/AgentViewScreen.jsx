import React from "react";
import { SafeAreaView, View, Text, StyleSheet } from "react-native";
import { Colors } from "../../theme/colors";
import ServiceHeader from "../../components/ServiceHeader";

export default function AgentViewScreen({ navigation, route }) {
  const { agent } = route.params || {};
  if (!agent) return null;

  console.log("this is agent information: ", agent)

  const name = `${agent.firstName} ${agent.lastName}`;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
      <ServiceHeader title="Agent Details" onBack={() => navigation.goBack()} />
      <View style={styles.container}>
        <Row k="username" v={agent?.user?.username} />
        <Row k="Status" v={agent.user?.status === "active" ? "Active" : "Inactive"} />
        <Row k="Phone" v={agent.user?.mobileNumber} />
        <Row k="Email" v={agent.user?.email} />
        <Row k="Alternative Contact" v={agent.alternativeContact} />
        <Row k="Commission Rate" v={agent.commission_rate == null ? "Not Set Yet" : agent?.commission_rate} />
        <Row k="Country" v={agent.countryDetails?.countryName?.en} />
        <Row k="Province" v={agent.provinceDetails?.provinceName?.en} />
        <Row k="District" v={agent.districtDetails?.districtName?.en} />
        <Row k="Location" v={agent.address} />
      </View>
    </SafeAreaView>
  );
}

function Row({ k, v }) {
  return (
    <View style={styles.row}>
      <Text style={styles.key}>{k}</Text>
      <Text style={styles.val}>{v}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 24, paddingTop: 12 },
  row: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F1F1",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  key: { color: Colors.textSecondary, fontSize: 13 },
  val: { color: Colors.textPrimary, fontSize: 14, fontWeight: "600" },
});
