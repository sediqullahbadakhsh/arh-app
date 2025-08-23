import React from "react";
import { SafeAreaView, View, StyleSheet } from "react-native";
import { Colors } from "../theme/colors";
import AuthHeader from "../components/AuthHeader";
import PrimaryButton from "../components/PrimaryButton";
import OutlineButton from "../components/OutlineButton";

export default function SignUpChooser({ navigation }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <AuthHeader title="Create Account" onBack={() => navigation.goBack()} />
      <View style={styles.container}>
        <PrimaryButton
          label="Sign up as Customer"
          onPress={() => navigation.navigate("SignUpCustomer")}
          style={{ marginBottom: 12 }}
        />
        <OutlineButton
          label="Sign up as Merchant"
          onPress={() => navigation.navigate("SignUpMerchant")}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.white },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 18,
    backgroundColor: Colors.white,
  },
});
