// src/screens/TransferToPrimaryScreen.jsx
import React, { useMemo, useState } from "react";
import { SafeAreaView, View, Text, StyleSheet } from "react-native";
import { Colors } from "../theme/colors";
import ServiceHeader from "../components/ServiceHeader";
import InputField from "../components/InputField";
import PrimaryButton from "../components/PrimaryButton";

export default function TransferToPrimaryScreen({ navigation, route }) {
  const startBalance = route.params?.balance ?? 0;
  const [amount, setAmount] = useState(String(startBalance));

  const valid = useMemo(() => {
    const n = Number(amount.replace(/,/g, ""));
    return !Number.isNaN(n) && n > 0 && n <= startBalance;
  }, [amount, startBalance]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
      <ServiceHeader
        title="Transfer To Primary Wallet"
        onBack={() => navigation.goBack()}
      />
      <View style={styles.container}>
        <Text style={styles.label}>Enter Amount</Text>
        <InputField
          value={amount}
          onChangeText={setAmount}
          placeholder="0 AF"
          keyboardType="numeric"
        />

        <PrimaryButton
          label="Continue"
          onPress={() =>
            navigation.replace("TransferToPrimarySuccess", {
              amount: Number(amount),
            })
          }
          style={{ marginTop: 24, opacity: valid ? 1 : 0.5 }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 16 },
  label: { fontSize: 13, color: Colors.textPrimary, marginBottom: 8 },
});
