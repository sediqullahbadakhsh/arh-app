import React from "react";
import { SafeAreaView, View, StyleSheet,Text } from "react-native";
import { Colors } from "../theme/colors";
import AuthHeader from "../components/AuthHeader";
import PrimaryButton from "../components/PrimaryButton";
import OutlineButton from "../components/OutlineButton";

export default function SignUpChooser({ navigation }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <AuthHeader title="Create Account" onBack={() => navigation.goBack()} />
      <View style={styles.container}>
      <View style={{marginTop: 40}}>
          <PrimaryButton
          label="Sign up as Customer"
          onPress={() => navigation.navigate("SignUpCustomer")}
          style={{ marginBottom: 12 }}
        />
        {/* Divider */}
                <View style={styles.dividerRow}>
                  <View style={styles.divider} />
                  <Text style={styles.dividerText}>BECOME ONE OF OUR AGENT</Text>
                  <View style={styles.divider} />
                </View>

         
        <OutlineButton
          label="Sign up as Merchant"
          onPress={() => navigation.navigate("SignUpMerchant")}
          style={{backgroundColor: "transparent", borderColor: "#DB8510", fontFamily: "dmsansRegulars", color: "#E20E02"}}
        />
      </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 30,
    marginBottom: 30,
  },
    dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 20,
  },
  divider: { flex: 1, height: 1, backgroundColor: Colors.divider },
  dividerText: { marginHorizontal: 12, color: "#666666", fontSize: 13, fontFamily: "dmsansMedium" },
  divider: { flex: 1, height: 1, backgroundColor: Colors.divider },
  dividerText: { marginHorizontal: 12, color: "#666666", fontSize: 13, fontFamily: "dmsansMedium" },
  safeArea: { flex: 1, backgroundColor: Colors.white },
  container: {
    flex: 1,
    paddingHorizontal: 36,
    paddingTop: 18,
    backgroundColor: Colors.pageBackColor,
  },
});
