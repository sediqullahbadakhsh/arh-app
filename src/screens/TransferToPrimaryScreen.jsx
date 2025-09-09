// src/screens/TransferToPrimaryScreen.jsx
import React, { useMemo, useState } from "react";
import { SafeAreaView, View, Text, StyleSheet, Alert } from "react-native";
import { Colors } from "../theme/colors";
import ServiceHeader from "../components/ServiceHeader";
import InputField from "../components/InputField";
import PrimaryButton from "../components/PrimaryButton";
import { useUser } from "../context/userContext";
import { transferApiToMainWallet } from "../services/merchantApi";

export default function TransferToPrimaryScreen({ navigation, route }) {

  const {user, setUser} = useUser()
  const startBalance = route.params?.balance ?? 0;
  const [amount, setAmount] = useState(String(startBalance));
  const [refetchWallets, setRefetchWallet] = useState(false)

  const valid = useMemo(() => {
    const n = Number(amount.replace(/,/g, ""));
    return !Number.isNaN(n) && n > 0 && n <= startBalance;
  }, [amount, startBalance]);

  const transferApi = async()=>{
    try {

      const payload = {
       available_amount: false,
       amount :  amount
      }

      const res = await transferApiToMainWallet(payload, user?.id )
       navigation.replace("TransferToPrimarySuccess", {
              amount: Number(amount),
            })
      
    } catch (error) {
        console.log("this is transfer api  error: ", error)
                const message =
                error.response?.data?.error || // server error message
                error.message ||               // network error
                "Failed to transfer api to main wallet";
            
              console.log("this is recharge error:", message);
              Alert.alert("Failed To Recharge", message);
      
    }
  }
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
          onPress={transferApi}
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
